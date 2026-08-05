/**
 * docs/decisions/0011 Option 1 — give a reference field its options source.
 *
 * GitHub #62 has two halves. The data half (#83) has worked for a while:
 * `POST /stix-orm/utils/connections {object_type, object_field}` returns candidates carrying
 * `icon_url`, `heading`, `description` and `tooltip`. The rendering half never worked, and the
 * reason turned out not to be the Select component at all — `created_by_ref` is authored as a
 * plain **text input** (`stix/forms/fields/input`, `inputType: reference`). There was no option
 * list to render.
 *
 * Option 1 is "reuse the Select's existing data-source mechanism", so this script re-points the
 * authored field at the Select and fills in the source config. The STIX knowledge — the route, and
 * `{object_type, object_field}` — lives here in **authored content**, never in the component
 * (that would repeat docs/issues/0012).
 *
 *   - the URL is the **Traefik https host**: the form is served from
 *     `https://cms.typerefinery.localhost:8101`, and an https page cannot fetch
 *     `http://localhost:8111` — no `Access-Control-Allow-Origin`, plus mixed content
 *     (docs/issues/0006, decision 0006).
 *   - `keyNameInOptionList` is `tooltip.id`: the candidate's identifier is nested, and the
 *     component now follows a dotted path rather than the response being reshaped.
 *
 *     node e2e/author-reference-options.mjs            # report
 *     node e2e/author-reference-options.mjs --apply
 */
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const NODE_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-node'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const FIELD =
  '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms/identity-forms/identity-create' +
  '/jcr:content/rootcontainer/main/form/composite/field/one/container1/reference/field'

const PARENT = FIELD.slice(0, FIELD.lastIndexOf('/'))
const NAME = FIELD.slice(FIELD.lastIndexOf('/') + 1)
const RESOURCE_TYPE = 'typerefinery/components/stix/forms/fields/select'

// ⚠️ `sling:` is a reserved namespace in ComponentPropertyServlet — it answers 400. The resource
// type has to go through ComponentNodeServlet, which merges its `json` into the existing node.
const PROPS = [
  ['readOptionsFromDataSource', 'https://flow.typerefinery.localhost:8101/stix-orm/utils/connections'],
  ['readMethod', 'POST'],
  ['readPayloadType', 'application/json'],
  ['readPayload', JSON.stringify({ object_type: 'identity', object_field: 'created_by_ref' })],
  ['keyNameInOptionList', 'tooltip.id'],
  ['labelNameInOptionList', 'heading'],
]

const APPLY = process.argv.includes('--apply')

const before = await (await fetch(`${CMS}${FIELD}.json`, { headers: { Authorization: auth } })).json()
console.log('before:', JSON.stringify(before, null, 1))

if (!APPLY) {
  console.log('\nwould set:')
  console.log(`  ${'sling:resourceType'.padEnd(28)} = ${RESOURCE_TYPE}`)
  for (const [name, value] of PROPS) console.log(`  ${name.padEnd(28)} = ${value}`)
  console.log('\n(report only — pass --apply to author it)')
  process.exit(0)
}

const typeRes = await fetch(NODE_SERVLET, {
  method: 'POST',
  headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ parent: PARENT, name: NAME, json: JSON.stringify({ 'sling:resourceType': RESOURCE_TYPE }) }),
})
console.log(`  ${'sling:resourceType'.padEnd(28)} -> ${typeRes.status} ${(await typeRes.text()).slice(0, 120)}`)

for (const [name, value] of PROPS) {
  const res = await fetch(PROP_SERVLET, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ path: FIELD, name, value }),
  })
  console.log(`  ${name.padEnd(28)} -> ${res.status}`)
}

// Read it back: a 200 from the servlet is not evidence the property landed (docs/issues/0057).
const after = await (await fetch(`${CMS}${FIELD}.json`, { headers: { Authorization: auth } })).json()
console.log('\nafter:', JSON.stringify(after, null, 1))
const ok =
  after['sling:resourceType'] === RESOURCE_TYPE && PROPS.every(([name, value]) => String(after[name]) === value)
console.log(ok ? 'OK — reference field now reads its options from the connections source' : 'FAIL — properties did not land')
process.exit(ok ? 0 : 1)
