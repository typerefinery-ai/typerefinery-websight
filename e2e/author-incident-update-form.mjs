/**
 * decision 0034 (Decided 2026-08-12, Denis — Option 1) — author `incident-update`, the form Act 2's
 * central node needs.
 *
 * 🔑 **Clones a proven form rather than inventing a page.** `identity-update` already works
 * (26 of 28 Overview nodes resolve through this shape), so its tree is the template: the Base
 * Required / Base Optional groups are STIX common properties and are identical for every SDO. Only
 * the **Object** and **Extensions** groups differ per type, and those are generated from
 * `_properties` — never hand-typed, per the decision's own instruction, because a wrong `name`
 * serialises under a fallback key and crashes the algorithm while the browser sees HTTP 200
 * (docs/issues/0144).
 *
 * Property sources, both read from the bundled stixorm package so this cannot drift from the API:
 *   base      stix2/v21/sdo.py                              class Incident
 *   extension stixorm/module/definitions/os_threat/classes.py  IncidentCoreExt
 *
 * ⚠️ Writes authored CMS content. Dry run by default; `--apply` creates the page. Every node it
 * creates is removable with the same servlet's `operation=delete&recursive=true` (docs/issues/0139).
 *
 *     node e2e/author-incident-update-form.mjs            # report only
 *     node e2e/author-incident-update-form.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const CMS = process.env.CMS_BASE_HTTP || 'http://localhost:8113'
const AUTH = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const APPLY = process.argv.includes('--apply')

const SDO = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms'
const TEMPLATE = `${SDO}/identity-forms/identity-update`
const TARGET_PARENT = `${SDO}/incident-forms`
const TARGET_NAME = 'incident-update'

const PKG = path.join(
  WORKSPACE,
  'typerefinery/services/fastapi/__packages__/Python311/site-packages',
)

/**
 * Pull an `_properties` OrderedDict out of a Python class body.
 *
 * Deliberately a narrow reader, not a Python parser: it takes the first `_properties = OrderedDict([`
 * after the class line and returns each `('name', Type…)` pair in order. If the shape ever changes
 * this returns nothing rather than something plausible-but-wrong.
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

/** STIX property type -> the component that renders it, taken from what identity-update uses. */
const COMPONENT = {
  StringProperty: 'string',
  TypeProperty: 'string',
  IDProperty: 'id',
  ReferenceProperty: 'reference',
  ThreatReference: 'reference',
  TimestampProperty: 'timestamp',
  BooleanProperty: 'boolean',
  IntegerProperty: 'integer',
  ListProperty: 'string',
  DictionaryProperty: 'string',
  EmbeddedObjectProperty: 'string',
  ExtensionsProperty: null, // rendered by the Extensions group itself, not as a field
}

const base = propsOf('stix2/v21/sdo.py', 'Incident')
const ext = propsOf('stixorm/module/definitions/os_threat/classes.py', 'IncidentCoreExt')

console.log(`base Incident properties      : ${base.length}`)
base.forEach((p) => console.log(`   ${p.name.padEnd(22)} ${p.kind}`))
console.log(`\nIncidentCoreExt properties    : ${ext.length}`)
ext.forEach((p) => console.log(`   ${p.name.padEnd(22)} ${p.kind}`))

const unmapped = [...base, ...ext].filter((p) => !(p.kind in COMPONENT))
if (unmapped.length) {
  console.log(`\n⚠️  ${unmapped.length} property type(s) have no component mapping — refusing to guess:`)
  unmapped.forEach((p) => console.log(`   ${p.name} (${p.kind})`))
}

const get = async (url) => {
  const res = await fetch(url, { headers: { Authorization: AUTH } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

const template = await get(`${CMS}${TEMPLATE}.13.json`)
const countNodes = (n) => {
  let c = 0
  ;(function walk(x) {
    if (!x || typeof x !== 'object') return
    for (const v of Object.values(x)) {
      if (v && typeof v === 'object') {
        c++
        walk(v)
      }
    }
  })(n)
  return c
}
console.log(`\ntemplate ${TEMPLATE.split('/').pop()} : ${countNodes(template)} nodes`)

const targetExists = await fetch(`${CMS}${TARGET_PARENT}/${TARGET_NAME}.json`, {
  headers: { Authorization: AUTH },
}).then((r) => r.ok)
console.log(`target ${TARGET_PARENT}/${TARGET_NAME} exists: ${targetExists}`)

console.log(`
PLAN
  1. create  ${TARGET_PARENT}            (ws:Page folder, if absent)
  2. create  ${TARGET_PARENT}/${TARGET_NAME}   from the template tree
  3. replace the Object group's fields with the ${base.length} base + ${ext.length} extension properties above
  4. verify every authored field name against _properties, and that the page renders inputs
`)

if (!APPLY) {
  console.log('dry run - nothing written. Re-run with --apply.')
  process.exit(0)
}

console.log('⚠️  --apply is not implemented yet: steps 2-3 need the field-tree writer.')
console.log('    Stopping rather than creating a half-formed page.')
process.exit(1)
