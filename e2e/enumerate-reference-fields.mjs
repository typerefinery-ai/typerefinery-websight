/**
 * docs/issues/0060 — how much authoring does decision 0011 Option 1 actually need?
 *
 * The decision deliberately puts "which URL, which parameters" in authored content rather than
 * inferring it from the field name (which would repeat docs/issues/0012). The cost of that choice is
 * authoring, and the cost was recorded as *unmeasured*. This measures it.
 *
 * For every create/update form it reports each field whose `name` ends `_ref` or `_refs`, the
 * component rendering it, and the form's object type — the three things the sweep needs. It writes
 * nothing.
 *
 * ⚠️ Reads with depth-1 walks rather than `.infinity.json`: the latter truncates deep trees on this
 * instance, and these forms nest ~12 levels.
 *
 *     node e2e/enumerate-reference-fields.mjs
 *     node e2e/enumerate-reference-fields.mjs --json > reference-fields.json
 */
const auth = { Authorization: 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64') }
const CMS = 'http://localhost:8113'
const FORMS_ROOT = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms'

const AS_JSON = process.argv.includes('--json')
const log = (...a) => { if (!AS_JSON) console.log(...a) }

async function json(path) {
  const res = await fetch(`${CMS}${path}`, { headers: auth })
  return res.ok ? res.json() : null
}

/** Every `ws:Page` under `root`, depth-first. */
async function pages(root, depth = 0) {
  if (depth > 6) return []
  const node = await json(`${root}.1.json`)
  if (!node) return []
  const out = []
  for (const key of Object.keys(node)) {
    const child = node[key]
    if (!child || typeof child !== 'object' || key.startsWith('jcr:')) continue
    const path = `${root}/${key}`
    if (child['jcr:primaryType'] === 'ws:Page') out.push(path)
    out.push(...(await pages(path, depth + 1)))
  }
  return out
}

/** Every field node under a page's content, with the component rendering it. */
async function fields(root, depth = 0) {
  if (depth > 14) return []
  const node = await json(`${root}.1.json`)
  if (!node) return []
  const out = []
  for (const key of Object.keys(node)) {
    const child = node[key]
    if (!child || typeof child !== 'object' || key.startsWith('jcr:')) continue
    const path = `${root}/${key}`
    if (typeof child.name === 'string' && child.name) {
      out.push({ path, name: child.name, resourceType: child['sling:resourceType'] || '', node: child })
    }
    out.push(...(await fields(path, depth + 1)))
  }
  return out
}

const formPages = await pages(FORMS_ROOT)
log(`forms found: ${formPages.length}`)

const report = []
for (const page of formPages) {
  const all = await fields(`${page}/jcr:content`)
  const refs = all.filter((f) => /_refs?$/.test(f.name.trim()))
  if (!refs.length) continue

  // The form's object type is the read-only `type` field the form itself carries — the same value
  // the connections API wants as `object_type`. Derived, not assumed: if it is missing the sweep
  // must skip that form rather than guess.
  const typeField = all.find((f) => f.name.trim() === 'type')
  const objectType = typeField ? typeField.node.defaultValue || typeField.node.value || '' : ''

  report.push({
    form: page.slice(FORMS_ROOT.length + 1),
    objectType,
    refs: refs.map((r) => ({
      name: r.name.trim(),
      list: r.name.trim().endsWith('_refs'),
      resourceType: r.resourceType,
      authored: Boolean(r.node.readOptionsFromDataSource),
      // ⚠️ Whether the form's `type` is the right `object_type` for this field.
      //
      // A top-level property sits under exactly one `composite*` segment. A field belonging to a
      // **sub-object** — `granular_markings.marking_ref`, or the identity extension's
      // `email_addresses[].email_address_ref` — sits under two or more, and its owning type is that
      // sub-object, NOT the form's type. Probing those with the form's type returns `[]`, which
      // looks exactly like a missing dialect row and is not one. The same shape of mistake as
      // sending `{object, field}` instead of `{object_type, object_field}` (docs/issues/0026).
      nesting: (r.path.match(/\/composite(_\d+)?\//g) || []).length,
      topLevel: (r.path.match(/\/composite(_\d+)?\//g) || []).length <= 1,
      path: r.path,
    })),
  })
}

if (AS_JSON) {
  console.log(JSON.stringify(report, null, 2))
} else {
  let total = 0
  let authored = 0
  let noType = 0
  let nested = 0
  for (const form of report) {
    console.log(`\n${form.form}   type=${form.objectType || '⚠️ UNKNOWN'}`)
    if (!form.objectType) noType++
    for (const ref of form.refs) {
      total++
      if (ref.authored) authored++
      if (!ref.topLevel) nested++
      const kind = ref.resourceType.split('/').pop()
      console.log(
        `   ${ref.authored ? '✅' : '⬜'} ${ref.name.padEnd(26)} ${ref.list ? 'list  ' : 'scalar'} ` +
          `${kind.padEnd(10)} ${ref.topLevel ? '' : `⚠️ sub-object (nesting ${ref.nesting}) — the form's type is NOT its object_type`}`,
      )
    }
  }
  console.log(`\n${report.length} forms carry reference fields`)
  console.log(`${total} reference fields, ${authored} authored, ${total - authored} to go`)
  console.log(`${total - nested} belong to the form's own type; ${nested} belong to a sub-object and cannot be probed with it`)
  if (noType) console.log(`⚠️ ${noType} form(s) have no readable object type — the sweep must skip these, not guess`)
}
