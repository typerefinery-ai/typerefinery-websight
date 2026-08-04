/**
 * docs/issues/0052 — the four `pages/*` routes `find-orphan-flows.mjs` could not decide.
 *
 * Those components' `/var` records name a flow that **does not exist in the runtime database at
 * all** (`f2102h002un50d`, `f2103u002un50d`, `f2102m004un50d`, `f2102m002un50d` — all absent), so
 * neither of the two real flows on the route is "the recorded one" and the normal rule could not
 * pick a winner.
 *
 * That also makes them a compounding trap: `isFlowExists()` is false for a ghost id, so the next
 * re-provision takes the `!flowExists` branch and creates *another* flow.
 *
 * Established empirically on `pages/options` (the least demo-critical of the four): pausing the
 * OLDER flow left the route answering 200, so the newer one serves — the same pattern as the seven
 * orphans already retired. This applies that to the rest, one at a time, and **unpauses immediately
 * if a route stops answering**.
 *
 *     node e2e/retire-ghost-page-flows.mjs           # report only
 *     node e2e/retire-ghost-page-flows.mjs --apply
 */
import fs from 'fs'

const DB = '../../typerefinery/services/totaljs-flow/database/database.json'
const FASTAPI = 'http://localhost:8000'
const FLOW_HOST = 'https://flow.typerefinery.localhost:8101'
const APPLY = process.argv.includes('--apply')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

/** older (candidate orphan) -> newer (believed to serve), per page. */
const PAIRS = [
  { page: 'incidents', older: 'f1k3hr008cc50d', newer: 'f2102h001un51d' },
  { page: 'tasks', older: 'f1k3hr011cc51d', newer: 'f2103u001un51d' },
  { page: 'artifacts', older: 'f1k3hr027cc51d', newer: 'f2102m001un51d' },
]

const db = JSON.parse(fs.readFileSync(DB, 'utf8'))

const routeOf = (fid, page) => {
  const f = db[fid]
  if (!f) return null
  const n = Object.values(f.design || {}).find(
    (x) => x.config && typeof x.config.url === 'string' && x.config.url.includes(`/pages/${page}/`),
  )
  return n ? n.config.url.replace(/\/\*$/, '').replace(/\/\{\{id\}\}$/, '') : null
}

const setPaused = async (id, paused) =>
  (await fetch(`${FASTAPI}/flow/pause/${id}?is=${paused ? 1 : 0}`)).status

const probe = async (route) => {
  const res = await fetch(FLOW_HOST + route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  }).catch(() => null)
  return res ? res.status : 0
}

let retired = 0
for (const { page, older, newer } of PAIRS) {
  const route = routeOf(newer, page) || routeOf(older, page)
  if (!route) {
    console.log(`${page}: no route found, skipping`)
    continue
  }
  const before = await probe(route)
  console.log(`\n${page}: ${APPLY ? 'retire' : 'would retire'} ${older} (keeping ${newer})`)
  console.log(`  route -> ${before}`)
  if (!APPLY) continue
  if (before !== 200) {
    console.log('  SKIP — route unhealthy beforehand, so a probe afterwards proves nothing')
    continue
  }

  console.log(`  pause -> ${await setPaused(older, true)}`)
  await new Promise((r) => setTimeout(r, 5000))
  const after = await probe(route)
  console.log(`  route now -> ${after}`)
  if (after !== 200) {
    console.log('  ROUTE BROKE — unpausing, this flow was serving.')
    console.log(`  unpause -> ${await setPaused(older, false)}`)
    continue
  }
  retired++
}
console.log(`\n${APPLY ? `retired ${retired}` : `${PAIRS.length} candidates — re-run with --apply`}`)
