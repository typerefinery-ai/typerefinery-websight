/**
 * docs/issues/0062 — the `email-message` forms name their sender field `from_refs`; STIX 2.1 and the
 * dialect data both have `from_ref` (singular).
 *
 * The neighbouring `to_refs` / `cc_refs` / `bcc_refs` genuinely *are* plural, which is presumably how
 * the `s` got attached. Consequences: a saved email-message carries a property STIX does not define,
 * and the field's options source can never answer — `{"object_type":"email-message",
 * "object_field":"from_refs"}` finds no dialect row and returns `200 []`, while `from_ref` returns 5
 * candidates.
 *
 * ⚠️ **The typo is in the checked-in content package too** (twice per form: the field `name` and the
 * `label`), so this script is only half the fix — `tests/content/.../email-message-{create,update}/
 * .content.xml` must be corrected as well or a redeploy silently reintroduces it. That is the
 * divergence docs/issues/0042 is about.
 *
 * ⚠️ Both the **label** and the **name** carry the typo. The label is the string an author actually
 * reads, so renaming only the field would leave the form still saying `from_refs`.
 *
 * Nothing is stored under the old name — 0 email-message objects in unattached carry `from_refs`, and
 * it appears nowhere under `context_mem/` — so no migration is needed.
 *
 *     node e2e/fix-email-message-from-ref.mjs            # report
 *     node e2e/fix-email-message-from-ref.mjs --apply
 */
const auth = { Authorization: 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64') }
const CMS = 'http://localhost:8113'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const ROOT =
  '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sco-forms/email-message-forms'
const FIELD_PATH = 'rootcontainer/main/form/composite_1/field/one/container1/reference_3'

const APPLY = process.argv.includes('--apply')

const edits = []
for (const form of ['email-message-create', 'email-message-update']) {
  const base = `${ROOT}/${form}/jcr:content/${FIELD_PATH}`
  edits.push({ form, path: `${base}/field`, prop: 'name', from: 'from_refs', to: 'from_ref' })
  edits.push({ form, path: `${base}/label`, prop: 'label', from: 'from_refs', to: 'from_ref' })
}

async function read(path) {
  const res = await fetch(`${CMS}${path}.json`, { headers: auth })
  return res.ok ? res.json() : null
}

console.log('current state:')
for (const e of edits) {
  const node = await read(e.path)
  const value = node ? node[e.prop] : '(node missing)'
  console.log(`  ${e.form.padEnd(21)} ${e.prop.padEnd(6)} = ${value}${value === e.from ? '   <- to fix' : ''}`)
}

if (!APPLY) {
  console.log('\n(report only — pass --apply to rename)')
  console.log('⚠️ remember the other half: tests/content/.../email-message-{create,update}/.content.xml')
  process.exit(0)
}

let ok = 0
console.log('')
for (const e of edits) {
  const res = await fetch(PROP_SERVLET, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ path: e.path, name: e.prop, value: e.to }),
  })
  // Read it back — a 200 from the servlet is not evidence the property landed (docs/issues/0057).
  const node = await read(e.path)
  const landed = node && node[e.prop] === e.to
  if (landed) ok++
  console.log(`  ${landed ? '✅' : '❌'} ${e.form.padEnd(21)} ${e.prop.padEnd(6)} -> ${e.to}   (servlet ${res.status})`)
}

console.log(`\n${ok}/${edits.length} renamed and read back`)
console.log('⚠️ now fix the content package too, or a redeploy brings the typo back (docs/issues/0042)')
process.exit(ok === edits.length ? 0 : 1)
