/**
 * docs/issues/0144 Option 1 — sweep every authored create/update form and compare each field name
 * against the STIX class it will be validated against.
 *
 * WHY. Two forms have now been found sending property names the class rejects, each crashing the
 * algorithm server-side while the browser saw **HTTP 200 and no error** (docs/issues/0142 identity,
 * docs/issues/0093 event). Both were found *by accident* while investigating something else, and
 * neither had ever failed a test. Empty values are stripped before the object is built, so a
 * wrongly-named field is harmless until a presenter first fills it — each is a landmine that arms
 * itself on stage. Three accidental finds is not a sampling strategy.
 *
 * WHAT IT REPORTS, per form:
 *   🔴 MISSING NAME     a field with no `name` serialises under the literal fallback key `field`,
 *                       which ALWAYS raises ExtraPropertiesError once the control has a value
 *   🟠 NOT A PROPERTY   a name the class does not accept — breaks as soon as it is filled
 *   ⬜ NO FIELD         a real property with no authored control (silently unfillable; informational)
 *
 * and, where it can, *why*: the two shapes seen so far are **named after the embedded type** rather
 * than the property holding the list (`EmailContact` → `email_addresses`), and **plural/singular
 * drift** (`goals` → `goal`). Where the authored `label` is itself a valid property name, that is
 * offered as the fix — in every case so far the label was right.
 *
 * ⚠️ It proposes, it does not write. Where the label does not disambiguate (identity-create has three
 * inputs all named `prefix` while `suffix` and `team` have none), guessing would be exactly the
 * improvisation CLAUDE.md forbids — those are listed for a human.
 *
 * Prerequisite: e2e/stix-properties.json, produced by dump-stix-properties.py under the SAME
 * interpreter and package path the algorithms use (see that file's header).
 *
 *     node e2e/sweep-form-field-names.mjs
 *     node e2e/sweep-form-field-names.mjs --all     # include the ⬜ informational bucket
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const FORMS_ROOT = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms'
const SHOW_ALL = process.argv.includes('--all')

const props = JSON.parse(fs.readFileSync(path.join(__dirname, 'stix-properties.json'), 'utf8'))
const EMBEDDED = new Set(Object.keys(props.embedded))

const get = async (p, depth) => {
  const res = await fetch(`${CMS}${p}.${depth}.json`, { headers: { Authorization: auth } })
  return res.ok ? res.json() : null
}

/** Recursively find every form page under the forms root. A page has a jcr:content child. */
const findForms = async (root, depth = 0, acc = []) => {
  if (depth > 5) return acc
  const node = await get(root, 1)
  if (!node) return acc
  for (const [k, v] of Object.entries(node)) {
    if (!v || typeof v !== 'object' || k.startsWith('jcr:') || k.startsWith('sling:')) continue
    const child = `${root}/${k}`
    if (/-(create|update)$/.test(k)) acc.push(child)
    else await findForms(child, depth + 1, acc)
  }
  return acc
}

/** Collect { name, label, path, container } for every authored field node in a form. */
const collectFields = (tree) => {
  const out = []
  const walk = (o, p, container) => {
    if (!o || typeof o !== 'object') return
    for (const [k, v] of Object.entries(o)) {
      if (!v || typeof v !== 'object' || k.startsWith('jcr:') || k.startsWith('sling:')) continue
      const f = v.field
      if (f && typeof f === 'object') {
        const entry = {
          name: f.name,
          label: (v.label && v.label.label) || (f.label && f.label.label) || '',
          path: `${p}/${k}`,
          rt: String(f['sling:resourceType'] || '').split('/').pop(),
          container,
        }
        out.push(entry)
        // A composite opens a new container: its children belong to it, not to the parent object.
        walk(v, `${p}/${k}`, entry.name === undefined ? '(unnamed)' : entry.name)
        continue
      }
      walk(v, `${p}/${k}`, container)
    }
  }
  walk(tree, '', 'root')
  return out
}

const forms = await findForms(FORMS_ROOT)
console.log(`forms found under ${FORMS_ROOT}: ${forms.length}\n`)

const summary = { missing: 0, notProp: 0, noField: 0, forms: 0, unreadable: 0 }
const actionable = []

