/**
 * docs/issues/0047 — Create SRO opens its modal but never creates the relationship.
 *
 * The route was healed earlier (re-provisioned from /content, so it no longer 404s), but the flow
 * behind it is still the generic `flowform-service`, which only ECHOES the request. This authors
 * the save leg, following the recipe proven by identity-create
 * (docs/flows/identity-create-form-flow-f210cq001bt51d.json):
 *
 *   httppost.output -> mapwrap(code)  -> mksro.payload
 *   mksro.response  -> savewrap(code) -> ctxsave.payload
 *
 * Verified by hand against the live APIs before writing any of it:
 *   POST /stix-orm/sro/relationship      {relationship_form:{…}} -> a full STIX relationship
 *   POST /os-triage/unattached-context/save {stix_object:{…}}    -> persisted
 * and the persisted relationship lands in `unattached_relation.json` / `relation_edges.json` —
 * as an EDGE, not a node. That is why 0047 measured "4 relationships before and after" and
 * concluded nothing was saved: it was counting nodes.
 *
 * ⚠️ Every output is given a sink. In TotalJS Flow, `$.send(...)` to an UNCONNECTED output
 * destroys the message, so a later send is a silent no-op — the fault that cost two ticks on the
 * shaped route. identity-create attaches a printjson to each branch for exactly this reason.
 */
import fs from 'fs'

// Flow id defaults to sro-constraints; pass another to author the same save leg elsewhere.
const FLOW = process.argv[2] || 'f21cf9001rn51d'
const FASTAPI = 'http://localhost:8000'

const design = await (await fetch(`${FASTAPI}/flow/${FLOW}/design`)).json()
if (!design.httppost) throw new Error('httppost node not found — wrong flow?')
if (design.mapwrap) {
  console.log('save leg already present; re-authoring it (idempotent)')
}

/** Component ids, taken from the working identity-create flow rather than guessed. */
const CODE = 'typerefinery_code'
const PRINT = 'typerefinery_printjson'
const HTTP = 'cgkli87a95'

const at = (x, y) => ({ x, y })

const mapwrapCode = `// The Create SRO modal posts the categorised structure
// {base_required, base_optional, object, extensions} like every other stixorm form.
// Wrap it as relationship_form for POST /stix-orm/sro/relationship (whose route wraps the
// body as {api: ...}). See alpha-launch docs/issues/0047.
var form = {};
if (data && typeof data === 'object') {
  if (data.body && typeof data.body === 'object') form = data.body;
  else if (typeof data.body === 'string') { try { form = JSON.parse(data.body); } catch(e) { form = {}; } }
  else form = data;
}
if (!form.object) { console.log('[sro-constraints] no object category in payload, skipping: ' + JSON.stringify(form).slice(0,150)); $.destroy(); return; }
if (!form.sub) form.sub = {};
if (!form.base_optional) form.base_optional = {};
if (!form.extensions) form.extensions = {};
if (!form.base_required) form.base_required = {};
if (!form.base_required.type) form.base_required.type = 'relationship';
if (!form.base_required.spec_version) form.base_required.spec_version = '2.1';
var o = form.object || {};
// Both endpoints accept the object but produce nonsense without a source and target, so fail
// loudly here rather than persisting a dangling relationship.
if (!o.source_ref || !o.target_ref) { console.log('[sro-constraints] missing source_ref/target_ref, skipping: ' + JSON.stringify(o).slice(0,150)); $.destroy(); return; }
console.log('[sro-constraints] relationship_form ' + o.relationship_type + ' ' + o.source_ref + ' -> ' + o.target_ref);
$.send('output', { relationship_form: form });
`

const savewrapCode = `// POST /os-triage/unattached-context/save expects {stix_object: <dict>} (its route wraps the
// body as {api: ...}). Guard non-2xx bodies (docs/issues/0014 residual).
var rel = (data && data.body) || data;
if (!rel || rel.type !== 'relationship') { console.log('[sro-constraints] make-relationship response not a relationship, skipping save: ' + JSON.stringify(rel).slice(0,150)); $.destroy(); return; }
console.log('[sro-constraints] saving unattached relationship id=' + rel.id);
$.send('output', { stix_object: rel });
`

const httpConfig = (url, timeout) => ({
  url,
  method: 'POST',
  dnscache: false,
  insecure: true,
  nocookies: true,
  xhr: false,
  parse: true,
  timeout,
  limit: 512000,
  responsebody: true,
  headers: {},
  cookies: {},
  serialize: 'json',
  send: 'all',
})

Object.assign(design, {
  mapwrap: {
    component: CODE,
    config: { title: 'Wrap form as relationship_form', version: '2', outputs: 1, code: mapwrapCode },
    ...at(520, 120),
    connections: { output: [{ id: 'mksro', index: 'payload' }] },
  },
  mksro: {
    component: HTTP,
    config: httpConfig('http://127.0.0.1:8111/stix-orm/sro/relationship', 15000),
    ...at(760, 120),
    connections: {
      response: [{ id: 'prntmk', index: 'input' }, { id: 'savewrap', index: 'input' }],
      error: [{ id: 'prnterr1', index: 'input' }],
    },
  },
  savewrap: {
    component: CODE,
    config: { title: 'Wrap relationship for unattached save', version: '2', outputs: 1, code: savewrapCode },
    ...at(1000, 120),
    connections: { output: [{ id: 'ctxsave', index: 'payload' }] },
  },
  ctxsave: {
    component: HTTP,
    config: httpConfig('http://127.0.0.1:8111/os-triage/unattached-context/save', 20000),
    ...at(1240, 120),
    connections: {
      response: [{ id: 'prntctx', index: 'input' }],
      error: [{ id: 'prnterr2', index: 'input' }],
    },
  },
  // Sinks — see the warning at the top of this file.
  prntmk: { component: PRINT, config: {}, ...at(760, 300), connections: {} },
  prnterr1: { component: PRINT, config: {}, ...at(760, 380), connections: {} },
  prntctx: { component: PRINT, config: {}, ...at(1240, 300), connections: {} },
  prnterr2: { component: PRINT, config: {}, ...at(1240, 380), connections: {} },
})

// Keep the existing echo sink on httppost — it is what answers the HTTP request — and add the
// save leg alongside it, exactly as identity-create does.
const out = design.httppost.connections?.output ?? []
if (!out.some((c) => c.id === 'mapwrap')) out.push({ id: 'mapwrap', index: 'input' })
design.httppost.connections = { ...design.httppost.connections, output: out }

const res = await fetch(`${FASTAPI}/flow/${FLOW}/design/save`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(design), // the handler wraps this as {TYPE:'save', data: body} itself
})
console.log(`design/save -> ${res.status} ${await res.text()}`)
console.log(`nodes now: ${Object.keys(design).length}`)
