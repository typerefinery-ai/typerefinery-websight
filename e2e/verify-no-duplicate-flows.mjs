/**
 * docs/decisions/0008 — assert that no component path is served by more than one live flow.
 *
 * `FlowService.retirePredecessorFlows` now pauses a predecessor when provisioning creates a
 * replacement, but that guarantee is only worth having if something checks it. Flow's own list is
 * the cheapest oracle: each entry's `group` is the component path the flow was provisioned for —
 * the same value the service writes as `flowapi_group` — so duplicates are one grouping away.
 *
 * Paused flows do not appear here, which is the point: pausing IS retirement, since Flow exposes
 * no delete (docs/issues/0052).
 *
 * It also reports EMPTY live flows that shadow a working one (docs/issues/0054) — a different fault
 * with a different repair, and the one that makes "retire the newer flow" the wrong rule.
 *
 *     node e2e/verify-no-duplicate-flows.mjs      # exit 1 if any duplicate or empty shell exists
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Resolve against THIS FILE, not the cwd: the sibling scripts are run both from the repo root and
// from e2e/, and a cwd-relative path silently means a different file in each case.
const HERE = path.dirname(fileURLToPath(import.meta.url))
const DB = path.resolve(HERE, '../../typerefinery/services/totaljs-flow/database/database.json')

const res = await fetch('http://localhost:8111/fapi/streams/')
const flows = await res.json()

// ⚠️ /fapi/streams/ has NO paused field, so it lists RETIRED flows as if they were live. Pausing is
// retirement here (Flow has no delete), so the paused state must come from the flow database or the
// count is meaningless -- a first version of this script reported 19 duplicates, most of them
// already-retired flows.
const db = JSON.parse(fs.readFileSync(DB, 'utf8'))
const isPaused = (id) => db[id] && (db[id].paused === true || db[id].paused === 'true')

const byGroup = {}
for (const f of flows) {
  if (!f.group || !f.group.startsWith('/content/')) continue
  if (isPaused(f.id)) continue
  ;(byGroup[f.group] = byGroup[f.group] || []).push(f.id)
}

const nodeCount = (id) => Object.keys((db[id] && db[id].design) || {}).length

const duplicates = Object.entries(byGroup).filter(([, ids]) => ids.length > 1)
console.log(`component paths served by a live flow: ${Object.keys(byGroup).length}`)
console.log(`served by MORE THAN ONE: ${duplicates.length}`)
for (const [group, ids] of duplicates) {
  console.log(`   ${ids.map((i) => `${i}(${nodeCount(i)}n)`).join(', ')} -> ...${group.slice(-70)}`)
}

// docs/issues/0054 — an EMPTY live flow sharing a component path with a working one. Reported
// separately because the repair differs: here the flow to keep is the one with the design, which for
// all three known cases was the OLDER of the pair. "Retire the newer" would have kept the shell and
// thrown away the working flow -- including the one carrying P3-S7's save leg.
//
// A 0-node flow on its own is NOT suspect (a hand-created flow in the designer starts empty), so this
// only fires when a non-empty sibling serves the same component path.
const shells = []
for (const [group, ids] of Object.entries(byGroup)) {
  if (ids.length < 2) continue
  if (!ids.some((i) => nodeCount(i) > 0)) continue
  for (const id of ids.filter((i) => nodeCount(i) === 0)) shells.push({ id, group })
}
console.log(`EMPTY live flows shadowing a working one: ${shells.length}`)
for (const s of shells) console.log(`   ${s.id} (0 nodes) -> ...${s.group.slice(-70)}`)

process.exitCode = duplicates.length || shells.length ? 1 : 0
