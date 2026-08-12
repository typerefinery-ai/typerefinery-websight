/**
 * decision 0034 (Decided — Option 1) — author a STIX Update form for a type that lacks one.
 *
 * Generalised from `author-incident-update-form.mjs`, which proved the approach on `incident`
 * (Act 2's central node, `083c6cc3`). Same principle: **clone a form that already works** rather than
 * invent a page. Base Required and Base Optional are STIX *common* properties, identical across a
 * family, so they clone untouched — only the **Object** group (and an **Extensions** group, where the
 * type has an os-threat extension) is type-specific and generated from `_properties`.
 *
 * That is why each new type costs a handful of generated fields rather than ~44 hand-typed ones, and
 * why nothing is hand-typed at all: a wrong `name` serialises under a fallback key and crashes the
 * algorithm while the browser sees HTTP 200 (docs/issues/0144).
 *
 *     node e2e/author-stix-update-form.mjs                 # dry run, all configured types
 *     node e2e/author-stix-update-form.mjs --apply
 *     node e2e/author-stix-update-form.mjs --only process
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const CMS = process.env.CMS_BASE_HTTP || 'http://localhost:8113'
const AUTH = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const APPLY = process.argv.includes('--apply')
const ONLY = (process.argv.find((a) => a.startsWith('--only')) || '').split('=')[1] ??
  (process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null)

const FORMS = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms'
const PKG = path.join(WORKSPACE, 'typerefinery/services/fastapi/__packages__/Python311/site-packages')

/**
 * ⚠️ The templates are chosen per family, not arbitrarily. An SCO has no `created`/`modified`, so
 * cloning an SDO form onto an SCO would author base fields the type does not have. `url-update` and
 * `identity-update` are both known-good (they resolve for Overview left-select today).
 */
const TYPES = [
  { type: 'process',         cls: 'Process',        py: 'stix2/v21/observables.py', group: 'sco-forms', template: `${FORMS}/sco-forms/url-forms/url-update` },
  { type: 'network-traffic', cls: 'NetworkTraffic', py: 'stix2/v21/observables.py', group: 'sco-forms', template: `${FORMS}/sco-forms/url-forms/url-update` },
  // ⚠️ `impact` is an os-threat type, so it does NOT live under `stix-forms`. The Overview computes
  // its URL as {object_family}/{object_group}/… where family is `os-threat-forms` — measured on a
  // real impact node. Using the stix-forms root produced a 404 "no resource at …".
  { type: 'impact',          cls: 'Impact',         py: 'stixorm/module/definitions/os_threat/classes.py', group: 'sdo-forms', root: `${FORMS.replace('/stix-forms', '')}/os-threat-forms`, template: `${FORMS}/sdo-forms/identity-forms/identity-update` },
  { type: 'malware',         cls: 'Malware',        py: 'stix2/v21/sdo.py',         group: 'sdo-forms', template: `${FORMS}/sdo-forms/identity-forms/identity-update` },
]

