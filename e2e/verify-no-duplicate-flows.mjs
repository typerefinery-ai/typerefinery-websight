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
 *     node e2e/verify-no-duplicate-flows.mjs      # exit 1 if any duplicate exists
 */
import fs from 'fs'
const DB = '../typerefinery/services/totaljs-flow/database/database.json'

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

const duplicates = Object.entries(byGroup).filter(([, ids]) => ids.length > 1)
console.log(`component paths served by a live flow: ${Object.keys(byGroup).length}`)
console.log(`served by MORE THAN ONE: ${duplicates.length}`)
for (const [group, ids] of duplicates) {
  console.log(`   ${ids.join(', ')} -> ...${group.slice(-70)}`)
}
process.exitCode = duplicates.length ? 1 : 0
