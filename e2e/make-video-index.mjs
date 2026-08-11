// Turn a recorded run's artefacts into a browsable demo index.
//
// Playwright records ONE VIDEO PER TEST, so a runsheet run produces ~35 clips in directories named
// like "03-composer-Act-3-—-Incide-0d2d6-…-runsheet". That is unusable as a demo unless something
// maps them back to step IDs in runsheet order.
//
// Writes <runDir>/demo-index.md: one row per step, in demo order, linking the video, the trace and
// the final screenshot, with each step's runsheet title and result.
//
// ⚠️ Reads the step titles out of runsheet.ts as TEXT rather than importing it — plain Node cannot
// parse TypeScript, and an index generator that only runs under a transpiler is one more thing that
// breaks when someone reaches for it.
//
// Usage: node make-video-index.mjs <runDir> [playwright.log]

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const here = path.dirname(fileURLToPath(import.meta.url))
const runDir = process.argv[2]
const logPath = process.argv[3]
if (!runDir) {
  console.error('usage: node make-video-index.mjs <runDir> [playwright.log]')
  process.exit(1)
}

// --- step catalogue, read as text -------------------------------------------
const STEPS = new Map()
const rt = fs.readFileSync(path.join(here, 'runsheet.ts'), 'utf8')
for (const m of rt.matchAll(/'(P\d-S\d+)':\s*\{\s*title:\s*'((?:[^'\\]|\\.)*)'/g)) {
  STEPS.set(m[1], m[2].replace(/\\'/g, "'"))
}
if (!STEPS.size) {
  console.error('could not read any step titles from runsheet.ts')
  process.exit(1)
}

const outputDir = path.join(runDir, 'test-output')
if (!fs.existsSync(outputDir)) {
  console.error(`no test-output under ${runDir}`)
  process.exit(1)
}

// --- results from the run log, if given -------------------------------------
const result = new Map()
const duration = new Map()
if (logPath && fs.existsSync(logPath)) {
  for (const line of fs.readFileSync(logPath, 'utf8').split('\n')) {
    const m = line.match(/^\s{2}(ok|x|-)\s+\d+\s+\[[^\]]+\]\s+›.*›\s*(P\d-S\d+)\s*—\s*(.*?)\s*$/)
    if (!m) continue
    result.set(m[2], m[1] === 'ok' ? 'PASS' : m[1] === 'x' ? 'FAIL' : 'SKIPPED')
    const d = m[3].match(/\(([^)]+)\)\s*$/)
    if (d) duration.set(m[2], d[1])
  }
}

// --- match artefact directories to steps ------------------------------------
const dirs = fs.readdirSync(outputDir, { withFileTypes: true }).filter((d) => d.isDirectory())

/**
 * Playwright names a directory `<file>-<Act …>-<hash>-<tail of the test title>-<project>`, e.g.
 *   01-incidents-Act-1-—-All-I-d0853-surfaces-an-error-in-the-UI-runsheet
 *
 * ⚠️ Only the TAIL identifies the step. Matching the whole slug gives every Act 1 directory a free
 * point for the word "incidents" in its prefix, so a step whose title happens to contain that word
 * outscores the step the directory actually belongs to, claims it, and the true owner is reported as
 * having no artefact. That is how P1-S8 went missing on the first run of this generator.
 */
const tailOf = (name) => {
  const m = name.match(/-[0-9a-f]{5,6}-(.*?)-runsheet$/i)
  return (m ? m[1] : name).toLowerCase()
}

/**
 * The directory also names the spec file it came from — `01-incidents`, `02-overview`,
 * `03-composer`, `05-forms` — which fixes the act. Constraining candidates to that act removes a
 * whole class of misattribution: without it, P1-S4 ("Choosing **Incident** opens the centred Create
 * **Incident** modal") outscored P2-S1 on the directory whose tail is "he-incident-and-its-objects",
 * and took its video. A demo index that shows the wrong clip for a step is worse than none.
 */
const actOf = (name) => {
  const m = name.match(/^0(\d)-/)
  return m ? `P${m[1]}` : null
}

