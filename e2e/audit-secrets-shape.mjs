/**
 * docs/issues/0132 Option 2 (shared with 0131 Option 3) — secrets-shape guard.
 *
 * Scans the WORKING TREE of tracked, secret-suggestive files across the workspace's repos for
 * credential-shaped values. Working tree, not HEAD, because 0090's hazard is exactly a live key
 * added to a working copy of a TRACKED .env — one `git add .` from being committed; `.gitignore`
 * cannot protect an already-tracked file.
 *
 * File boundary is name-based — the same boundary as the 0090/0131/0132 sweeps that motivated
 * this guard (`git ls-files | grep -iE "\.env|secret|credential|cypress\.env"` + service.json).
 * It is a tripwire for the recurring class, not a full-content entropy scanner.
 *
 * Verdict model (docs/issues/0132 "Testing criteria" — exits non-zero on NEW findings only):
 *   - KNOWN   : a finding already tracked by an open issue (0090 Gemini working copies,
 *               0131 committed SendGrid key) → WARN, named with its issue, exit 0.
 *   - ALLOWED : recorded dev defaults from 0132 Option 1's classification → silent.
 *   - NEW     : anything else credential-shaped → exit 1, naming repo/path/line/variable.
 * ⚠️ Values are never printed — only variable name, shape (prefix + length) and location.
 *
 *     node e2e/audit-secrets-shape.mjs
 */
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const WORKSPACE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

const REPOS = [
  'typerefinery',
  'typerefinery-websight',
  'widget-graph-viz',
  'widget-graph-viz-composer',
  'widget-graph-viz-overview',
]

/** Tracked paths worth reading — the sweep's own boundary. */
const FILE_PATTERN = /(^|\/)(\.env[^/]*|[^/]*\.env|[^/]*(secret|credential)[^/]*|cypress\.env\.json|service\.json)$/i

/** Shape patterns. Vendor prefixes are matched anywhere; generic only in assignments. */
const VENDOR = [
  { name: 'SendGrid', re: /SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/ },
  { name: 'Google API', re: /AIza[0-9A-Za-z_-]{35}/ },
]
// KEY=..., KEY: "...", "key": "..." — value 32+ chars with letters AND digits.
const ASSIGN = /^\s*(?:export\s+)?["']?([A-Za-z0-9_.-]*(?:KEY|SECRET|TOKEN|PASSWORD|PASSWD)[A-Za-z0-9_.-]*)["']?\s*[=:]\s*["']?([A-Za-z0-9+/_=.-]{32,})/i

/** 0132 Option 1 allow-list — recorded dev defaults (repo, path suffix, variable). */
const ALLOWED = [
  { repo: 'typerefinery', file: 'services/bpmn-client/.env', vars: ['API_KEY'] },
  { repo: 'typerefinery', file: 'services/bpmn-server/.env', vars: ['API_KEY', 'SESSION_SECRET'] },
  { repo: 'typerefinery', file: 'services/bpmn-server/service.json', vars: ['API_KEY', 'SESSION_SECRET'] },
  { repo: 'typerefinery', file: 'services/bpmn-server/test/feature/.env', vars: ['API_KEY'] },
  { repo: 'typerefinery-websight', file: 'tests/end-to-end/cypress.env.json', vars: ['loginUsername', 'loginPassword'] },
  { repo: 'typerefinery-websight', file: 'environment/local/.env', vars: ['WS_ADMIN_USERNAME'] },
]

/** Findings already tracked by an open issue — warn, never fail. */
const KNOWN = [
  { repo: 'typerefinery', file: 'services/bpmn-server/test/feature/.env', variable: 'SENDGRID_API_KEY', issue: '0131 (committed+pushed; revoke is human-gated)' },
  { repo: 'typerefinery', file: '.env', variable: 'GEMINI_API_KEY', issue: '0090 (working copy of a tracked file)' },
  { repo: 'widget-graph-viz', file: '.env', variable: 'GEMINI_API_KEY', issue: '0090' },
  { repo: 'widget-graph-viz-composer', file: '.env', variable: 'GEMINI_API_KEY', issue: '0090' },
  { repo: 'widget-graph-viz-overview', file: '.env', variable: 'GEMINI_API_KEY', issue: '0090' },
]

const shape = (v) => `${v.slice(0, 3)}…(${v.length} chars)`
const findings = []

for (const repo of REPOS) {
  const root = path.join(WORKSPACE, repo)
  if (!fs.existsSync(path.join(root, '.git'))) {
    console.log(`⚠️ ${repo}: not a git repo here — skipped`)
    continue
  }
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, maxBuffer: 64 * 1024 * 1024 })
    .toString('utf8').split('\0').filter(Boolean)
  const candidates = tracked.filter((f) => FILE_PATTERN.test(f))
  for (const file of candidates) {
    const full = path.join(root, file)
    let text
    try {
      if (fs.statSync(full).size > 512 * 1024) continue
      text = fs.readFileSync(full, 'utf8')
    } catch { continue } // deleted in working tree etc.
    text.split(/\r?\n/).forEach((line, i) => {
      const hits = []
      for (const v of VENDOR) {
        const m = line.match(v.re)
        if (m) hits.push({ variable: (line.match(/([A-Za-z0-9_.-]+)\s*[=:]/) || [, '(inline)'])[1], kind: v.name, value: m[0] })
      }
      const a = line.match(ASSIGN)
      if (a && /[A-Za-z]/.test(a[2]) && /[0-9]/.test(a[2])) hits.push({ variable: a[1], kind: 'high-entropy assignment', value: a[2] })
      for (const h of hits) {
        if (ALLOWED.some((x) => x.repo === repo && x.file === file && x.vars.includes(h.variable))) continue
        const known = KNOWN.find((x) => x.repo === repo && x.file === file && x.variable === h.variable)
        findings.push({ repo, file, line: i + 1, variable: h.variable, kind: h.kind, shape: shape(h.value), known })
      }
    })
  }
  console.log(`${repo}: ${candidates.length} tracked secret-suggestive file(s) scanned`)
}

// Dedup (a vendor prefix inside an assignment can double-hit the same line/variable).
const seen = new Set()
const unique = findings.filter((f) => {
  const k = `${f.repo}|${f.file}|${f.line}|${f.variable}`
  if (seen.has(k)) return false
  seen.add(k)
  return true
})
const knowns = unique.filter((f) => f.known)
const fresh = unique.filter((f) => !f.known)

for (const f of knowns) console.log(`⚠️ KNOWN ${f.repo}/${f.file}:${f.line} ${f.variable} [${f.kind}, ${f.shape}] — issue ${f.known.issue}`)
for (const f of fresh) console.log(`🔴 NEW   ${f.repo}/${f.file}:${f.line} ${f.variable} [${f.kind}, ${f.shape}] — no verdict on record; classify per 0132 or revoke per 0131's pattern`)

console.log(`\n${unique.length} credential-shaped finding(s) · ${knowns.length} known (0090/0131) · ${fresh.length} NEW`)
if (fresh.length) { console.log('🔴 secrets-shape guard FAILED — new credential-shaped value(s) in tracked files'); process.exit(1) }
console.log('✅ no new credential-shaped values in tracked secret-suggestive files')
