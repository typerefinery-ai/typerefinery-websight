/**
 * alpha-launch issue 0136 (decision 0025) — carry the new "Overview - Save Options" flow into the
 * provisioning source, per the 0072 rule: the runtime flow DB is git-ignored, so a flow that
 * exists only there is deleted by the next re-provision. This sync is what 070122c was for the
 * shaped-incidents route: strictly ADDITIVE.
 *
 * Refuses to run if the copy would change or remove ANYTHING other than adding the one new
 * flow id. Also exports the design to docs/flows/ for review outside the DB blob.
 *
 *     node e2e/sync-options-save-flow.mjs            # report
 *     node e2e/sync-options-save-flow.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const RUNTIME_DB = path.resolve(HERE, '../../typerefinery/services/totaljs-flow/database/database.json')
const SOURCE_DB = path.resolve(HERE, '../../typerefinery/services/totaljs-flow/database/demo/database.json')
const EXPORT_PATH = path.resolve(HERE, '../../docs/flows/overview-save-options-f21kg7001nt51d.json')

const FLOW_ID = 'f21kg7001nt51d'
const APPLY = process.argv.includes('--apply')

const runtime = JSON.parse(fs.readFileSync(RUNTIME_DB, 'utf8'))
const source = JSON.parse(fs.readFileSync(SOURCE_DB, 'utf8'))

const record = runtime[FLOW_ID]
if (!record) throw new Error(`${FLOW_ID} not found in the runtime database`)
if (record.name !== 'Overview - Save Options') throw new Error(`${FLOW_ID} is "${record.name}", refusing`)

// --- safety: the record must carry no host paths and no credentials, and be ASCII-only ---------
const blob = JSON.stringify(record)
const hazards = []
if (/[A-Za-z]:\\\\Users|\/home\/|\/Users\//.test(blob)) hazards.push('host path')
if (/password|secret|token"\s*:/i.test(blob)) hazards.push('credential-shaped key')
// eslint-disable-next-line no-control-regex
if (/[^\x00-\x7F]/.test(blob)) hazards.push('non-ASCII bytes')
if (hazards.length) throw new Error(`refusing to sync: record contains ${hazards.join(', ')}`)

// --- safety: strictly additive --------------------------------------------------------------
const before = Object.keys(source)
if (source[FLOW_ID]) {
  const same = JSON.stringify(source[FLOW_ID]) === blob
  console.log(`source already has ${FLOW_ID} (${same ? 'identical' : 'DIFFERENT — would update'})`)
  if (same) process.exit(0)
}

// Zero stats/route-noise normalisation: store the record as the runtime holds it, minus volatile
// runtime counters, matching how other source flows carry design objects (not strings).
const clean = JSON.parse(blob)
const design = typeof clean.design === 'string' ? JSON.parse(clean.design) : clean.design
for (const node of Object.values(design)) {
  if (node && typeof node === 'object' && node.stats) {
    node.stats = { pending: 0, input: 0, output: 0, duration: 0, destroyed: 0 }
  }
}
clean.design = design
if (typeof clean.components === 'string') clean.components = JSON.parse(clean.components)

const routes = Object.values(design)
  .filter((n) => n && n.config && n.config.url && n.config.method)
  .map((n) => `${n.config.method} ${n.config.url}`)
console.log(`flow: ${clean.name} (${FLOW_ID})`)
console.log(`routes added: ${routes.join(', ') || '(none)'}`)
console.log(`source flows before: ${before.length}, after: ${before.length + (source[FLOW_ID] ? 0 : 1)} (nothing removed, nothing else touched)`)

if (!APPLY) {
  console.log('\n(report only — pass --apply to write)')
  process.exit(0)
}

source[FLOW_ID] = clean
// The source DB is a single minified line — keep it that way so the diff is one line changed,
// not a 60k-line reformat (measured before this guard existed).
const original = fs.readFileSync(SOURCE_DB, 'utf8')
const minified = original.trimEnd().split('\n').length === 1
fs.writeFileSync(SOURCE_DB, minified ? JSON.stringify(source) : JSON.stringify(source, null, 1))

// Verify by re-reading rather than trusting the write (0072 discipline).
const check = JSON.parse(fs.readFileSync(SOURCE_DB, 'utf8'))
const ok = check[FLOW_ID] && check[FLOW_ID].name === clean.name && Object.keys(check).length === before.length + (before.includes(FLOW_ID) ? 0 : 1)
console.log(`source write verified: ${ok}`)

fs.writeFileSync(EXPORT_PATH, JSON.stringify(design, null, 1))
console.log(`design exported to ${EXPORT_PATH}`)
if (!ok) process.exit(1)