const byStep = new Map()
const unmatched = []
for (const d of dirs) {
  const files = fs.readdirSync(path.join(outputDir, d.name))
  const tail = tailOf(d.name)
  const act = actOf(d.name)
  // Score every candidate, then take the best one that is still UNCLAIMED.
  //
  // ⚠️ Taking only the single best and dropping the directory when that step is already taken loses
  // clips to ties. P3-S12's truncated tail ("…out-of-unattached-context") shares exactly the words
  // "unattached" and "context" with P3-S4, so it tied, lost on iteration order, and its video was
  // discarded — a step silently missing from an index that claimed to cover the run.
  const scored = []
  for (const [id, title] of STEPS) {
    if (act && !id.startsWith(act + '-')) continue
    // ⚠️ Dedupe: a title repeating a word ("Incident … Incident") would otherwise score twice for a
    // single match and beat the step the directory actually belongs to.
    const words = [...new Set(title.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3))]
    if (!words.length) continue
    const matched = words.filter((w) => tail.includes(w))
    // Weight by total matched length: a long distinctive word is better evidence than two short ones.
    const score = matched.length
    const weight = matched.reduce((n, w) => n + w.length, 0)
    if (score) scored.push({ id, score, weight })
  }
  scored.sort((a, b) => b.score - a.score || b.weight - a.weight)
  const pick = scored.find((c) => !byStep.has(c.id))
  const best = pick?.id ?? null
  const bestScore = pick?.score ?? 0
  // Two matching words is the threshold: one is too easy to hit by accident on a truncated tail.
  if (best && bestScore >= 2) {
    byStep.set(best, {
      dir: d.name,
      video: files.find((f) => f.endsWith('.webm')),
      trace: files.find((f) => f === 'trace.zip'),
      shot: files.find((f) => f.endsWith('.png')),
    })
  } else {
    unmatched.push(`${d.name}  (best=${best ?? 'none'} score=${bestScore})`)
  }
}

// --- write -------------------------------------------------------------------
const rel = (dir, f) => (f ? encodeURI(`test-output/${dir}/${f}`) : null)
const rows = []
for (const [id, title] of STEPS) {
  const a = byStep.get(id)
  if (!a) continue
  rows.push({ id, title, result: result.get(id) || '—', dur: duration.get(id) || '', a })
}

const out = []
out.push(`# Demo recording — ${path.basename(runDir)}`)
out.push('')
out.push('One clip **per runsheet step**, in demo order.')
out.push('')
out.push('⚠️ Playwright records a separate video per test, so this is a set of short clips rather than')
out.push('one continuous film. That makes a single step easy to pull up, and means there is no single')
out.push('file to play end to end.')
out.push('')
out.push(`**${rows.length} steps recorded.**`)
out.push('')
out.push('| Step | Result | Duration | What it shows | Video | Trace | Final frame |')
out.push('|---|---|---|---|---|---|---|')
for (const r of rows) {
  const v = r.a.video ? `[video](${rel(r.a.dir, r.a.video)})` : '—'
  const t = r.a.trace ? `[trace](${rel(r.a.dir, r.a.trace)})` : '—'
  const s = r.a.shot ? `[png](${rel(r.a.dir, r.a.shot)})` : '—'
  out.push(`| **${r.id}** | ${r.result} | ${r.dur} | ${r.title} | ${v} | ${t} | ${s} |`)
}
out.push('')
out.push('## Viewing a trace')
out.push('')
out.push('A trace is the better artefact for reviewing behaviour — interactive, with DOM snapshots,')
out.push('network and console. The video is what to show someone who is not debugging.')
out.push('')
out.push('```sh')
out.push('cd typerefinery-websight/e2e')
out.push('./node_modules/.bin/playwright show-trace <path-to-trace.zip>')
out.push('```')

fs.writeFileSync(path.join(runDir, 'demo-index.md'), out.join('\n') + '\n')
console.log(`wrote ${path.join(runDir, 'demo-index.md')} — ${rows.length} of ${STEPS.size} steps indexed`)
if (unmatched.length) {
  console.log(`⚠️ ${unmatched.length} artefact directory(ies) matched no step:`)
  unmatched.forEach((u) => console.log('   ' + u))
}
const missing = [...result.keys()].filter((id) => !byStep.has(id))
if (missing.length) console.log(`⚠️ ran but no artefact found: ${missing.join(', ')}`)
