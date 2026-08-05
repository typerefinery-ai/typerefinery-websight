/**
 * docs/decisions/0010 Option 1 — the API half of Promote, composed from routes that already exist.
 *
 * GitHub #84: *"the Promote API needs to delete those objects from the unattached context memory and
 * save them onto the incident context memory"*. [decision 0007](../../docs/decisions/0007-scratch-pane-semantics.md)
 * settled the semantics from #78: **Promo and Scratch are both inside *unattached***, so Promote
 * crosses a different boundary — unattached → the incident — and it moves a **sub-graph**, not one
 * object.
 *
 * No promote route exists anywhere (docs/issues/0045, confirmed by a route-level diff), so this
 * composes one from three that do:
 *
 *   GET  /viz-data/unattached-split          resolve the object and everything attached to it
 *   POST /os-triage/incident-context/save    {stix_object, context_type:{context_type:"other"}}
 *   POST /os-triage/rmb-force/remove-object  drop it from unattached
 *
 * `context_type` indexes the algorithm's own `incident_data` map, where `"other"` is
 * `other_object_refs.json` — the incident's bucket for objects that are not sequence/impact/event/task.
 *
 * ⚠️ Flow conventions this chain depends on, each learned the hard way:
 *   - `$.repo` carries data past an HTTP node; `$.repository` is undefined and the response
 *     **replaces** the message (docs/issues/0046).
 *   - every output needs a sink, or `$.send()` destroys the message.
 *   - algorithm/code sources must be pure ASCII.
 *   - `POST /flow/<id>/design/save` takes the **raw** design; the handler wraps it.
 *
 *     node e2e/author-promote-subgraph-flow.mjs <flowId>
 */
const [flowId] = process.argv.slice(2)
if (!flowId) {
  console.error('usage: author-promote-subgraph-flow.mjs <flowId>')
  process.exit(1)
}

const FASTAPI = 'http://localhost:8000'
const design = await (await fetch(`${FASTAPI}/flow/${flowId}/design`)).json()
if (!design.httppost) throw new Error(`httppost node not found in ${flowId}`)

const CODE = 'typerefinery_code'
const PRINT = 'typerefinery_printjson'
const HTTP = 'cgkli87a95'
const at = (x, y) => ({ x, y })

const mapreqCode = `// Promote: pull the object id out of the request and stash it for after the fetch.
var body = {};
if (data && typeof data === 'object') {
  if (data.body && typeof data.body === 'object') body = data.body;
  else if (typeof data.body === 'string') { try { body = JSON.parse(data.body); } catch(e) { body = {}; } }
  else body = data;
}
var id = body.id || (body.data && body.data.id);
if (!id) { console.log('[promote] no object id in payload, refusing: ' + JSON.stringify(body).slice(0,160)); $.destroy(); return; }
console.log('[promote] asked to promote ' + id);
try { $.repo.promote = { id: id }; } catch (e) { console.log('[promote] no repo: ' + e.message); }
$.send('output', { promote: { id: id } });
`

const pickCode = `// Resolve the sub-graph: the node itself plus everything its references reach, within
// unattached. #78 defines the sub-graph as everything attached to the node, so follow references
// transitively rather than taking the one object.
var req = null;
try { req = $.repo && $.repo.promote; } catch (e) { req = null; }
if (!req) { console.log('[promote] request parameters did not survive the fetch, refusing'); $.destroy(); return; }

var graph = (data && data.body) || {};
var nodes = [].concat(graph.nodes || [], (graph.promo && graph.promo.nodes) || [], (graph.scratch && graph.scratch.nodes) || []);
var byId = {};
for (var i = 0; i < nodes.length; i++) { if (nodes[i] && nodes[i].id) byId[nodes[i].id] = nodes[i]; }

var root = byId[req.id];
if (!root) { console.log('[promote] ' + req.id + ' not found in unattached (' + nodes.length + ' nodes), refusing'); $.destroy(); return; }

var seen = {};
var queue = [req.id];
while (queue.length) {
  var current = queue.shift();
  if (seen[current] || !byId[current]) continue;
  seen[current] = true;
  var refs = byId[current].references || {};
  for (var key in refs) {
    var list = refs[key] || [];
    for (var j = 0; j < list.length; j++) { if (!seen[list[j]] && byId[list[j]]) queue.push(list[j]); }
  }
}

var subgraph = Object.keys(seen);
console.log('[promote] ' + req.id + ' resolves to a sub-graph of ' + subgraph.length + ' object(s): ' + subgraph.join(', '));

// One message per object: the HTTP nodes downstream act on a single object each.
for (var k = 0; k < subgraph.length; k++) {
  var node = byId[subgraph[k]];
  if (!node || !node.original) { console.log('[promote] skipping ' + subgraph[k] + ', no original'); continue; }
  $.send('output', { stix_object: node.original, context_type: { context_type: 'other' } });
}
`

