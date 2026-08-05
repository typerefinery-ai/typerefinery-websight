/**
 * docs/decisions/0010 Option 1, host half — map the widget's `embed-force-promote` topic to the
 * promote route.
 *
 * The composer widget does **not** call APIs itself: it raises a topic, and the host embed's
 * `_events_` map turns that topic into a `DATA_REQUEST`. `embed-force-remove` is the model, and it
 * shows the two things that matter:
 *
 *   - the URL is the **Traefik https host**, not `localhost:8111`. An https-served widget cannot
 *     reach the direct port — no `Access-Control-Allow-Origin` (docs/issues/0006, decision 0006).
 *   - `nameCustom` carries the topic; `name` is empty.
 *
 *     node e2e/author-promote-host-event.mjs            # report
 *     node e2e/author-promote-host-event.mjs --apply
 */
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const NODE_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-node'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const EVENTS =
  '/content/typerefinery-showcase/pages/os-triage/forms/composer-local/jcr:content/rootcontainer/main/container/container/embed/_events_'
const TOPIC = 'embed-force-promote'
const CONFIG = JSON.stringify({
  method: 'POST',
  url: 'https://flow.typerefinery.localhost:8101/os-triage/promote-subgraph',
})

const APPLY = process.argv.includes('--apply')

const existing = await (await fetch(`${CMS}${EVENTS}.1.json`, { headers: { Authorization: auth } })).json()
const children = Object.keys(existing).filter((k) => !k.startsWith('jcr:'))
const already = Object.entries(existing).find(([, v]) => v && v.topic === TOPIC)

console.log(`_events_ children: ${children.length}`)
if (already) {
  console.log(`"${TOPIC}" already mapped at child "${already[0]}" — nothing to do`)
  process.exit(0)
}

// Children are numbered; take the next free index rather than guessing a name.
const next = String(Math.max(-1, ...children.map((c) => Number(c)).filter((n) => !Number.isNaN(n))) + 1)
console.log(`will add child "${next}": ${TOPIC} -> POST ${JSON.parse(CONFIG).url}`)

if (!APPLY) {
  console.log('\n(report only — pass --apply to author it)')
  process.exit(0)
}

const nodeRes = await fetch(NODE_SERVLET, {
  method: 'POST',
  headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
  // ComponentNodeServlet takes parent + name + json, not a single path.
  body: new URLSearchParams({ parent: EVENTS, name: next, json: JSON.stringify({ 'jcr:primaryType': 'nt:unstructured' }) }),
})
console.log(`create node -> ${nodeRes.status} ${(await nodeRes.text()).slice(0, 200)}`)

for (const [name, value] of [
  ['action', 'DATA_REQUEST'],
  ['config', CONFIG],
  ['name', ''],
  ['nameCustom', TOPIC],
  ['topic', TOPIC],
  ['type', 'emit'],
]) {
  const res = await fetch(PROP_SERVLET, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ path: `${EVENTS}/${next}`, name, value }),
  })
  console.log(`  ${name.padEnd(11)} -> ${res.status}`)
}

// Read it back: a 200 from the servlet is not evidence the property landed (docs/issues/0057).
const after = await (await fetch(`${CMS}${EVENTS}/${next}.json`, { headers: { Authorization: auth } })).json()
console.log('\nread back:', JSON.stringify(after))
console.log(after.topic === TOPIC ? 'OK — topic mapped' : 'FAIL — topic did not land')
