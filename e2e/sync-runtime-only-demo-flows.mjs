/**
 * docs/issues/0095 Option 1 — copy the runtime-only DEMO CAPABILITY flows into the provisioning
 * source, so the demo survives its own recovery procedure.
 *
 * P0-S8 now *reports* these (docs/issues/0095 Option 2, `91519c8f`), but reporting only makes the
 * loss loud. Re-provisioning the flow database — the standard recovery move — still deletes them.
 * Measured 2026-08-12: **59 flows exist only in the runtime**, and these six are demo capabilities:
 *
 *   f21c7p001rn51d  /viz-data/overview-options          Act 2's options
 *   f21d4m001rn51d  /viz-data/composer-options          Act 3's options
 *   f21dij001rn51d  /os-triage/promote-subgraph         P3-S12 / os-threat#84
 *   f21c08001ye51d  /os-triage/rmb-force/remove-object  Act 3's right-click remove
 *   f21ccx001rn51d  /stix-orm/utils/connections         P5-S6's reference picker
 *   f210iy001bt51d  (TMS publisher)                     Act 1's live update (docs/issues/0149)
 *
 * Both databases are JSON objects keyed by flow id (plus a `variables` key), so this is an insert,
 * not a merge: `source[id] = runtime[id]`.
 *
 * ⚠️ It NEVER overwrites an id already present in the source. If one appears there later — because
 * someone did this properly upstream — this becomes a no-op rather than clobbering their version.
 * ⚠️ Writes with tab indentation, matching the file's existing formatting, so the diff stays legible.
 * ⚠️ Both files are ~22 MB. This parses and re-stringifies the SOURCE only, which is what every
 * other flow script in this directory already does successfully; the runtime copy is read-only here.
 *
 *     node e2e/sync-runtime-only-demo-flows.mjs            # report only
 *     node e2e/sync-runtime-only-demo-flows.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { findRouteConflicts } from './lib-flow-routes.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const RUNTIME_DB = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database/database.json')
const SOURCE_DB = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database/demo/database.json')
const APPLY = process.argv.includes('--apply')

/** Why each one matters — printed, and echoed into the commit. */
const FLOWS = {
  f21c7p001rn51d: "Act 2's options (/viz-data/overview-options)",
  f21d4m001rn51d: "Act 3's options (/viz-data/composer-options)",
  f21dij001rn51d: 'P3-S12 / os-threat#84 (/os-triage/promote-subgraph)',
  f21c08001ye51d: "Act 3's right-click remove (/os-triage/rmb-force/remove-object)",
  f21ccx001rn51d: "P5-S6's reference picker (/stix-orm/utils/connections)",
  f210iy001bt51d: "Act 1's live update (TMS publisher, docs/issues/0149)",
}

const runtime = JSON.parse(fs.readFileSync(RUNTIME_DB, 'utf8'))
const source = JSON.parse(fs.readFileSync(SOURCE_DB, 'utf8'))
console.log(`runtime entries: ${Object.keys(runtime).length}   source entries: ${Object.keys(source).length}\n`)

const toAdd = []
for (const [id, why] of Object.entries(FLOWS)) {
  const r = runtime[id]
  if (!r) {
    console.log(`  ✗ ${id}  NOT IN THE RUNTIME either — nothing to copy (${why})`)
    continue
  }
  if (source[id]) {
    console.log(`  = ${id}  already in the source — left alone (${why})`)
    continue
  }
  const nodes = Object.keys(r.design || {}).length
  console.log(`  + ${id}  ${String(r.name || '').padEnd(28)} ${nodes} nodes   ${why}`)
  toAdd.push(id)
}

console.log(`\n${toAdd.length} flow(s) to add.`)
if (!toAdd.length) process.exit(0)
if (!APPLY) {
  console.log('dry run - nothing written. Re-run with --apply.')
  process.exit(0)
}

// docs/issues/0183 follow-up 1 — same guard as sync-runtime-only-form-legs.mjs: a "runtime-only"
// id may be the re-minted current copy of a flow the source still carries UNPAUSED under an old
// id. Detect the route collision; only --pause-superseded authorises retiring the old claimants.
const PAUSE_SUPERSEDED = process.argv.includes('--pause-superseded')
const conflicts = findRouteConflicts(toAdd, runtime, source)
const skipped = []
for (const [cid, losers] of Object.entries(conflicts)) {
  for (const l of losers) console.log(`  ⚠️ ${cid} collides with UNPAUSED source flow ${l.id} (${l.name}) on ${l.routes.join(', ')}`)
  if (PAUSE_SUPERSEDED) {
    for (const l of losers) { source[l.id].paused = true; console.log(`    → paused ${l.id}`) }
  } else {
    skipped.push(cid)
    console.log(`    → SKIPPING ${cid} (re-run with --pause-superseded to add it and pause the old claimants)`)
  }
}
for (const id of toAdd.filter((i) => !skipped.includes(i))) source[id] = runtime[id]
fs.writeFileSync(SOURCE_DB, JSON.stringify(source, null, '\t'))
console.log(`\nsource written: ${SOURCE_DB}${skipped.length ? ` (skipped ${skipped.length} conflicted)` : ''}`)
console.log(`source entries now: ${Object.keys(JSON.parse(fs.readFileSync(SOURCE_DB, 'utf8'))).length}`)
console.log('\nNext: re-run the drift audit and P0-S8, then REMOVE the newly-synced ids from')
console.log("P0-S8's KNOWN_RUNTIME_ONLY — an exemption that outlives its reason is a hole.")
