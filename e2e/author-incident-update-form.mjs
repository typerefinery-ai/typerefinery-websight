/**
 * decision 0034 (Decided 2026-08-12, Denis — Option 1) — author `incident-update`, the form Act 2's
 * central node needs.
 *
 * 🔑 **Clones a proven form rather than inventing a page.** `identity-update` already works
 * (26 of 28 Overview nodes resolve through this shape), so its tree is the template. Base Required
 * and Base Optional are STIX **common** properties — identical for every SDO — so they clone
 * untouched. Only the **Object** and **Extensions** groups are type-specific, and those are
 * generated from `_properties`, never hand-typed: a wrong `name` serialises under a fallback key
 * and crashes the algorithm while the browser sees HTTP 200 (docs/issues/0144).
 *
 * That is why this is 3 + 16 generated fields rather than ~44 hand-written ones.
 *
 * Property sources, read from the bundled stixorm package at run time so they cannot drift:
 *   base      stix2/v21/sdo.py                                 class Incident
 *   extension stixorm/module/definitions/os_threat/classes.py   IncidentCoreExt
 *
 *     node e2e/author-incident-update-form.mjs             # report + dump the tree it would create
 *     node e2e/author-incident-update-form.mjs --apply     # create the page
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { retarget } from './form-retarget.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const CMS = process.env.CMS_BASE_HTTP || 'http://localhost:8113'
const AUTH = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const APPLY = process.argv.includes('--apply')

const SDO = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms'
const TEMPLATE = `${SDO}/identity-forms/identity-update`
const TARGET_PARENT = `${SDO}/incident-forms`
const TARGET_NAME = 'incident-update'
const OUT = path.join(WORKSPACE, 'docs/runs/2026-08-12-incident-update-tree.json')

/** The incident's extension key, taken from a stored incident rather than assumed. */
const INCIDENT_EXT = 'extension-definition--ef765651-680c-498d-9894-99799f2fa126'

const PKG = path.join(WORKSPACE, 'typerefinery/services/fastapi/__packages__/Python311/site-packages')

/**
 * Read an `_properties` OrderedDict out of a Python class body.
 *
 * Deliberately narrow, not a Python parser: if the shape ever changes this returns nothing rather
 * than something plausible-but-wrong.
 */
