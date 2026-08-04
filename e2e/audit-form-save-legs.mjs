/**
 * Which authored forms can actually SAVE?
 *
 * P5-S3 / docs/issues/0009 have long recorded "only 1 of 29 forms has its save flow authored".
 * That was a count, never a measurement. It is measurable from the content: a form whose save leg
 * is wired carries `flowapi_httproute` (and usually `flowapi_topic`) on its `form` node; one without
 * carries only `flowapi_sampledata` / `flowapi_template` / `id`.
 *
 * Established 2026-08-04 by comparing modal-forms/sro-constraints (Create SRO, works) against
 * modal-forms/foreign-key-connections (Create Connection, fires no request at all).
 *
 * Walks every page under the os-triage forms tree, finds each `form` node, and reports.
 */
const BASE = 'https://cms.typerefinery.localhost:8101'
const ROOT = '/content/typerefinery-showcase/pages/os-triage/forms'
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const get = async (path) => {
  try {
    const r = await fetch(`${BASE}${path}`, { headers: { Authorization: auth } })
    return r.ok ? await r.json() : null
  } catch { return null }
}

/** Depth-first: collect every page path (a node with a jcr:content child). */
const pages = []
async function findPages(path, depth) {
  if (depth > 5) return
  const j = await get(`${path}.1.json`)
  if (!j) return
  if (j['jcr:content'] !== undefined) pages.push(path)
  for (const [k, v] of Object.entries(j)) {
    if (k.startsWith('jcr:') || k.startsWith('sling:')) continue
    if (v && typeof v === 'object') await findPages(`${path}/${k}`, depth + 1)
  }
}
await findPages(ROOT, 0)
console.log(`found ${pages.length} form pages under ${ROOT}\n`)

/**
 * Find the `form` node and report its wiring.
 *
 * IMPORTANT: read from the `/var/typerefinery/flow/...` mirror, NOT from /content. Flow-managed
 * values — including `flowapi_httproute` — are written there, so a /content read reports forms that
 * demonstrably save (identity-create, createincident) as having no save leg. Measured 2026-08-04:
 * /content said 9 of 45 had a route; that was an artefact of reading the wrong store.
 *
 * `flowapi_enable` is the *authored* request for a flow and lives on /content; `flowapi_httproute`
 * is the *result* and lives on /var. A form with enable but no route means provisioning failed.
 */
const VAR = '/var/typerefinery/flow'
const rows = []
for (const p of pages) {
  const content = await get(`${VAR}${p}/jcr:content.4.json`) || await get(`${p}/jcr:content.4.json`)
  if (!content) continue
  let found = null
  const walk = (o) => {
    for (const [k, v] of Object.entries(o)) {
      if (!v || typeof v !== 'object') continue
      // Match on the node name alone: the /var mirror does not carry sling:resourceType
      // (its nodes are sling:Folder), so requiring it silently skipped most forms.
      if (k === 'form') { found = v; return }
      walk(v)
      if (found) return
    }
  }
  walk(content)
  if (!found) continue
  const props = Object.keys(found)
  rows.push({
    page: p.replace(ROOT + '/', ''),
    route: !!found.flowapi_httproute,
    topic: !!found.flowapi_topic,
    enable: found.flowapi_enable,
    props: props.filter(k => k.startsWith('flowapi_')).join(','),
  })
}

const canSave = rows.filter(r => r.route)
const cannot = rows.filter(r => !r.route)
console.log(`FORMS WITH A SAVE LEG (flowapi_httproute present): ${canSave.length}`)
for (const r of canSave) console.log(`   ✅ ${r.page}   topic=${r.topic} enable=${r.enable}`)
console.log(`\nFORMS WITHOUT (no flowapi_httproute): ${cannot.length}`)
for (const r of cannot) console.log(`   ❌ ${r.page}`)
console.log(`\nTOTAL form nodes inspected: ${rows.length}`)
