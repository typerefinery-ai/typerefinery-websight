/**
 * docs/issues/0046 — author a save leg on a form flow, generalised.
 *
 * The recipe is the one proven on identity-create / relationship-create / sro-constraints:
 *
 *   httppost.output -> mapwrap(code)  -> mkobj.payload      POST <make-object endpoint>
 *   mkobj.response  -> savewrap(code) -> ctxsave.payload    POST /os-triage/unattached-context/save
 *
 * Two per-form parameters, both measured rather than assumed (2026-08-05):
 *
 * 1. **The wrapper key is `<type with hyphens turned into underscores>_form`.**
 *    `user-account` -> `user_account_form`. Sending `user-account_form` returns a
 *    200-with-error-body (the docs/issues/0026 pattern), so the hyphen is not a cosmetic detail.
 *
 * 2. **The API always wants the CATEGORISED structure** — `{base_required, base_optional, sub,
 *    object, extensions}` — even when the form posts **flat** fields. `create-user` posts
 *    `{user_id, account_login, display_name, account_type}` with no categories at all, so the code
 *    node has to build them.
 *
 * ⚠️ Every output gets a printjson sink: `$.send` to an unconnected output destroys the message.
 *
 *     node e2e/author-form-save-leg.mjs <flowId> <makeObjectUrl> <wrapperKey> <stixType>
 */
import fs from 'fs'

const [flowId, makeUrl, wrapperKey, stixType] = process.argv.slice(2)
if (!flowId || !makeUrl || !wrapperKey || !stixType) {
  console.error('usage: author-form-save-leg.mjs <flowId> <makeObjectUrl> <wrapperKey> <stixType>')
  process.exit(1)
}

const FASTAPI = 'http://localhost:8000'
const design = await (await fetch(`${FASTAPI}/flow/${flowId}/design`)).json()
if (!design.httppost) throw new Error(`httppost node not found in ${flowId}`)

const CODE = 'typerefinery_code'
const PRINT = 'typerefinery_printjson'
const HTTP = 'cgkli87a95'
const at = (x, y) => ({ x, y })

const mapwrapCode = `// Build the categorised structure the Make-Object API expects.
// This form may post FLAT fields (create-user does), so anything that is not already a category
// becomes part of "object". See alpha-launch docs/issues/0046.
var body = {};
if (data && typeof data === 'object') {
  if (data.body && typeof data.body === 'object') body = data.body;
  else if (typeof data.body === 'string') { try { body = JSON.parse(data.body); } catch(e) { body = {}; } }
  else body = data;
}
var CATEGORIES = ['base_required','base_optional','sub','object','extensions'];
var form = { base_required: {}, base_optional: {}, sub: {}, object: {}, extensions: {} };
var flat = 0;
Object.keys(body || {}).forEach(function(k) {
  if (CATEGORIES.indexOf(k) >= 0) { form[k] = body[k] || form[k]; }
  else { form.object[k] = body[k]; flat++; }
});
form.base_required.type = form.base_required.type || '${stixType}';
form.base_required.spec_version = form.base_required.spec_version || '2.1';
if (!Object.keys(form.object).length) { console.log('[${stixType}] no object properties in payload, skipping: ' + JSON.stringify(body).slice(0,150)); $.destroy(); return; }
console.log('[${stixType}] ${wrapperKey} with ' + Object.keys(form.object).length + ' object props (' + flat + ' from flat fields)');
var wrapped = {};
wrapped['${wrapperKey}'] = form;
$.send('output', wrapped);
`

const savewrapCode = `// POST /os-triage/unattached-context/save expects {stix_object: <dict>}.
// Guard non-2xx bodies, and guard the 200-with-error-body case (docs/issues/0026): a failed
// Make-Object returns {"error":"true"} with HTTP 200, which must not be saved.
var obj = (data && data.body) || data;
if (!obj || obj.error || obj.type !== '${stixType}') { console.log('[${stixType}] make-object response is not a ${stixType}, skipping save: ' + JSON.stringify(obj).slice(0,150)); $.destroy(); return; }
console.log('[${stixType}] saving unattached object id=' + obj.id);
$.send('output', { stix_object: obj });
`

const httpConfig = (url, timeout) => ({
  url, method: 'POST', dnscache: false, insecure: true, nocookies: true, xhr: false,
  parse: true, timeout, limit: 512000, responsebody: true, headers: {}, cookies: {},
  serialize: 'json', send: 'all',
})

Object.assign(design, {
  mapwrap: {
    component: CODE,
    config: { title: `Wrap form as ${wrapperKey}`, version: '2', outputs: 1, code: mapwrapCode },
    ...at(520, 120),
    connections: { output: [{ id: 'mkobj', index: 'payload' }] },
  },
  mkobj: {
    component: HTTP,
    config: httpConfig(makeUrl, 15000),
    ...at(760, 120),
    connections: {
      response: [{ id: 'prntmk', index: 'input' }, { id: 'savewrap', index: 'input' }],
      error: [{ id: 'prnterr1', index: 'input' }],
    },
  },
  savewrap: {
    component: CODE,
    config: { title: 'Wrap for unattached save', version: '2', outputs: 1, code: savewrapCode },
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
  prntmk: { component: PRINT, config: {}, ...at(760, 300), connections: {} },
  prnterr1: { component: PRINT, config: {}, ...at(760, 380), connections: {} },
  prntctx: { component: PRINT, config: {}, ...at(1240, 300), connections: {} },
  prnterr2: { component: PRINT, config: {}, ...at(1240, 380), connections: {} },
})

const out = design.httppost.connections?.output ?? []
if (!out.some((c) => c.id === 'mapwrap')) out.push({ id: 'mapwrap', index: 'input' })
design.httppost.connections = { ...design.httppost.connections, output: out }

const res = await fetch(`${FASTAPI}/flow/${flowId}/design/save`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(design),
})
console.log(`design/save -> ${res.status} ${await res.text()}`)
console.log(`${flowId}: ${Object.keys(design).length} nodes, wrapper ${wrapperKey}, type ${stixType}`)
