/**
 * docs/issues/0052 — pause the orphaned flows that register a route their component no longer owns.
 *
 * An orphan is a live flow registering a route where the component's `/var` mirror names a
 * *different* flow. They arise because `doProcessFlowResource` creates a new flow whenever the
 * stored id is missing (`!hasStoredFlowId`) and, in that branch, knows nothing about a previous
 * flow — so nothing retires it.
 *
 * Flow exposes **no delete**, only pause: `GET :8000/flow/pause/<id>?is=1` (1 pause, 0 resume).
 * Pausing is therefore the retirement, and it is reversible — which is what makes this safe to do
 * one flow at a time.
 *
 * ⚠️ Only acts on orphans `find-orphan-flows.mjs` could decide **safely**. It deliberately skips the
 * four `pages/*` routes where `/var` names a flow that registers no route at all: there, the current
 * flow cannot be identified, so any choice would be a guess.
 *
 * After each pause the route is probed. If it stops answering, the flow is **unpaused immediately**
 * and the run stops — the orphan was not an orphan.
 *
 *     node e2e/retire-orphan-flows.mjs           # report only
 *     node e2e/retire-orphan-flows.mjs --apply
 */
import fs from 'fs'

const FASTAPI = 'http://localhost:8000'
const FLOW_HOST = 'https://flow.typerefinery.localhost:8101'
const APPLY = process.argv.includes('--apply')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const orphans = JSON.parse(fs.readFileSync('orphan-flows.json', 'utf8'))

const setPaused = async (id, paused) =>
  (await fetch(`${FASTAPI}/flow/pause/${id}?is=${paused ? 1 : 0}`)).status

/** The route as Flow serves it: strip the trailing wildcard the design records. */
const probe = async (route) => {
  const url = FLOW_HOST + route.replace(/\/\{\{id\}\}$/, '').replace(/\/\*$/, '')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  }).catch(() => null)
  return res ? res.status : 0
}

let retired = 0
for (const { route, keep, orphan } of orphans) {
  const before = await probe(route)
  console.log(`\n${APPLY ? 'RETIRE' : 'would retire'} ${orphan}  (keeping ${keep})`)
  console.log(`  route ${route.slice(0, 80)} -> ${before}`)
  if (!APPLY) continue

  if (before !== 200) {
    console.log('  SKIP — route was not healthy before the change, so a probe afterwards proves nothing')
    continue
  }

  const paused = await setPaused(orphan, true)
  await new Promise((r) => setTimeout(r, 4000))
  const after = await probe(route)
  console.log(`  pause -> ${paused}, route now ${after}`)

  if (after !== 200) {
    console.log('  ROUTE BROKE — unpausing and stopping. This flow was serving, not orphaned.')
    console.log(`  unpause -> ${await setPaused(orphan, false)}`)
    break
  }
  retired++
}

console.log(`\n${APPLY ? `retired ${retired} orphan(s)` : `${orphans.length} candidate(s) — re-run with --apply`}`)
