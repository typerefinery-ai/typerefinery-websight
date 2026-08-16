/**
 * docs/issues/0057 + 0127 — find the authored labels that 0127's sweep could not see.
 *
 * 🔑 **Why a second audit exists.** `fix-0127-labels.mjs` rewrote 598 snake_case labels using
 *
 *     isSnake = /^[a-z0-9]+(_[a-z0-9]+)+$/
 *
 * which is anchored at both ends, so a label carrying ANY trailing punctuation never matched.
 * `object_marking_refs,` — 0057's trailing comma — is exactly that shape, and it is still rendering
 * verbatim on `identity-update` today, months after "fixed on 14 forms" was recorded. The fixer and
 * the auditor normalised differently, so the fixer reported success over a label the auditor counted
 * as broken. That is the same failure this project has now hit five times (0100, 0108, 0150, 0163,
 * and 0127's own trailing-space miss), and the reason this file measures the RESIDUE rather than
 * re-running the same regex.
 *
 * Reports any authored `label` that is snake_case **once stripped of surrounding punctuation and
 * whitespace** but was not already rewritten — i.e. everything the strict regex skipped.
 *
 *     node e2e/audit-0057-label-residue.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const ROOT = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms'
const PKG = path.resolve(
  __dirname,
  '../tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms',
)

const pages = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (!e.isDirectory()) continue
    if (/-(create|update)$/.test(e.name)) pages.push(path.relative(PKG, path.join(d, e.name)).replace(/\\/g, '/'))
    else walk(path.join(d, e.name))
  }
})(PKG)

/** 0127's rule, verbatim — what WAS fixed. */
const isSnakeStrict = (s) => typeof s === 'string' && /^[a-z0-9]+(_[a-z0-9]+)+$/.test(s.trim())

/**
 * The same question asked tolerantly: strip leading/trailing whitespace AND punctuation first.
 * A label is "still plumbing" if what remains is snake_case.
 */
const core = (s) => String(s).trim().replace(/^[^a-z0-9]+/i, '').replace(/[^a-z0-9]+$/i, '')
const isSnakeLoose = (s) => typeof s === 'string' && /^[a-z0-9]+(_[a-z0-9]+)+$/.test(core(s))

const findLabels = async (base) => {
  const found = []
  const seen = new Set()
  const walkNode = async (p, depth) => {
    if (depth > 20 || seen.has(p)) return
    seen.add(p)
    const r = await fetch(`${CMS}${p}.1.json`, { headers: { Authorization: auth } })
    if (!r.ok) return
    const j = await r.json()
    if (typeof j.label === 'string' && j.label.trim()) found.push({ path: p, label: j.label })
    for (const [k, v] of Object.entries(j)) {
      if (v && typeof v === 'object') await walkNode(`${p}/${k}`, depth + 1)
    }
  }
  await walkNode(base, 0)
  return found
}

let all = 0
const residue = []
for (const rel of pages) {
  const labels = await findLabels(`${ROOT}/${rel}/jcr:content`)
  all += labels.length
  for (const l of labels) {
    if (isSnakeStrict(l.label)) residue.push({ ...l, form: rel, why: 'STRICT-MISS (should have been fixed)' })
    else if (isSnakeLoose(l.label)) residue.push({ ...l, form: rel, why: 'PUNCTUATION' })
  }
}

console.log(`${all} authored label(s) across ${pages.length} form panel(s)\n`)
if (!residue.length) {
  console.log('no residue: every authored label is either already human-readable or not snake_case.')
  process.exit(0)
}

const byLabel = new Map()
for (const r of residue) {
  if (!byLabel.has(r.label)) byLabel.set(r.label, [])
  byLabel.get(r.label).push(r)
}
console.log(`⚠️ ${residue.length} label(s) in ${byLabel.size} distinct string(s) that 0127's regex could not see:\n`)
for (const [label, rows] of [...byLabel.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${JSON.stringify(label)}  ×${rows.length}  [${rows[0].why}]`)
  console.log(`      forms: ${[...new Set(rows.map((r) => r.form.split('/').pop()))].slice(0, 8).join(', ')}${rows.length > 8 ? ' …' : ''}`)
}
process.exit(1)