const propsOf = (file, className) => {
  const src = fs.readFileSync(path.join(PKG, file), 'utf8')
  const at = src.indexOf(`class ${className}(`)
  if (at < 0) return []
  const from = src.indexOf('_properties = OrderedDict([', at)
  if (from < 0) return []
  const body = src.slice(from, src.indexOf('])', from))
  return [...body.matchAll(/\(\s*'([a-z_0-9]+)'\s*,\s*([A-Za-z_]+)/g)].map((m) => ({
    name: m[1],
    kind: m[2],
  }))
}

/** STIX property type -> component, taken from what identity-update actually uses. */
const COMPONENT = {
  StringProperty: 'typerefinery/components/stix/forms/input/string',
  TypeProperty: 'typerefinery/components/stix/forms/input/string',
  IDProperty: 'typerefinery/components/stix/forms/input/id',
  ReferenceProperty: 'typerefinery/components/stix/forms/input/reference',
  ThreatReference: 'typerefinery/components/stix/forms/input/reference',
  TimestampProperty: 'typerefinery/components/stix/forms/input/timestamp',
  BooleanProperty: 'typerefinery/components/stix/forms/input/boolean',
  IntegerProperty: 'typerefinery/components/stix/forms/input/integer',
  ListProperty: 'typerefinery/components/stix/forms/input/string',
  DictionaryProperty: 'typerefinery/components/stix/forms/input/string',
  EmbeddedObjectProperty: 'typerefinery/components/stix/forms/input/string',
}

/** Properties that live in Base Required / Base Optional — cloned, never regenerated. */
const COMMON = new Set([
  'type', 'spec_version', 'id', 'created_by_ref', 'created', 'modified',
  'revoked', 'labels', 'confidence', 'lang', 'external_references',
  'object_marking_refs', 'granular_markings', 'extensions',
])

let seq = 0
const rid = (prefix) => `${prefix}_INC${String(++seq).padStart(3, '0')}`

/** One rendered property: a wrapper carrying a label child and a field child. */
const fieldNode = (prop) => ({
  'jcr:primaryType': 'nt:unstructured',
  'sling:resourceType': COMPONENT[prop.kind],
  id: rid('string'),
  smColSize: '6',
  mdColSize: '6',
  lgColSize: '6',
  label: {
    'jcr:primaryType': 'nt:unstructured',
    'sling:resourceType': 'typerefinery/components/forms/fields/label',
    id: rid('label'),
    label: prop.name,
  },
  field: {
    'jcr:primaryType': 'nt:unstructured',
    'sling:resourceType': 'typerefinery/components/stix/forms/fields/input',
    id: rid('input'),
    name: prop.name,
    inputType: 'string',
    label: 'Field',
    smColSize: '10',
    mdColSize: '10',
    lgColSize: '10',
  },
})

const base = propsOf('stix2/v21/sdo.py', 'Incident')
const ext = propsOf('stixorm/module/definitions/os_threat/classes.py', 'IncidentCoreExt')
const objectProps = base.filter((p) => !COMMON.has(p.name))
const extProps = ext.filter((p) => p.name !== 'extension_type')

console.log(`base Incident properties : ${base.length}  (${objectProps.length} type-specific, rest are STIX common and clone untouched)`)
objectProps.forEach((p) => console.log(`   object    ${p.name.padEnd(20)} ${p.kind}`))
console.log(`IncidentCoreExt          : ${ext.length}  (${extProps.length} rendered; extension_type is fixed)`)
extProps.forEach((p) => console.log(`   extension ${p.name.padEnd(20)} ${p.kind}`))

const unmapped = [...objectProps, ...extProps].filter((p) => !COMPONENT[p.kind])
if (unmapped.length) {
  console.error(`\nFAIL - ${unmapped.length} property type(s) have no component mapping; refusing to guess:`)
  unmapped.forEach((p) => console.error(`   ${p.name} (${p.kind})`))
  process.exit(1)
}

const get = async (url) => {
  const res = await fetch(url, { headers: { Authorization: AUTH } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

const template = await get(`${CMS}${TEMPLATE}.13.json`)
const tree = JSON.parse(JSON.stringify(template))
const form = tree['jcr:content'].rootcontainer.main.form

/** Replace a container's field children, keeping the container itself. */
const setFields = (container, props) => {
  for (const key of Object.keys(container)) {
    const v = container[key]
    if (v && typeof v === 'object' && !key.startsWith('jcr:')) delete container[key]
  }
  props.forEach((p, i) => {
    container[i === 0 ? 'string' : `string_${i}`] = fieldNode(p)
  })
}

// Object group — the type-specific base properties.
setFields(form.composite_1.field.one.container1, objectProps)

// Extensions group — retarget the extension composite and regenerate its fields.
const extComposite = form.composite_3.field.composite
extComposite.field.name = INCIDENT_EXT
if (extComposite.label) extComposite.label.label = INCIDENT_EXT
const extHolder = extComposite.field?.template?.container?.container1
if (!extHolder) {
  console.error('FAIL - could not find the extension field container in the template; refusing to guess')
  process.exit(1)
}
setFields(extHolder, extProps)

/**
 * Drop system-namespace properties the servlet refuses.
 *
 * ⚠️ Measured: a straight clone fails with *"property 'jcr:created' is in a reserved namespace"* —
 * the read-back tree carries repository bookkeeping (`jcr:created`, `jcr:createdBy`, `jcr:uuid`,
 * `ws:lastModified`…) that only the repository may set. `ComponentNodeServlet` allows exactly two
 * system properties, `jcr:primaryType` and `sling:resourceType`, so everything else in a reserved
 * namespace is stripped rather than fought with.
 */
const ALLOWED_SYSTEM = new Set(['jcr:primaryType', 'sling:resourceType'])
const stripReserved = (node) => {
  if (!node || typeof node !== 'object') return
  for (const key of Object.keys(node)) {
    const value = node[key]
    const isChildNode = value && typeof value === 'object' && !Array.isArray(value)

    // ⚠️ Only PROPERTIES are stripped. A reserved-looking key can also be a child NODE name —
    // `jcr:content` is the page's whole content subtree, and deleting it produced a page with
    // 1 node that resolved 404. Recurse into child nodes regardless of their name.
    if (isChildNode) {
      stripReserved(value)
      continue
    }
    if (/^(jcr|rep|oak|ws|mix|nt):/.test(key) && !ALLOWED_SYSTEM.has(key)) delete node[key]
  }
}

// The page must describe itself, not the form it was cloned from.
const content = tree['jcr:content']
for (const k of ['jcr:title', 'propertyTitle', 'ogTitle']) if (content[k]) content[k] = 'incident-update'
if (content.description) content.description = 'Incident update form'

// ⚠️ docs/issues/0158 — the page metadata above is NOT what a viewer sees. The first cut of this
// form rendered `<h1>Identity Form</h1>` with a greyed `type` reading `identity`, and posted to
// identity-update's own endpoint, while scoring "200, 35 inputs". Retarget the strings that carry
// the template's type; the extension button is set to the real incident extension below.
for (const line of retarget(tree, 'incident', 'identity', `${TARGET_PARENT}/${TARGET_NAME}`)) console.log(`retarget ${line}`)

stripReserved(tree)

const countNodes = (n) => {
  let c = 0
  ;(function walk(x) {
    if (!x || typeof x !== 'object') return
    for (const v of Object.values(x)) if (v && typeof v === 'object') { c++; walk(v) }
  })(n)
  return c
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(tree, null, 1))
console.log(`\ntemplate nodes ${countNodes(template)}  ->  target nodes ${countNodes(tree)}`)
console.log(`tree written for review: ${OUT}`)

if (!APPLY) {
  console.log('\ndry run - nothing created. Review the tree above, then re-run with --apply.')
  process.exit(0)
}

const post = (body) =>
  fetch(`${CMS}/bin/typerefinery/component-node`, {
    method: 'POST',
    headers: { Authorization: AUTH, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  })

const folder = await post({ parent: SDO, name: 'incident-forms', json: JSON.stringify({ 'jcr:primaryType': 'sling:Folder' }) })
console.log(`create incident-forms -> ${folder.status}`)

const page = await post({ parent: TARGET_PARENT, name: TARGET_NAME, json: JSON.stringify(tree) })
const body = await page.text()
console.log(`create ${TARGET_NAME} -> ${page.status} ${body.slice(0, 160)}`)

// A 200 from the servlet is not evidence the page renders (docs/issues/0057) - read it back.
const check = await fetch(`${CMS}${TARGET_PARENT}/${TARGET_NAME}.html`, { headers: { Authorization: AUTH } })
const html = await check.text()
console.log(`GET ${TARGET_NAME}.html -> ${check.status}, ${(html.match(/<input/g) || []).length} input(s)`)
