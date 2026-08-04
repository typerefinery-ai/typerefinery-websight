/**
 * docs/issues/0046 — save leg for the *update*-shaped forms.
 *
 * These are the last routed forms that echo. They differ from the create forms in one way that
 * matters: they modify an object that already exists, so there is no Make-Object call.
 *
 * ⚠️ **The obvious implementation loses data.** An update form posts the fields it *rendered*, and
 * `/os-triage/unattached-context/save` **REPLACES** the stored object rather than merging it
 * (measured: writing 4 fields over an 11-property identity left 4 and destroyed `name`). So saving
 * the posted body directly would silently drop every property the form does not render — extensions
 * and references among them. P5-S4 measured update forms as pre-filling ~8 of 10 visible inputs, so
 * this is not hypothetical.
 *
 * The chain is therefore the one proven for Create Connection (decision 0009):
 *
 *   httppost -> mapwrap(code)  : pull the object id + posted properties out of the body
 *            -> fetchgraph     : GET /viz-data/unattached-split
 *            -> merge(code)    : merge posted properties ONTO the stored object, emit the whole thing
 *            -> ctxsave        : POST /os-triage/unattached-context/save
 *
 * ⚠️ `$.repo` — not `$.repository`, which is undefined — carries the payload past the HTTP node,
 * because the response replaces the message.
 *
 *     node e2e/author-update-save-leg.mjs <flowId> <stixType>
 */
import fs from 'fs'

const [flowId, stixType] = process.argv.slice(2)
if (!flowId || !stixType) {
  console.error('usage: author-update-save-leg.mjs <flowId> <stixType>')
  process.exit(1)
}

const FASTAPI = 'http://localhost:8000'
const design = await (await fetch(`${FASTAPI}/flow/${flowId}/design`)).json()
if (!design.httppost) throw new Error(`httppost node not found in ${flowId}`)

const CODE = 'typerefinery_code'
const PRINT = 'typerefinery_printjson'
const HTTP = 'cgkli87a95'
const at = (x, y) => ({ x, y })

const mapwrapCode = `// Update forms post either the categorised structure or flat fields. Either way we need the
// object's id and the properties the analyst changed. See alpha-launch docs/issues/0046.
var body = {};
if (data && typeof data === 'object') {
  if (data.body && typeof data.body === 'object') body = data.body;
  else if (typeof data.body === 'string') { try { body = JSON.parse(data.body); } catch(e) { body = {}; } }
  else body = data;
}
var CATEGORIES = ['base_required','base_optional','sub','object','extensions'];
var props = {};
Object.keys(body || {}).forEach(function(k) {
  if (CATEGORIES.indexOf(k) >= 0) {
    var cat = body[k] || {};
    Object.keys(cat).forEach(function(ck) { props[ck] = cat[ck]; });
  } else {
    props[k] = body[k];
  }
});
var id = props.id;
if (!id) { console.log('[${stixType}-update] no object id in payload, refusing to write: ' + JSON.stringify(body).slice(0,160)); $.destroy(); return; }
// Never let the form change identity or type.
delete props.id; delete props.type; delete props.spec_version;
console.log('[${stixType}-update] ' + id + ' with ' + Object.keys(props).length + ' posted properties');
try { $.repo.update = { id: id, props: props }; } catch (e) { console.log('[${stixType}-update] no repo: ' + e.message); }
$.send('output', { update: { id: id, props: props } });
`

const mergeCode = `// Merge the posted properties onto the STORED object and emit the whole thing.
// unattached-context/save REPLACES, so emitting only what the form posted would drop every
// property it does not render.
var upd = null;
try { upd = $.repo && $.repo.update; } catch (e) { upd = null; }
if (!upd) { console.log('[${stixType}-update] update parameters did not survive the fetch, refusing to write'); $.destroy(); return; }

var graph = (data && data.body) || {};
var nodes = [].concat(graph.nodes || [], (graph.promo && graph.promo.nodes) || [], (graph.scratch && graph.scratch.nodes) || []);
var found = null;
for (var i = 0; i < nodes.length; i++) { if (nodes[i] && nodes[i].id === upd.id) { found = nodes[i]; break; } }
if (!found || !found.original) { console.log('[${stixType}-update] ' + upd.id + ' not found in unattached graph (' + nodes.length + ' nodes), refusing to write'); $.destroy(); return; }

var obj = JSON.parse(JSON.stringify(found.original));
var before = Object.keys(obj).length;
var changed = 0;
Object.keys(upd.props).forEach(function(k) {
  var v = upd.props[k];
  // Skip blanks: an unrendered or cleared input must not erase a stored value by accident.
  if (v === null || v === undefined || v === '') return;
  if (JSON.stringify(obj[k]) !== JSON.stringify(v)) { obj[k] = v; changed++; }
});
if (!changed) { console.log('[${stixType}-update] nothing changed for ' + upd.id + ', skipping write'); $.destroy(); return; }
console.log('[${stixType}-update] saving ' + obj.id + ': ' + before + ' -> ' + Object.keys(obj).length + ' properties, ' + changed + ' changed');
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
    config: { title: 'Extract id + posted properties', version: '2', outputs: 1, code: mapwrapCode },
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
    config: { title: 'Merge onto the stored object', version: '2', outputs: 1, code: mergeCode },
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

const res = await fetch(`${FASTAPI}/flow/${flowId}/design/save`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(design),
})
console.log(`design/save -> ${res.status} ${await res.text()}`)
console.log(`${flowId}: ${Object.keys(design).length} nodes, type ${stixType}`)