const propsOf = (file, className) => {
  const src = fs.readFileSync(path.join(PKG, file), 'utf8')
  const at = src.indexOf(`class ${className}(`)
  if (at < 0) return []
  const from = src.indexOf('_properties = OrderedDict([', at)
  if (from < 0) return []
  const body = src.slice(from, src.indexOf('])', from))
  return [...body.matchAll(/\(\s*'([a-z_0-9]+)'\s*,\s*([A-Za-z_]+)/g)].map((m) => ({ name: m[1], kind: m[2] }))
}

const COMPONENT = {
  StringProperty: 'typerefinery/components/stix/forms/input/string',
  TypeProperty: 'typerefinery/components/stix/forms/input/string',
  IDProperty: 'typerefinery/components/stix/forms/input/id',
  ReferenceProperty: 'typerefinery/components/stix/forms/input/reference',
  ThreatReference: 'typerefinery/components/stix/forms/input/reference',
  TimestampProperty: 'typerefinery/components/stix/forms/input/timestamp',
  BooleanProperty: 'typerefinery/components/stix/forms/input/boolean',
  IntegerProperty: 'typerefinery/components/stix/forms/input/integer',
  FloatProperty: 'typerefinery/components/stix/forms/input/integer',
  HexProperty: 'typerefinery/components/stix/forms/input/string',
  BinaryProperty: 'typerefinery/components/stix/forms/input/string',
  EnumProperty: 'typerefinery/components/stix/forms/input/string',
  ListProperty: 'typerefinery/components/stix/forms/input/string',
  DictionaryProperty: 'typerefinery/components/stix/forms/input/string',
  EmbeddedObjectProperty: 'typerefinery/components/stix/forms/input/string',
  ObservableProperty: 'typerefinery/components/stix/forms/input/string',
}

/** STIX common properties — they live in the Base groups and clone untouched. */
const COMMON = new Set([
  'type', 'spec_version', 'id', 'created_by_ref', 'created', 'modified',
  'revoked', 'labels', 'confidence', 'lang', 'external_references',
  'object_marking_refs', 'granular_markings', 'extensions',
  'defanged', 'object_refs',
])

let seq = 0
const rid = (p) => `${p}_GEN${String(++seq).padStart(3, '0')}`

const fieldNode = (prop) => ({
  'jcr:primaryType': 'nt:unstructured',
  'sling:resourceType': COMPONENT[prop.kind],
  id: rid('string'),
  smColSize: '6', mdColSize: '6', lgColSize: '6',
  label: { 'jcr:primaryType': 'nt:unstructured', 'sling:resourceType': 'typerefinery/components/forms/fields/label', id: rid('label'), label: prop.name },
  field: {
    'jcr:primaryType': 'nt:unstructured',
    'sling:resourceType': 'typerefinery/components/stix/forms/fields/input',
    id: rid('input'), name: prop.name, inputType: 'string', label: 'Field',
    smColSize: '10', mdColSize: '10', lgColSize: '10',
  },
})

const ALLOWED_SYSTEM = new Set(['jcr:primaryType', 'sling:resourceType'])
/** Strip reserved PROPERTIES only — a reserved-looking key can be a child NODE (`jcr:content`). */
const stripReserved = (node) => {
  if (!node || typeof node !== 'object') return
  for (const key of Object.keys(node)) {
    const value = node[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) { stripReserved(value); continue }
    if (/^(jcr|rep|oak|ws|mix|nt):/.test(key) && !ALLOWED_SYSTEM.has(key)) delete node[key]
  }
}

const setFields = (container, props) => {
  for (const key of Object.keys(container)) {
    const v = container[key]
    if (v && typeof v === 'object' && !key.startsWith('jcr:')) delete container[key]
  }
  props.forEach((p, i) => { container[i === 0 ? 'string' : `string_${i}`] = fieldNode(p) })
}

const get = async (url) => {
  const res = await fetch(url, { headers: { Authorization: AUTH } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}
const post = (body) =>
  fetch(`${CMS}/bin/typerefinery/component-node`, {
    method: 'POST',
    headers: { Authorization: AUTH, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  })

for (const t of TYPES.filter((t) => !ONLY || t.type === ONLY)) {
  const props = propsOf(t.py, t.cls)
  const objectProps = props.filter((p) => !COMMON.has(p.name))
  const unmapped = objectProps.filter((p) => !COMPONENT[p.kind])

  console.log(`\n=== ${t.type} (${t.cls}) ===`)
  console.log(`  ${props.length} properties, ${objectProps.length} type-specific`)
  console.log(`  object fields: ${objectProps.map((p) => p.name).join(', ') || '(none)'}`)
  if (unmapped.length) {
    console.error(`  FAIL - unmapped property type(s), refusing to guess: ${unmapped.map((p) => `${p.name} (${p.kind})`).join(', ')}`)
    continue
  }

  const root = t.root ?? FORMS
  const parent = `${root}/${t.group}/${t.type}-forms`
  const name = `${t.type}-update`

  const tree = JSON.parse(JSON.stringify(await get(`${CMS}${t.template}.13.json`)))
  const form = tree['jcr:content'].rootcontainer.main.form
  setFields(form.composite_1.field.one?.container1 ?? form.composite_1.field, objectProps)

  // No os-threat extension for these types — clear the cloned Extensions group rather than inherit
  // the template's, which would imply an extension this type does not have.
  if (form.composite_3?.field) {
    for (const key of Object.keys(form.composite_3.field)) {
      const v = form.composite_3.field[key]
      if (v && typeof v === 'object' && !key.startsWith('jcr:')) delete form.composite_3.field[key]
    }
  }

  const content = tree['jcr:content']
  for (const k of ['jcr:title', 'propertyTitle', 'ogTitle']) if (content[k]) content[k] = name
  stripReserved(tree)

  if (!APPLY) { console.log(`  would create ${parent}/${name}`); continue }

  const folder = await post({ parent: `${root}/${t.group}`, name: `${t.type}-forms`, json: JSON.stringify({ 'jcr:primaryType': 'sling:Folder' }) })
  const page = await post({ parent, name, json: JSON.stringify(tree) })
  const body = await page.text()
  console.log(`  folder ${folder.status} · page ${page.status} ${body.slice(0, 90)}`)

  // A servlet 200 is not evidence the page renders (docs/issues/0057) - read it back.
  const check = await fetch(`${CMS}${parent}/${name}.html`, { headers: { Authorization: AUTH } })
  const html = await check.text()
  console.log(`  GET ${name}.html -> ${check.status}, ${(html.match(/<input/g) || []).length} input(s)`)
}
