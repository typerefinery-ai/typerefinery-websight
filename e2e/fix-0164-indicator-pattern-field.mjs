/**
 * docs/issues/0164 Option 1 — give indicator-create its required `pattern` field.
 *
 * The form has NO field for `pattern` (required on Indicator, stix2/v21/sdo.py:213) and a
 * SECOND input named `pattern_type` sits in its slot (a string input at
 * `container1/string_3`, under the same-named vocab select at `container1/vocab_1`).
 * `make_indicator` reads input["pattern"], so a bare form create raises
 * MissingPropertiesError behind a silent 200 (0026-shape). Renaming the duplicate string
 * input — name AND its visible label — makes the type creatable and clears the dup-name
 * finding. Save leg confirmed present (audit-form-save-legs.mjs ✅ both indicator forms).
 *
 * Modeled on fix-email-message-from-ref.mjs. Touches indicator-update too IF it carries
 * the same duplicate (report shows current state first; only `from`-matching values are
 * written).
 *
 *     node e2e/fix-0164-indicator-pattern-field.mjs            # report
 *     node e2e/fix-0164-indicator-pattern-field.mjs --apply
 */
const auth = { Authorization: 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64') }
const CMS = 'http://localhost:8113'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const ROOT =
  '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms/indicator-forms'
const FIELD_PATH = 'rootcontainer/main/form/composite_1/field/one/container1/string_3'

const APPLY = process.argv.includes('--apply')

const edits = []
for (const form of ['indicator-create', 'indicator-update']) {
  const base = `${ROOT}/${form}/jcr:content/${FIELD_PATH}`
  edits.push({ form, path: `${base}/field`, prop: 'name', from: 'pattern_type', to: 'pattern' })
  edits.push({ form, path: `${base}/label`, prop: 'label', from: 'pattern_type', to: 'pattern' })
}

async function read(path) {
  const res = await fetch(`${CMS}${path}.json`, { headers: auth })
  return res.ok ? res.json() : null
}

console.log('current state:')
const applicable = []
for (const e of edits) {
  const node = await read(e.path)
  const value = node ? node[e.prop] : '(node missing)'
  const fixable = value === e.from
  if (fixable) applicable.push(e)
  console.log(`  ${e.form.padEnd(18)} ${e.prop.padEnd(6)} = ${value}${fixable ? '   <- to fix' : ''}`)
}

if (!APPLY) {
  console.log(`\n(report only — pass --apply to rename ${applicable.length} value(s))`)
  console.log('⚠️ remember the other half: tests/content package (docs/issues/0042 reconciliation)')
  process.exit(0)
}

let ok = 0
console.log('')
for (const e of applicable) {
  const res = await fetch(PROP_SERVLET, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ path: e.path, name: e.prop, value: e.to }),
  })
  // Read it back — a 200 from the servlet is not evidence the property landed (docs/issues/0057).
  const node = await read(e.path)
  const landed = node && node[e.prop] === e.to
  if (landed) ok++
  console.log(`  ${landed ? '✅' : '❌'} ${e.form.padEnd(18)} ${e.prop.padEnd(6)} -> ${e.to}   (servlet ${res.status})`)
}

console.log(`\n${ok}/${applicable.length} renamed and read back`)
console.log('Verify runtime: create an Indicator with name+pattern+pattern_type filled and check /viz-data/unattached-split; then reset-demo-data.mjs to restore the curated set.')
process.exit(ok === applicable.length ? 0 : 1)
