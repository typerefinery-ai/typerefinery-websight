/**
 * decision 0009 — separate the two candidate causes of the Create Connection no-op.
 *
 * The chain writes nothing, and two explanations were left unseparated:
 *   1. the HTTP response node REPLACES the message, losing the connection parameters, or
 *   2. the GET node rejects an inbound payload, so `merge` is never reached at all.
 *
 * They need different fixes, so guessing is not good enough.
 *
 * This adds a `diag` code node on `fetchgraph.response` that reports what the message actually
 * contains at that point. The earlier SRO experiment showed the route's HTTP response surfaces
 * messages from inside the flow, so the report should come back in the curl body — that is the
 * observation channel, since code-node console output is not reachable from here.
 *
 * It writes nothing and touches no save path.
 */
import fs from 'fs'

const FLOW = process.argv[2] || 'f21cbw001rn51d'
const FASTAPI = 'http://localhost:8000'
const design = await (await fetch(`${FASTAPI}/flow/${FLOW}/design`)).json()
if (!design.fetchgraph) throw new Error('fetchgraph node not found — run author-connection-save-leg first')

const diagCode = `// Report the shape of the message arriving after the HTTP fetch. Writes nothing.
function describe(v, depth) {
  if (v === null || v === undefined) return String(v);
  if (Array.isArray(v)) return 'array[' + v.length + ']';
  if (typeof v === 'object') {
    if (depth > 1) return 'object{...}';
    var out = {};
    Object.keys(v).slice(0, 12).forEach(function(k) { out[k] = describe(v[k], depth + 1); });
    return out;
  }
  return typeof v === 'string' ? ('string(' + v.length + ')') : typeof v;
}
var repoInfo = 'absent';
try { repoInfo = (typeof $.repository === 'undefined') ? 'undefined' : JSON.stringify($.repository).slice(0,300); } catch (e) { repoInfo = 'threw: ' + e.message; }
var dollarKeys = [];
try { for (var kk in $) dollarKeys.push(kk); } catch (e) {}
var report = {
  repository: repoInfo,
  dollarKeys: dollarKeys.slice(0, 30),
  DIAG: 'post-fetch message shape',
  topLevelKeys: Object.keys(data || {}),
  shape: describe(data, 0),
  foundConnectionAnywhere: JSON.stringify(data || {}).indexOf('connection_field_list') >= 0
    || JSON.stringify(data || {}).indexOf('source_ref') >= 0
};
console.log('[diag] ' + JSON.stringify(report));
$.send('output', report);
`

design.diag = {
  component: 'typerefinery_code',
  config: { title: 'DIAG post-fetch message shape', version: '2', outputs: 1, code: diagCode },
  x: 1000,
  y: 460,
  connections: { output: [{ id: 'prntdiag', index: 'input' }] },
}
design.prntdiag = { component: 'typerefinery_printjson', config: {}, x: 1240, y: 460, connections: {} }

const resp = design.fetchgraph.connections?.response ?? []
if (!resp.some((c) => c.id === 'diag')) resp.push({ id: 'diag', index: 'input' })
design.fetchgraph.connections = { ...design.fetchgraph.connections, response: resp }

const res = await fetch(`${FASTAPI}/flow/${FLOW}/design/save`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(design),
})
console.log(`design/save -> ${res.status} ${await res.text()}`)
console.log('diag wired onto fetchgraph.response')
