/**
 * docs/issues/0089 — Task half, step 1: enable the flow binding on the LIVE task-create form and
 * wait for the FlowService to provision the form flow (flowapi_flowstreamid + httproute appear).
 * This is exactly how event and sighting got their flows.
 *
 *     node e2e/fix-0089-wire-task-create.mjs [--apply]
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'https://cms.typerefinery.localhost:8101'
const PROP_SERVLET = `${CMS}/bin/typerefinery/component-property`
const FORM =
  '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms/task-forms/task-create/jcr:content/rootcontainer/main/form'
const APPLY = process.argv.includes('--apply')

const read = async () => await (await fetch(`${CMS}${FORM}.1.json`, { headers: { Authorization: auth } })).json()

const before = await read()
console.log('before:', {
  flowapi_enable: before.flowapi_enable,
  flowstreamid: before.flowapi_flowstreamid || '(none)',
  httproute: before.flowapi_httproute || '(none)',
})
if (!APPLY) {
  console.log('(dry run — would set flowapi_enable=true and wait for provisioning)')
  process.exit(0)
}

const res = await fetch(PROP_SERVLET, {
  method: 'POST',
  headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ path: FORM, name: 'flowapi_enable', value: 'true' }),
})
console.log(`POST flowapi_enable=true -> ${res.status}`)

// the FlowService provisions on the next page render — request the page, then poll the node
await fetch(`${CMS}/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms/task-forms/task-create.html`, {
  headers: { Authorization: auth },
})
let provisioned = null
for (let i = 0; i < 30; i++) {
  await new Promise((r) => setTimeout(r, 2000))
  const now = await read()
  if (now.flowapi_flowstreamid) {
    provisioned = now
    break
  }
  if (i % 5 === 4) {
    // re-render to nudge the FlowService
    await fetch(`${CMS}/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms/task-forms/task-create.html`, {
      headers: { Authorization: auth },
    })
  }
}
if (provisioned) {
  console.log('✅ provisioned:', {
    flowstreamid: provisioned.flowapi_flowstreamid,
    httproute: provisioned.flowapi_httproute || '(none)',
    success: provisioned.flowapi_success,
  })
} else {
  console.log('🔴 no flowstreamid after 60s — check FlowService logs')
  process.exit(1)
}
