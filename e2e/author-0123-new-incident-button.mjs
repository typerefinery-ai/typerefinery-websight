/**
 * docs/issues/0123 / 0110 — the docx toolbar is [New Incident][search box] (image2.png), and the
 * build's DEAD blue Search button sits exactly in that slot. Convert it: label "New Incident",
 * buttonType action + actionType openModal + actionUrl → the createincident form (the SAME
 * mechanism the deployed bundle already runs for the button component — verified in the live
 * clientlib before authoring, docs/issues/0061-style). actionSuccessNavigateTo is authored now
 * but only activates when the 0044 window deploys the matching component change (the deployed
 * openModal callback is a stub) — until then the + Create dropdown path remains the
 * create→overview journey, deliberately un-hidden so no green behaviour is traded away.
 *
 * User directive 2026-08-16 ~21:45Z: validate Act screens against the docx and make the changes.
 *
 *     node e2e/author-0123-new-incident-button.mjs            # report only
 *     node e2e/author-0123-new-incident-button.mjs --apply
 */
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const NODE =
  '/content/typerefinery-showcase/pages/os-triage/pages/incidents/jcr:content/rootcontainer/container1/form/container/container_1/container_1_1/button_1'
const PROPS = [
  ['label', 'New Incident'],
  ['buttonType', 'action'],
  ['actionType', 'openModal'],
  ['actionUrl', '/content/typerefinery-showcase/pages/os-triage/forms/createincident.html'],
  ['actionModalTitle', 'Create Incident'],
  // inert until the 0044 deploy ships the button component's success-navigate support:
  ['actionSuccessNavigateTo', '/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html'],
]

const APPLY = process.argv.includes('--apply')
const before = await (await fetch(`${CMS}${NODE}.json`, { headers: { Authorization: auth } })).json()
console.log('current:', JSON.stringify({ label: before.label, buttonType: before.buttonType, actionType: before.actionType }))
if (!APPLY) {
  for (const [k, v] of PROPS) console.log(`  ~ would set ${k} = ${v}`)
  console.log('(report only — pass --apply)')
  process.exit(0)
}
for (const [name, value] of PROPS) {
  const res = await fetch(PROP_SERVLET, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ path: NODE, name, value }),
  })
  console.log(`  ${name.padEnd(24)} -> ${res.status}`)
}
const after = await (await fetch(`${CMS}${NODE}.json`, { headers: { Authorization: auth } })).json()
const ok = after.label === 'New Incident' && after.actionType === 'openModal' && after.buttonType === 'action'
console.log('read back:', JSON.stringify({ label: after.label, buttonType: after.buttonType, actionType: after.actionType, actionUrl: after.actionUrl }))
console.log(ok ? 'OK — New Incident button authored' : 'FAIL — props did not land')
process.exit(ok ? 0 : 1)
