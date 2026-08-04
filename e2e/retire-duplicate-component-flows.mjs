/**
 * docs/issues/0052 — retire the remaining duplicate flows, chosen by DESIGN rather than by age.
 *
 * `verify-no-duplicate-flows.mjs` reports 11 component paths served by two live flows each. They are
 * not one kind of thing, and the difference decides which one may be paused:
 *
 *   7 pairs  identical designs on the same topic (dashboard tickers/charts/maps) -> either will do
 *   1 pair   the incidents TABLE: the older flow is the bare template with no data source, the newer
 *            carries `fetchinc` + `maprows`                                       -> keep the newer
 *   3 pairs  the newer flow has ZERO nodes (an import that produced nothing)      -> keep the OLDER
 *
 * ⚠️ **That last class is why "retire the older one" would have been wrong.** Two of the three are
 * demo-critical — `sro-constraints` (P3-S6/S7) and the incidents page form — and their working flow
 * is the *older* of the pair. The rule that survives all three classes is:
 *
 *      keep the flow with the richer design; break ties in favour of the newer id.
 *
 * Pausing IS retirement (Flow exposes no delete). Nothing here is destructive: `--rollback` unpauses
 * everything this script paused, using the record it writes.
 *
 *     node e2e/retire-duplicate-component-flows.mjs            # dry run, prints the plan
 *     node e2e/retire-duplicate-component-flows.mjs --apply
 *     node e2e/retire-duplicate-component-flows.mjs --rollback
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DB = path.resolve(HERE, '../../typerefinery/services/totaljs-flow/database/database.json')
const RECORD = path.resolve(HERE, 'retired-duplicate-flows.json')
const FASTAPI = 'http://localhost:8000'

const apply = process.argv.includes('--apply')
const rollback = process.argv.includes('--rollback')

const pause = async (id, is) => {
  const r = await fetch(`${FASTAPI}/flow/pause/${id}?is=${is}`)
  return `${r.status}`
}

if (rollback) {
  if (!fs.existsSync(RECORD)) throw new Error(`nothing to roll back: ${RECORD} does not exist`)
  const { retired } = JSON.parse(fs.readFileSync(RECORD, 'utf8'))
  for (const r of retired) console.log(`unpause ${r.id} -> ${await pause(r.id, 0)}   (${r.reason})`)
  console.log(`\nrolled back ${retired.length} flow(s)`)
  process.exit(0)
}

const db = JSON.parse(fs.readFileSync(DB, 'utf8'))
const isPaused = (f) => f && (f.paused === true || f.paused === 'true')

const byGroup = {}
const res = await fetch('http://localhost:8111/fapi/streams/')
for (const f of await res.json()) {
  if (!f.group || !f.group.startsWith('/content/')) continue
  if (isPaused(db[f.id])) continue
  ;(byGroup[f.group] = byGroup[f.group] || []).push(f.id)
}

const nodeCount = (id) => Object.keys((db[id] && db[id].design) || {}).length

const plan = []
for (const [group, ids] of Object.entries(byGroup)) {
  if (ids.length < 2) continue
  // Richer design wins; a tie goes to the newer id, which is the rule 11 earlier measurements support.
  const ranked = [...ids].sort((a, b) => nodeCount(b) - nodeCount(a) || (a < b ? 1 : -1))
  const keep = ranked[0]
  for (const id of ranked.slice(1)) {
    plan.push({
      id,
      keep,
      group,
      reason:
        nodeCount(id) === 0
          ? `empty design (0 nodes); keeping ${keep} with ${nodeCount(keep)}`
          : nodeCount(id) === nodeCount(keep)
            ? `identical design (${nodeCount(id)} nodes); keeping the newer ${keep}`
            : `thinner design (${nodeCount(id)} vs ${nodeCount(keep)} nodes); keeping ${keep}`,
    })
  }
}

console.log(`duplicate component paths: ${plan.length}\n`)
for (const p of plan) console.log(`  pause ${p.id}  -> ${p.reason}\n         ...${p.group.slice(-64)}`)

if (!apply) {
  console.log('\n(dry run — pass --apply to retire, --rollback to undo)')
  process.exit(0)
}

const retired = []
for (const p of plan) {
  const status = await pause(p.id, 1)
  console.log(`pause ${p.id} -> ${status}`)
  retired.push({ ...p, status })
}
fs.writeFileSync(RECORD, JSON.stringify({ retired }, null, 1))
console.log(`\nretired ${retired.length} flow(s); record written to ${path.basename(RECORD)}`)
