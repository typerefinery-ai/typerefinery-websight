/**
 * docs/issues/0142 — the Identity Contact extension cannot be saved: two authored field names do not
 * match the STIX class, so the create fails with `ExtraPropertiesError`.
 *
 * Measured 2026-08-12 by filling the extension on `identity-create.html` and watching the wire:
 * the POST answers **HTTP 200** while its BODY says `{"error":"true", …, "output.exists":"False"}`,
 * and the algorithm log holds the real cause:
 *
 *     stix2.exceptions.ExtraPropertiesError: Unexpected properties for IdentityContact:
 *                                            (email-contact, field).
 *
 * `IdentityContact._properties` (stixorm/module/definitions/os_threat/classes.py) accepts:
 *     extension_type, contact_numbers, email_addresses, first_name, last_name, middle_name,
 *     prefix, social_media_accounts, suffix, team
 *
 * ⚠️ THE FIX IS NOT A GUESS - THE AUTHORED LABELS NAME THE PROPERTY THEMSELVES:
 *
 *   composite_1  field.name = "email-contact"   label = "email-contacts"
 *                -> the property is `email_addresses` (a list of the embedded type `EmailContact`).
 *                   The field was named after the EMBEDDED TYPE instead of the property.
 *   composite_2  field.name = <MISSING>         label = "social-media-contacts"
 *                -> so it serialises under the fallback key `field`, which is the second half of
 *                   the error. The property is `social_media_accounts` (list of
 *                   `SocialMediaContact`) - the only list property left unclaimed, and the label
 *                   says so.
 *
 * `composite` ("contact_numbers") is already correct and is left alone.
 *
 * ⚠️ NOT FIXED HERE, deliberately: the same template carries THREE inputs named `prefix`
 * (`string_2`, `string_2_4`, `string_2_5`) while `suffix` and `team` have no input at all, and a
 * `_type` input that is not a property of the class either. Which of the three is meant to be
 * `suffix` and which `team` is not determinable from the authored labels, so it is recorded in
 * docs/issues/0142 rather than guessed at. They do not break the save today because empty strings
 * are omitted from the payload.
 *
 *     node e2e/fix-identity-extension-field-names.mjs            # report only
 *     node e2e/fix-identity-extension-field-names.mjs --apply
 */
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
const APPLY = process.argv.includes('--apply')

const TEMPLATE =
  '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms' +
  '/identity-forms/identity-create/jcr:content/rootcontainer/main/form/composite_3/field' +
  '/composite/field/template/container/container1'

const TARGETS = [
  {
    what: 'email contacts composite - named after the embedded type, not the property',
    path: `${TEMPLATE}/composite_1/field`,
    prop: 'name',
    from: 'email-contact',
    to: 'email_addresses',
  },
  {
    what: 'social media composite - has NO name, so it serialises as the fallback key `field`',
    path: `${TEMPLATE}/composite_2/field`,
    prop: 'name',
    from: undefined, // the property is absent entirely
    to: 'social_media_accounts',
  },
]

const read = async (p) => {
  const res = await fetch(`${CMS}${p}.json`, { headers: { Authorization: auth } })
  if (!res.ok) return null
  return res.json()
}

let changed = 0
let skipped = 0
let failed = 0

for (const t of TARGETS) {
  const before = await read(t.path)
  if (before === null) {
    console.log(`${t.what}\n   ! node not readable at ${t.path} - skipping\n`)
    failed++
    continue
  }
  const cur = before[t.prop]
  console.log(`${t.what}`)
  console.log(`   node    ${t.path}`)
  console.log(`   current ${JSON.stringify(cur)}`)
  console.log(`   target  ${JSON.stringify(t.to)}`)

  if (cur === t.to) {
    console.log('   = already correct\n')
    skipped++
    continue
  }
  if (cur !== t.from) {
    // Never overwrite a value nobody predicted - it may have been edited since.
    console.log(`   ! unexpected current value (expected ${JSON.stringify(t.from)}); skipping rather than clobbering\n`)
    skipped++
    continue
  }
  if (!APPLY) {
    console.log('   ~ would change (dry run)\n')
    continue
  }

  const res = await fetch(PROP_SERVLET, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ path: t.path, name: t.prop, value: t.to }),
  })
  // A 200 from the servlet is not evidence the property landed (docs/issues/0057) - read it back.
  const after = await read(t.path)
  if (after?.[t.prop] === t.to) {
    console.log(`   POST ${res.status} -> OK, read back ${JSON.stringify(after[t.prop])}\n`)
    changed++
  } else {
    console.log(`   POST ${res.status} -> FAIL, read back ${JSON.stringify(after?.[t.prop])}\n`)
    failed++
  }
}

console.log(`changed ${changed}  skipped ${skipped}  failed ${failed}`)
if (!APPLY) console.log('\ndry run - nothing written. Re-run with --apply.')
else console.log('\nVerify: node e2e/probe-0140-new-object-naming.mjs (it fills the extension and reports the POST body).')
