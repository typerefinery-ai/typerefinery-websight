/**
 * docs/issues/0060 Option 1 — author the options source on every reference field the data source can
 * actually serve.
 *
 * ⚠️ **Deliberately not a bulk sweep.** Measured 2026-08-05: of the 72 `(object_type, object_field)`
 * pairs the authored forms contain, only **19** return candidates; 34 have no row in the dialect data
 * at all ([0061](../../docs/issues/0061-connections-dialect-data-has-no-row-for-34-reference-fields.md)).
 * Authoring a field whose source answers `200 []` replaces a text box an author *can* type into with
 * an empty dropdown they *cannot* — strictly worse. So each field is **probed before it is authored**.
 *
 * Probing live rather than reading a stored list is the point: as 0061 is fixed, re-running this
 * picks up the newly-answerable fields with no edit here.
 *
 * Exclusions, each for a measured reason:
 *   - `template_object_marking_refs` and friends are **layout templates**, not fields. Authoring one
 *     would configure a container.
 *   - two modal forms carry `source_ref`/`target_ref` with **no readable object type**. Skip, never
 *     guess — a wrong `object_type` silently returns `[]`, which looks identical to a missing row.
 *   - 🚨 **update forms, unless `--include-update`.** An update form is pre-filled with the object's
 *     current values (P5-S4), but the candidate list comes from `get_objects_from_unattached` — only
 *     *unattached* objects. A reference already pointing at something attached to the incident has
 *     **no matching option**, so the select cannot hold it and saving would drop or change it. A text
 *     box carries any value; a select carries only the ones it was given. Create forms have no
 *     pre-fill and no such hazard.
 *
 * A create-form select does **not** stamp a default reference on save — verified against the object
 * `P5-S3` wrote after `created_by_ref` became a select: no `created_by_ref` on it, and 0 of 21
 * unattached identities carry one.
 *
 *     node e2e/author-reference-options-sweep.mjs            # report (probes, writes nothing)
 *     node e2e/author-reference-options-sweep.mjs --apply
 *     node e2e/author-reference-options-sweep.mjs --apply --include-update   # see the hazard above
 */
const auth = { Authorization: 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64') }
const CMS = 'http://localhost:8113'
const NODE_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-node'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const FORMS_ROOT = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms'
// Direct port for the probe (this script runs in node, no CORS), Traefik https for what gets
// authored — the form is served over https and cannot fetch localhost:8111 (decision 0006).
const PROBE_URL = 'http://localhost:8111/stix-orm/utils/connections'
const AUTHORED_URL = 'https://flow.typerefinery.localhost:8101/stix-orm/utils/connections'
const RESOURCE_TYPE = 'typerefinery/components/stix/forms/fields/select'

const APPLY = process.argv.includes('--apply')
const INCLUDE_UPDATE = process.argv.includes('--include-update')

async function json(path) {
  const res = await fetch(`${CMS}${path}`, { headers: auth })
  return res.ok ? res.json() : null
}

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
      out.push({ path, name: child.name.trim(), resourceType: child['sling:resourceType'] || '', node: child })
    }
    out.push(...(await fields(path, depth + 1)))
  }
  return out
}

const probeCache = new Map()
async function candidateCount(objectType, objectField) {
  const key = `${objectType}|${objectField}`
  if (probeCache.has(key)) return probeCache.get(key)
  let count = -1
  try {
    const res = await fetch(PROBE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ object_type: objectType, object_field: objectField }),
    })
    const body = await res.json()
    // ⚠️ A flow algorithm answers 200 with an error envelope when it throws (docs/issues/0026), and
    // that is an object, not a list. Treat it as "cannot serve", not as zero.
    count = Array.isArray(body) ? body.length : -1
  } catch {
    count = -1
  }
  probeCache.set(key, count)
  return count
}

const formPages = await pages(FORMS_ROOT)
console.log(`forms: ${formPages.length}`)

const plan = []
const skipped = { template: 0, noType: 0, empty: 0, unserviceable: 0, already: 0, update: 0 }

for (const page of formPages) {
  const isUpdate = /-update$/.test(page)
  const all = await fields(`${page}/jcr:content`)
  const refs = all.filter((f) => /_refs?$/.test(f.name))
  if (!refs.length) continue
  if (isUpdate && !INCLUDE_UPDATE) { skipped.update += refs.length; continue }

  const typeField = all.find((f) => f.name === 'type')
  const objectType = typeField ? typeField.node.defaultValue || typeField.node.value || '' : ''

  for (const ref of refs) {
    if (ref.resourceType.endsWith('/template')) { skipped.template++; continue }
    if (!objectType) { skipped.noType++; continue }
    if (ref.node.readOptionsFromDataSource) { skipped.already++; continue }

    const n = await candidateCount(objectType, ref.name)
    if (n < 0) { skipped.unserviceable++; continue }
    if (n === 0) { skipped.empty++; continue }

    plan.push({ form: page.slice(FORMS_ROOT.length + 1), path: ref.path, objectType, field: ref.name, n })
  }
}

console.log(`\nwill author ${plan.length} field(s):`)
for (const p of plan) console.log(`  ${(p.objectType + '/' + p.field).padEnd(36)} ${String(p.n).padStart(3)} candidates   ${p.form}`)
console.log(
  `\nskipped — ${skipped.already} already authored, ${skipped.empty} source returns no candidates ` +
    `(docs/issues/0061), ${skipped.unserviceable} source errored, ${skipped.template} layout templates, ` +
    `${skipped.noType} field(s) on a form with no readable object type, ` +
    `${skipped.update} on update forms${INCLUDE_UPDATE ? ' (included)' : ' (excluded — pre-fill hazard, see header)'}`,
)

if (!APPLY) {
  console.log('\n(report only — pass --apply to author)')
  process.exit(0)
}

let ok = 0
for (const p of plan) {
  const props = [
    ['readOptionsFromDataSource', AUTHORED_URL],
    ['readMethod', 'POST'],
    ['readPayloadType', 'application/json'],
    ['readPayload', JSON.stringify({ object_type: p.objectType, object_field: p.field })],
    ['keyNameInOptionList', 'tooltip.id'],
    ['labelNameInOptionList', 'heading'],
  ]

  // `sling:` is reserved in ComponentPropertyServlet (400); the resource type goes through
  // ComponentNodeServlet, which merges its json into the existing node.
  const parent = p.path.slice(0, p.path.lastIndexOf('/'))
  const name = p.path.slice(p.path.lastIndexOf('/') + 1)
  await fetch(NODE_SERVLET, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ parent, name, json: JSON.stringify({ 'sling:resourceType': RESOURCE_TYPE }) }),
  })
  for (const [n, v] of props) {
    await fetch(PROP_SERVLET, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ path: p.path, name: n, value: v }),
    })
  }

  // Read back — a 200 from the servlet is not evidence the property landed (docs/issues/0057).
  const after = await json(`${p.path}.json`)
  const landed = after && after['sling:resourceType'] === RESOURCE_TYPE && props.every(([n, v]) => String(after[n]) === v)
  console.log(`  ${landed ? '✅' : '❌'} ${p.objectType}/${p.field}   ${p.form}`)
  if (landed) ok++
}

console.log(`\n${ok}/${plan.length} authored and read back`)
process.exit(ok === plan.length ? 0 : 1)