for (const form of forms.sort()) {
  const tree = await get(`${form}/jcr:content`, 11)
  if (!tree) {
    summary.unreadable++
    continue
  }
  const fields = collectFields(tree)
  if (!fields.length) continue

  // The STIX type: prefer the authored `type` input's value, fall back to the path convention
  // `<type>-forms/<type>-create`.
  const typeField = fields.find((f) => f.name === 'type')
  const fromPath = /\/([a-z0-9-]+)-(create|update)$/.exec(form)?.[1]
  const stixType =
    (typeField && (typeField.value || typeField.defaultValue)) || fromPath
  const cls = props.types[stixType]
  if (!cls) {
    console.log(`— ${form.replace(FORMS_ROOT + '/', '')}: no STIX class for type "${stixType}" — skipped`)
    continue
  }
  const allowed = new Set(cls.properties)

  // Fields inside an `extension-definition--…` composite validate against THAT class, not the SDO.
  const extOf = (container) =>
    container && container.startsWith('extension-definition--') ? props.types[container] : null

  const problems = []
  let notSubmitted = 0
  for (const f of fields) {
    // ⚠️ Only `/rootcontainer/main/**` is submitted. Every form also carries a `/rootcontainer/footer`
    // block holding the same handful of inputs (prefix, first_name, middle_name, last_name, suffix),
    // and they appear in NO captured payload — identity-create's and event-create's real POST bodies
    // contain none of them. Counting those was the first version of this sweep reporting 178
    // problems, most of them fictional. Verified against the two payloads captured in
    // docs/issues/0142 and docs/issues/0093 before narrowing.
    if (!f.path.startsWith('/rootcontainer/main/')) { notSubmitted++; continue }
    // Structural composites carry the payload's shape, not properties.
    if (['base_required', 'base_optional', 'object', 'sub', 'extensions'].includes(f.name)) continue
    if (f.name && f.name.startsWith('extension-definition--')) continue
    if (f.rt === 'label' || f.name === 'search_terms') continue

    const owner = extOf(f.container)
    const ownerAllowed = owner ? new Set(owner.properties) : allowed
    const ownerName = owner ? owner.class : cls.class

    if (f.name === undefined) {
      problems.push({ kind: '🔴 MISSING NAME', f, ownerName,
        why: 'serialises under the fallback key `field` — always raises ExtraPropertiesError once filled',
        fix: ownerAllowed.has(f.label) ? f.label : null })
      summary.missing++
    } else if (!ownerAllowed.has(f.name)) {
      // ⚠️ A field inside an embedded-object composite (changed_objects → StateChangeObject,
      // contact_numbers → ContactNumber, …) validates against the EMBEDDED class, not the SDO.
      // Without this the sweep flagged `state_change_type` / `initial_ref` / `result_ref` on
      // event-create as "not a property of Event" — true, and irrelevant: they are properties of
      // StateChangeObject. Checking every embedded class is less precise than tracking the exact
      // owner, but it is honest: it never invents a problem, which matters more in a report whose
      // whole purpose is to be acted on.
      const inEmbedded = Object.values(props.embedded).some((list) => list.includes(f.name))
      if (inEmbedded) continue

      const why = EMBEDDED.has(f.name)
        ? `named after the EMBEDDED TYPE \`${f.name}\`, not the property that holds it`
        : ownerAllowed.has(f.label) ? 'name/label drift' : 'not a property of this class'
      problems.push({ kind: '🟠 NOT A PROPERTY', f, ownerName, why,
        fix: ownerAllowed.has(f.label) ? f.label : null })
      summary.notProp++
    }
  }

  const named = new Set(fields.map((f) => f.name).filter(Boolean))
  const missingControls = cls.properties.filter(
    (p) => !named.has(p) && !['type', 'spec_version', 'id', 'created', 'modified', 'extensions',
      'granular_markings', 'object_marking_refs', 'external_references', 'lang', 'revoked',
      'confidence', 'labels'].includes(p))
  summary.noField += missingControls.length

  if (problems.length || (SHOW_ALL && missingControls.length)) {
    summary.forms++
    console.log(`\n=== ${form.replace(FORMS_ROOT + '/', '')}   [${stixType} → ${cls.class}]`)
    for (const p of problems) {
      console.log(`  ${p.kind}  ${JSON.stringify(p.f.name)}   label=${JSON.stringify(p.f.label)}  (${p.ownerName})`)
      console.log(`      ${p.why}`)
      console.log(`      ${p.fix ? `fix -> ${JSON.stringify(p.fix)} (the label is a real property)` : '⚠️ label does not disambiguate — needs a human'}`)
      console.log(`      ${p.f.path}`)
      actionable.push({ form, ...p.f, fix: p.fix, kind: p.kind })
    }
    if (SHOW_ALL && missingControls.length) {
      console.log(`  ⬜ properties with no authored control: ${missingControls.join(', ')}`)
    }
  }
}

console.log('\n' + '='.repeat(90))
console.log(`forms with problems : ${summary.forms} of ${forms.length}`)
console.log(`🔴 missing name     : ${summary.missing}   (breaks on every filled submit)`)
console.log(`🟠 not a property   : ${summary.notProp}   (breaks when filled)`)
if (summary.unreadable) console.log(`unreadable forms    : ${summary.unreadable}`)
const fixable = actionable.filter((a) => a.fix)
console.log(`\nof those, ${fixable.length} have a label that names a real property (mechanical fix);` +
  ` ${actionable.length - fixable.length} need a human.`)
const outFile = path.join(__dirname, 'sweep-form-field-names.json')
fs.writeFileSync(outFile, JSON.stringify(actionable, null, 1))
console.log(`written: ${outFile}`)
