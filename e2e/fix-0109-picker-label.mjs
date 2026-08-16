/**
 * docs/issues/0109 — the reference picker labels every candidate with its TYPE, so 15 identities all
 * read `Extended-Identity` and the closed field, after you pick one, still reads `Extended-Identity`.
 *
 * Root cause, traced 2026-08-16 (0109 recorded it as "❌ Not done"):
 *
 *   1. `POST /stix-orm/utils/connections {object_type:"identity", object_field:"created_by_ref"}`
 *      returns FOUR keys per candidate — `icon_url`, `heading`, `description`, `tooltip` — and
 *      `heading` is the *type* label by design (`Extended-Identity` / `Identity-System` /
 *      `Identity-Individual`). There is no top-level name field. The candidate's real name lives at
 *      `tooltip.name` (15/15 candidates carry it, 14 distinct).
 *   2. `e2e/author-reference-options.mjs` authored `labelNameInOptionList = heading`, so the
 *      `<option>`'s text — which is what the CLOSED field displays — is the type label.
 *
 * This script repoints that one authored property at `tooltip.name`.
 * `select/clientlibs/functions.js:446` (`readOptionField`) resolves dotted paths, and the sibling
 * `keyNameInOptionList` already relies on that with `tooltip.id`, so this needs no component change
 * and no deploy — it works against the clientlib that is already live.
 *
 * ⚠️ It fixes ONE of the two halves. The dropdown row's bold heading is rendered at
 * `functions.js:419` as `props.heading || data.label`, so the server's `heading` wins whenever it is
 * present and the rows keep reading `Extended-Identity` until that precedence changes. That half is a
 * generic-component contract change and is raised as decision 0045 rather than improvised here.
 *
 * The STIX knowledge (`tooltip.name`) stays in authored content, which is where
 * `author-reference-options.mjs` put the rest of it and where the data-agnostic rule wants it.
 *
 *     node e2e/fix-0109-picker-label.mjs            # report
 *     node e2e/fix-0109-picker-label.mjs --apply
 */
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
const CONNECTIONS = 'https://flow.typerefinery.localhost:8101/stix-orm/utils/connections'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const FIELD =
  '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms/identity-forms/identity-create' +
  '/jcr:content/rootcontainer/main/form/composite/field/one/container1/reference/field'

const PROP = 'labelNameInOptionList'
const VALUE = 'tooltip.name'
const APPLY = process.argv.includes('--apply')

// Evidence first: the property is only worth changing if the payload really carries the name.
const candidates = await (
  await fetch(CONNECTIONS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ object_type: 'identity', object_field: 'created_by_ref' }),
  })
).json()
const named = candidates.filter((c) => c?.tooltip?.name)
const distinctHeadings = new Set(candidates.map((c) => c.heading))
const distinctNames = new Set(named.map((c) => c.tooltip.name))
console.log(`options source: ${candidates.length} candidates`)
console.log(`  distinct \`heading\` values      : ${distinctHeadings.size}  (${[...distinctHeadings].join(', ')})`)
console.log(`  candidates carrying tooltip.name: ${named.length}/${candidates.length}, ${distinctNames.size} distinct`)
if (named.length !== candidates.length) {
  console.log('⚠️ not every candidate carries tooltip.name — those rows would fall back to their value. Stopping.')
  process.exit(1)
}

const before = await (await fetch(`${CMS}${FIELD}.json`, { headers: { Authorization: auth } })).json()
console.log(`\n${PROP} before: ${JSON.stringify(before[PROP])}`)

if (!APPLY) {
  console.log(`would set ${PROP} = ${VALUE}\n(report only — pass --apply)`)
  process.exit(0)
}

const res = await fetch(PROP_SERVLET, {
  method: 'POST',
  headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ path: FIELD, name: PROP, value: VALUE }),
})
console.log(`  ${PROP} -> ${res.status}`)

// A 200 from the servlet is not evidence the property landed (docs/issues/0057) — read it back.
const after = await (await fetch(`${CMS}${FIELD}.json`, { headers: { Authorization: auth } })).json()
console.log(`${PROP} after : ${JSON.stringify(after[PROP])}`)
const ok = String(after[PROP]) === VALUE
console.log(ok ? 'OK — the closed field will now display the candidate\'s name' : 'FAIL — the property did not land')
process.exit(ok ? 0 : 1)
