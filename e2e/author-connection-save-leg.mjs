/**
 * decision 0009 (Option 2) — Create Connection's save leg, composed from HTTP nodes.
 *
 * ⚠️ **This is a deliberate deviation from the architecture**, flagged per `CLAUDE.md`. Every
 * comparable read-modify-write in this system (`Tree_Copy_Unattached`, behind
 * `/os-triage/rmb-tree/copy-to-unattached`) is a single server-side Python component. No equivalent
 * block exists for connections — `brett_blocks` carries only the read side — and the user chose to
 * compose locally rather than wait for one. See docs/decisions/0009.
 *
 * The chain:
 *
 *   httppost -> mapwrap(code)  : validate {source_ref, target_ref, connection_field_list}
 *            -> fetchgraph     : GET /viz-data/unattached-split
 *            -> merge(code)    : find source_ref, set the field, emit the WHOLE object
 *            -> ctxsave        : POST /os-triage/unattached-context/save
 *
 * ⚠️ **The fetch is mandatory.** `unattached-context/save` REPLACES the stored object rather than
 * merging it — measured: writing `{id, type, spec_version, created_by_ref}` over an 11-property
 * identity left it with 4 and destroyed `name`. Saving anything less than the full object is silent
 * data loss, and the API reports success either way.
 *
 * ⚠️ **Unknown being tested here:** whether the original POST body survives past an HTTP request
 * node, since the response replaces the message. `merge` therefore SEARCHES the message for the
 * connection parameters and **`$.destroy()`s if it cannot find them** — so a failure is a safe no-op
 * (nothing written) rather than an object saved without its field, or worse, truncated.
 */
import fs from 'fs'

const FLOW = process.argv[2] || 'f21cbw001rn51d'
const FASTAPI = 'http://localhost:8000'

const design = await (await fetch(`${FASTAPI}/flow/${FLOW}/design`)).json()
if (!design.httppost) throw new Error(`httppost node not found in ${FLOW}`)

const CODE = 'typerefinery_code'
const PRINT = 'typerefinery_printjson'
const HTTP = 'cgkli87a95'
const at = (x, y) => ({ x, y })

const mapwrapCode = `// Create Connection posts a FLAT body (captured through the UI, docs/issues/0046):
//   {source_ref, target_ref, connection_field_list}
// meaning "set source_ref's <connection_field_list> to target_ref".
var body = {};
if (data && typeof data === 'object') {
  if (data.body && typeof data.body === 'object') body = data.body;
  else if (typeof data.body === 'string') { try { body = JSON.parse(data.body); } catch(e) { body = {}; } }
  else body = data;
}
var src = body.source_ref, tgt = body.target_ref, field = body.connection_field_list;
if (!src || !tgt || !field) { console.log('[connection] missing source_ref/target_ref/connection_field_list, skipping: ' + JSON.stringify(body).slice(0,160)); $.destroy(); return; }
console.log('[connection] ' + src + '.' + field + ' = ' + tgt);
// Carry the parameters forward explicitly. Whether they survive the HTTP node is the open
// question; merge() searches for them and refuses to write if they are gone.
$.send('output', { connection: { source_ref: src, target_ref: tgt, field: field } });
`

const mergeCode = `// Find the source object in the fetched graph, set the field, and emit the WHOLE object.
// unattached-context/save REPLACES rather than merges, so a partial write would destroy data.
function findConnection(node, depth) {
  if (!node || typeof node !== 'object' || depth > 4) return null;
  if (node.source_ref && node.target_ref && node.field) return node;
  for (var k in node) { var f = findConnection(node[k], depth + 1); if (f) return f; }
  return null;
}
var conn = findConnection(data, 0);
if (!conn) { console.log('[connection] parameters did not survive the fetch, refusing to write'); $.destroy(); return; }

var graph = (data && data.body) || {};
var nodes = [].concat(graph.nodes || [], (graph.promo && graph.promo.nodes) || [], (graph.scratch && graph.scratch.nodes) || []);
var found = null;
for (var i = 0; i < nodes.length; i++) { if (nodes[i] && nodes[i].id === conn.source_ref) { found = nodes[i]; break; } }
if (!found || !found.original) { console.log('[connection] source object ' + conn.source_ref + ' not found in unattached graph (' + nodes.length + ' nodes), skipping'); $.destroy(); return; }

var obj = JSON.parse(JSON.stringify(found.original));
// A *_refs field is a list, a *_ref field is single. Appending is the right shape for a list, and
// avoids clobbering references the object already has.
if (/_refs$/.test(conn.field)) {
  var list = Array.isArray(obj[conn.field]) ? obj[conn.field].slice() : [];
  if (list.indexOf(conn.target_ref) < 0) list.push(conn.target_ref);
  obj[conn.field] = list;
} else {
  obj[conn.field] = conn.target_ref;
}
console.log('[connection] saving ' + obj.id + ' with ' + Object.keys(obj).length + ' properties, ' + conn.field + ' set');
$.send('output', { stix_object: obj });
`

const httpConfig = (url, method, timeout) => ({
  url, method, dnscache: false, insecure: true, nocookies: true, xhr: false,
  parse: true, timeout, limit: 2048000, responsebody: true, headers: {}, cookies: {},
  serialize: 'json', send: 'all',
})

Object.assign(design, {
  mapwrap: {
    component: CODE,
    config: { title: 'Validate connection parameters', version: '2', outputs: 1, code: mapwrapCode },
    ...at(520, 120),
    connections: { output: [{ id: 'fetchgraph', index: 'payload' }] },
  },
  fetchgraph: {
    component: HTTP,
    config: httpConfig('http://127.0.0.1:8111/viz-data/unattached-split', 'GET', 20000),
    ...at(760, 120),
    connections: {
      response: [{ id: 'prntfetch', index: 'input' }, { id: 'merge', index: 'input' }],
      error: [{ id: 'prnterr1', index: 'input' }],
    },
  },
  merge: {
    component: CODE,
    config: { title: 'Set the reference on the whole object', version: '2', outputs: 1, code: mergeCode },
    ...at(1000, 120),
    connections: { output: [{ id: 'ctxsave', index: 'payload' }] },
  },
  ctxsave: {
    component: HTTP,
    config: httpConfig('http://127.0.0.1:8111/os-triage/unattached-context/save', 'POST', 20000),
    ...at(1240, 120),
    connections: {
      response: [{ id: 'prntctx', index: 'input' }],
      error: [{ id: 'prnterr2', index: 'input' }],
    },
  },
  prntfetch: { component: PRINT, config: {}, ...at(760, 300), connections: {} },
  prnterr1: { component: PRINT, config: {}, ...at(760, 380), connections: {} },
  prntctx: { component: PRINT, config: {}, ...at(1240, 300), connections: {} },
  prnterr2: { component: PRINT, config: {}, ...at(1240, 380), connections: {} },
})

const out = design.httppost.connections?.output ?? []
if (!out.some((c) => c.id === 'mapwrap')) out.push({ id: 'mapwrap', index: 'input' })
design.httppost.connections = { ...design.httppost.connections, output: out }

const res = await fetch(`${FASTAPI}/flow/${FLOW}/design/save`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(design),
})
console.log(`design/save -> ${res.status} ${await res.text()}`)
console.log(`${FLOW}: ${Object.keys(design).length} nodes`)
