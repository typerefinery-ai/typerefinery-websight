/**
 * alpha-launch **decision 0037 (Option 1)** — switch on row-click drill-in for Act 1's incidents table.
 *
 * `Mini_App_Tasks.docx` Page 1 specifies the gesture as *"Left-Select or Double-Click on an incident's
 * row"*. The clientlib support is opt-in (`rowClickNavigates`) precisely so the other five authored
 * tables keep their current behaviour; this script turns it on for **one** node.
 *
 * ⚠️ Reads back after writing — per docs/issues/0057, a 200 from the servlet is not evidence the
 * property landed.
 *
 *     node e2e/author-row-click-navigates.mjs            # report only
 *     node e2e/author-row-click-navigates.mjs --apply    # author it
 */
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const TABLE =
  '/content/typerefinery-showcase/pages/os-triage/pages/incidents' +
  '/jcr:content/rootcontainer/container1/form/container2/table'
const PROP = 'rowClickNavigates'
const APPLY = process.argv.includes('--apply')

const read = async () =>
  await (await fetch(`${CMS}${TABLE}.json`, { headers: { Authorization: auth } })).json()

const before = await read()
console.log('=== decision 0037 — row-click drill-in ===')
console.log(`node               : ${TABLE}`)
console.log(`name               : ${before.name}`)
console.log(`sling:resourceType : ${before['sling:resourceType']}`)
console.log(`showActionButtons  : ${before.showActionButtons}`)
console.log(`${PROP.padEnd(19)}: ${before[PROP] ?? '(absent)'}`)

// Refuse to act on the wrong node rather than authoring a property somewhere harmless-looking.
if (!/widgets\/table$/.test(before['sling:resourceType'] || '')) {
  console.error('FAIL - not a table component; refusing to write')
  process.exit(1)
}
if (before[PROP] === 'true' || before[PROP] === true) {
  console.log('\nalready enabled - nothing to do')
  process.exit(0)
}
if (!APPLY) {
  console.log(`\n(report only - would set ${PROP}=true; pass --apply)`)
  process.exit(0)
}

const res = await fetch(PROP_SERVLET, {
  method: 'POST',
  headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ path: TABLE, name: PROP, value: 'true' }),
})
console.log(`\nPOST ${PROP}=true -> ${res.status}`)

const after = await read()
console.log(`read back          : ${PROP} = ${after[PROP] ?? '(absent)'}`)
const ok = after[PROP] === 'true' || after[PROP] === true
console.log(ok ? 'OK - the property landed' : 'FAIL - the property did NOT land')

// The other tables must be untouched: this is opt-in for a reason.
console.log('\n⚠️ scope check - this script writes exactly one node; the other five authored tables')
console.log('   keep rowClickNavigates absent, so their behaviour is unchanged.')
process.exit(ok ? 0 : 1)