const dropCode = `// The object is now on the incident; take it out of unattached. The remove route wants the
// STIX object itself, so recover it from the message that went into the save.
var obj = null;
try { obj = $.repo && $.repo.promoted; } catch (e) { obj = null; }
if (!obj) { console.log('[promote] no object recorded for removal, skipping the unattached drop'); $.destroy(); return; }
console.log('[promote] removing ' + obj.id + ' from unattached');
$.send('output', obj);
`

const stashCode = `// Keep the object across the incident-save HTTP call, whose response replaces the message.
var obj = data && data.stix_object;
if (!obj) { console.log('[promote] nothing to stash'); $.destroy(); return; }
try { $.repo.promoted = obj; } catch (e) { console.log('[promote] no repo: ' + e.message); }
$.send('output', data);
`

const httpConfig = (url, method, timeout) => ({
  url, method, dnscache: false, insecure: true, nocookies: true, xhr: false,
  parse: true, timeout, limit: 2048000, responsebody: true, headers: {}, cookies: {},
  serialize: 'json', send: 'all',
})

Object.assign(design, {
  mapreq: {
    component: CODE,
    config: { title: 'Promote: read the object id', version: '2', outputs: 1, code: mapreqCode },
    ...at(520, 120),
    connections: { output: [{ id: 'fetchgraph', index: 'payload' }, { id: 'prntmap', index: 'input' }] },
  },
  fetchgraph: {
    component: HTTP,
    config: httpConfig('http://127.0.0.1:8111/viz-data/unattached-split', 'GET', 20000),
    ...at(760, 120),
    connections: {
      response: [{ id: 'prntfetch', index: 'input' }, { id: 'pick', index: 'input' }],
      error: [{ id: 'prnterr1', index: 'input' }],
    },
  },
  pick: {
    component: CODE,
    config: { title: 'Promote: resolve the sub-graph', version: '2', outputs: 1, code: pickCode },
    ...at(1000, 120),
    // code -> code takes index 'input'. Wiring this 'payload' (which is right for code -> HTTP)
    // silently dropped every message: pick emitted, stash never received, ctxsave never fired, and
    // the route still answered 200. That cost a tick to find.
    connections: { output: [{ id: 'stash', index: 'input' }, { id: 'prntpick', index: 'input' }] },
  },
  stash: {
    component: CODE,
    config: { title: 'Promote: stash the object', version: '2', outputs: 1, code: stashCode },
    ...at(1240, 120),
    connections: { output: [{ id: 'ctxsave', index: 'payload' }, { id: 'prntstash', index: 'input' }] },
  },
  ctxsave: {
    component: HTTP,
    config: httpConfig('http://127.0.0.1:8111/os-triage/incident-context/save', 'POST', 20000),
    ...at(1480, 120),
    connections: {
      response: [{ id: 'prntsave', index: 'input' }, { id: 'drop', index: 'input' }],
      error: [{ id: 'prnterr2', index: 'input' }],
    },
  },
  drop: {
    component: CODE,
    config: { title: 'Promote: remove from unattached', version: '2', outputs: 1, code: dropCode },
    ...at(1720, 120),
    connections: { output: [{ id: 'ctxremove', index: 'payload' }] },
  },
  ctxremove: {
    component: HTTP,
    config: httpConfig('http://127.0.0.1:8111/os-triage/rmb-force/remove-object', 'POST', 20000),
    ...at(1960, 120),
    connections: {
      response: [{ id: 'prntremove', index: 'input' }],
      error: [{ id: 'prnterr3', index: 'input' }],
    },
  },
  prntmap: { component: PRINT, config: {}, ...at(520, 420), connections: {} },
  prntpick: { component: PRINT, config: {}, ...at(1000, 320), connections: {} },
  prntstash: { component: PRINT, config: {}, ...at(1240, 320), connections: {} },
  prntfetch: { component: PRINT, config: {}, ...at(760, 300), connections: {} },
  prnterr1: { component: PRINT, config: {}, ...at(760, 380), connections: {} },
  prntsave: { component: PRINT, config: {}, ...at(1480, 300), connections: {} },
  prnterr2: { component: PRINT, config: {}, ...at(1480, 380), connections: {} },
  prntremove: { component: PRINT, config: {}, ...at(1960, 300), connections: {} },
  prnterr3: { component: PRINT, config: {}, ...at(1960, 380), connections: {} },
})

const out = design.httppost.connections?.output ?? []
if (!out.some((c) => c.id === 'mapreq')) out.push({ id: 'mapreq', index: 'input' })
design.httppost.connections = { ...design.httppost.connections, output: out }

const res = await fetch(`${FASTAPI}/flow/${flowId}/design/save`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(design),
})
console.log(`design/save -> ${res.status} ${await res.text()}`)
console.log(`${flowId}: ${Object.keys(design).length} nodes — Promote chain authored`)
