/**
 * docs/issues/0052 — which flows registering a route are ORPHANS?
 *
 * A component's current flow is the one named by `flowapi_flowstreamid` in its `/var` mirror.
 * Any *other* live flow registering the same route is an orphan: `doProcessFlowResource` creates a
 * new flow whenever the stored id is missing (`!hasStoredFlowId`), and in that branch it has no
 * knowledge of the previous flow, so nothing retires it.
 *
 * Read-only. Prints what would be paused; pausing is a separate, deliberate step.
 */
import fs from 'fs'

const DB = '../../typerefinery/services/totaljs-flow/database/database.json'
const BASE = 'https://cms.typerefinery.localhost:8101'
const VAR = '/var/typerefinery/flow'
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const db = JSON.parse(fs.readFileSync(DB, 'utf8'))

/**
 * route -> Set(flow id) for every live flow.
 *
 * Paused flows are excluded: Flow has no delete, so pausing IS retirement (docs/issues/0052), and a
 * retired flow keeps its design. Counting it would report a duplicate that no longer exists.
 */
const byRoute = {}
for (const [fid, f] of Object.entries(db)) {
  if (!f || !f.design) continue
  if (f.paused === true || f.paused === 'true') continue
  for (const n of Object.values(f.design)) {
    const u = n.config && n.config.url
    if (typeof u !== 'string' || !u.startsWith('/')) continue
    ;(byRoute[u] = byRoute[u] || new Set()).add(fid)
  }
}

const duplicated = Object.entries(byRoute).filter(([, s]) => s.size > 1)
console.log(`${duplicated.length} duplicated route(s) of ${Object.keys(byRoute).length}\n`)

const orphans = []
for (const [route, flows] of duplicated) {
  // The route is the component path plus a trailing wildcard/suffix; strip back to the component.
  const componentPath = route.replace(/\/\{\{id\}\}$/, '').replace(/\/\*$/, '').replace(/\/$/, '')
  const varPath = `${VAR}${componentPath.replace('/_jcr_content/', '/jcr:content/')}.json`
  const res = await fetch(`${BASE}${varPath}`, { headers: { Authorization: auth } }).catch(() => null)
  const props = res && res.ok ? await res.json().catch(() => null) : null
  const current = props ? props['flowapi_flowstreamid'] : null

  const others = [...flows].filter((f) => f !== current)
  console.log(route.slice(0, 90))
  console.log(`   flows   : ${[...flows].join(', ')}`)
  console.log(`   /var says: ${current || '(no flowapi_flowstreamid recorded)'}`)
  if (!current) {
    console.log('   -> CANNOT decide safely: /var names no flow, so none can be called the orphan')
  } else if (others.length === flows.size) {
    console.log('   -> CANNOT decide safely: /var names a flow that does not register this route')
  } else {
    console.log(`   -> orphan(s): ${others.join(', ')}`)
    others.forEach((o) => orphans.push({ route, keep: current, orphan: o }))
  }
  console.log()
}

fs.writeFileSync('orphan-flows.json', JSON.stringify(orphans, null, 1))
console.log(`${orphans.length} orphan flow registration(s) -> orphan-flows.json`)
