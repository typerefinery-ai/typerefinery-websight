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

/**
 * The measured members of the "options arrive from the host, later" class.
 *
 * Found by `audit-0193-degrading-selects.mjs`, which reads the authored content for selects with no
 * options source of any kind. ⚠️ `relationship_type` was found first, by a failing test;
 * `connection_field_list` was found only by the sweep, and is Act 3's OTHER modal (P3-S7). Both were
 * confirmed live: each logs 0150's "degrading to free-text input" warning on a direct page load.
 *
 * Each entry carries the field's expected `name` so a wrong path cannot quietly write the flag onto
 * some other select — which would exempt it from 0150's rule by accident.
 */
const FIELDS = [
  {
    label: 'SRO modal — Relationship Type (P3-S6)',
    name: 'relationship_type',
    path:
      '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/modal-forms/sro-constraints' +
      '/jcr:content/rootcontainer/main/form/one_1/container1/composite/field/select/field',
  },
  {
    label: 'Connection modal — Connection Field List (P3-S7)',
    name: 'connection_field_list',
    path:
      '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/modal-forms/foreign-key-connections' +
      '/jcr:content/rootcontainer/main/form/one_1/container1/select/field',
  },
]

const one = async (f) => {
  const url = `${CMS}${f.path}.json`
  const before = await fetch(url, { headers: { Authorization: auth } })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)

  if (!before) { console.log(`  🚩 ${f.label}: could not read ${f.path}`); return false }
  if (before.name !== f.name) {
    console.log(`  🚩 ${f.label}: expected name "${f.name}", found ${JSON.stringify(before.name)} — refusing to write`)
    return false
  }
  if (before.deferredOptions === true || before.deferredOptions === 'true') {
    console.log(`  ok  ${f.label}: already authored`)
    return true
  }
  if (!APPLY) {
    console.log(`  --  ${f.label}: would write deferredOptions=true`)
    return true
  }

  const res = await fetch(PROP_SERVLET, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ path: f.path, name: 'deferredOptions', value: 'true' }),
  })
  // ⚠️ A 200 from this servlet is NOT evidence the property landed — docs/issues/0057 established
  // that. Read it back, every time.
  const after = await fetch(url, { headers: { Authorization: auth } }).then((r) => r.json()).catch(() => ({}))
  const landed = after.deferredOptions === true || after.deferredOptions === 'true'
  console.log(`  ${landed ? 'ok ' : '🚩'} ${f.label}: http ${res.status}, reads back ${JSON.stringify(after.deferredOptions)}`)
  return landed
}

const run = async () => {
  console.log(`${FIELDS.length} field(s) in the deferred-options class${APPLY ? '' : ' (dry run)'}`)
  const results = []
  for (const f of FIELDS) results.push(await one(f))
  const bad = results.filter((r) => !r).length
  if (bad) { console.error(`\n🚩 ${bad} field(s) not written`); process.exit(1) }
  if (APPLY) {
    console.log('\n✅ all authored live. ⚠️ Inert until the backend bundle carrying the clientlib guard deploys.')
    console.log('⚠️ Run audit-package-vs-live-content.mjs — this was live authoring.')
  } else {
    console.log('\ndry run. Re-run with --apply to write.')
  }
}

run().catch((e) => { console.error(e); process.exit(1) })
