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
import fs from 'fs'

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
  // Track the path to the form node as well as the node itself: remediation has to WRITE
  // flowapi_enable on the /content node, and without the path a caller has to guess it
  // (docs/issues/0047).
  let foundPath = null
  const walk = (o, trail) => {
    for (const [k, v] of Object.entries(o)) {
      if (!v || typeof v !== 'object') continue
      // Match on the node name alone: the /var mirror does not carry sling:resourceType
      // (its nodes are sling:Folder), so requiring it silently skipped most forms.
      if (k === 'form') { found = v; foundPath = [...trail, k]; return }
      walk(v, [...trail, k])
      if (found) return
    }
  }
  walk(content, [])
  if (!found) continue
  const props = Object.keys(found)
  // A route's *presence* is not its *validity*. docs/issues/0047: sro-constraints has a route, but
  // it was derived from the /var mirror — the URL carries a `/var/typerefinery/flow/` segment and
  // the topic is `sling:Folder_…` (the storage node's type) instead of `form_…`. Submitting 404s.
  const routeUrl = String(found.flowapi_httproute || '')
  const topicVal = String(found.flowapi_topic || '')
  rows.push({
    page: p.replace(ROOT + '/', ''),
    // The /content node to write to. Always /content — the mirror is read-only output.
    contentPath: `${p}/jcr:content/${foundPath.join('/')}`,
    route: !!found.flowapi_httproute,
    topic: !!found.flowapi_topic,
    enable: found.flowapi_enable,
    routeUrl,
    topicVal,
    poisonedRoute: routeUrl.includes('/var/typerefinery/flow'),
    poisonedTopic: !!topicVal && !topicVal.startsWith('form_'),
    props: props.filter(k => k.startsWith('flowapi_')).join(','),
  })
}

// `flowapi_enable` is the authored REQUEST (on /content); `flowapi_httproute` is the provisioned
// RESULT (in /var). Crossing them says *why* a form cannot save, which decides the cost of fixing it.
const enabled = r => String(r.enable) === 'true'
const canSave = rows.filter(r => r.route)
const provisioningFailed = rows.filter(r => !r.route && enabled(r))
const neverAsked = rows.filter(r => !r.route && !enabled(r))

const poisoned = rows.filter(r => r.poisonedRoute || r.poisonedTopic)
const healthy = canSave.filter(r => !r.poisonedRoute && !r.poisonedTopic)

console.log(`FORMS WITH A *HEALTHY* SAVE LEG: ${healthy.length}`)
for (const r of healthy) console.log(`   ✅ ${r.page}`)

console.log(`\n🚨 POISONED — route or topic derived from the /var mirror (docs/issues/0047): ${poisoned.length}`)
for (const r of poisoned) {
  console.log(`   🚨 ${r.page}`)
  if (r.poisonedRoute) console.log(`        route carries /var/typerefinery/flow → ${r.routeUrl.slice(0, 96)}`)
  if (r.poisonedTopic) console.log(`        topic is not form_* → ${r.topicVal}`)
}

console.log(`\n⚠️  ENABLED BUT NO ROUTE — provisioning FAILED, needs investigation: ${provisioningFailed.length}`)
for (const r of provisioningFailed) console.log(`   ⚠️  ${r.page}`)

console.log(`\nNEVER ASKED FOR A FLOW (no flowapi_enable) — candidates for the one-property fix: ${neverAsked.length}`)
for (const r of neverAsked) console.log(`   ○ ${r.page}`)

console.log(`\nTOTAL form nodes inspected: ${rows.length}`)
console.log('\n⚠️  A provisioned flow is NOT a working save. docs/issues/0046: enabling the Create')
console.log('   Connection form gave it a route, but the generic flowform-service flow only ECHOES —')
console.log('   the save logic is still authored per form. Treat the third list as "cheap to try",')
console.log('   not "cheap to fix", and never bulk-enable.')

// Machine-readable output, so remediation works from measured paths rather than a hand-copied
// list (docs/issues/0047).
fs.writeFileSync(
  'audit-form-save-legs.json',
  JSON.stringify({ healthy, poisoned, provisioningFailed, neverAsked }, null, 1),
)
console.log('\nwrote audit-form-save-legs.json')
