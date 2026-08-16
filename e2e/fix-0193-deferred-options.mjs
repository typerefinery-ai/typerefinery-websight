/**
 * docs/issues/0193 — author `deferredOptions` on the SRO modal's relationship-type select.
 *
 * The generic select clientlib degrades an option-less select to a free-text input
 * (docs/issues/0150), because a select with no options source is a locked empty dropdown. That rule
 * asks "are there 0 options right now?" and treats it as "there is no source" — wrong for a field
 * whose options depend on choices the analyst has not made yet and are posted in afterwards.
 *
 * `deferredOptions` is the opt-in that says "my options arrive from the host, later". It is read by
 * the clientlib guard (same issue) and exposed by `Select.java`. Domain-agnostic on purpose: it says
 * WHEN the options arrive, never WHAT they are.
 *
 * ⚠️ The clientlib half rides the backend bundle, so this property is INERT until that deploy. It is
 * authored now so package and live stay in step and the fix lands whole.
 *
 *     node e2e/fix-0193-deferred-options.mjs           # report
 *     node e2e/fix-0193-deferred-options.mjs --apply   # write
 */
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const PROP_SERVLET = `${CMS}/bin/typerefinery/component-property`
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const APPLY = process.argv.includes('--apply')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const FIELD =
  '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/modal-forms/sro-constraints' +
  '/jcr:content/rootcontainer/main/form/one_1/container1/composite/field/select/field'

const run = async () => {
  const before = await fetch(`${CMS}${FIELD}.json`, { headers: { Authorization: auth } })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)

  if (!before) {
    console.error(`could not read ${FIELD} — is the CMS up and the path right?`)
    process.exit(2)
  }
  console.log(`field node: name=${before.name} resourceType=${before['sling:resourceType']}`)
  console.log(`deferredOptions before: ${JSON.stringify(before.deferredOptions)}`)

  // Guard: only ever touch the field this issue is about. A generic sweep here would be a way to
  // exempt every select in the CMS from 0150's rule by accident.
  if (before.name !== 'relationship_type') {
    console.error(`refusing to write: expected name "relationship_type", found ${JSON.stringify(before.name)}`)
    process.exit(1)
  }

  if (before.deferredOptions === true || before.deferredOptions === 'true') {
    console.log('already authored — nothing to do')
    process.exit(0)
  }
  if (!APPLY) {
    console.log('\ndry run. Re-run with --apply to write deferredOptions=true')
    process.exit(0)
  }

  const res = await fetch(PROP_SERVLET, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ path: FIELD, name: 'deferredOptions', value: 'true' }),
  })

  // ⚠️ A 200 from this servlet is NOT evidence the property landed — docs/issues/0057 established
  // that. Read it back.
  const after = await fetch(`${CMS}${FIELD}.json`, { headers: { Authorization: auth } })
    .then((r) => r.json())
    .catch(() => ({}))
  console.log(`POST -> http ${res.status}; reads back deferredOptions=${JSON.stringify(after.deferredOptions)}`)

  if (after.deferredOptions === true || after.deferredOptions === 'true') {
    console.log('✅ authored live. ⚠️ Inert until the backend bundle carrying the clientlib guard deploys.')
    console.log('⚠️ Run audit-package-vs-live-content.mjs — this was live authoring.')
    process.exit(0)
  }
  console.error('🚩 the property did not land')
  process.exit(1)
}

run().catch((e) => { console.error(e); process.exit(1) })
