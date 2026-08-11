/**
 * docs/issues/0149 — the live TMS push sends a DIFFERENT table shape from the HTTP route.
 *
 * The incidents table has two data paths and they had drifted apart:
 *
 *   HTTP (page load)  flow f1kuzx001jo51d, node `shaperows`  -> ID|Name|Status|Observed|Created|Tasks
 *   TMS  (live push)  flow f210iy001bt51d, node `maprows`    -> Name|Type|Description|ID
 *
 * `maprows` is an independent duplicate of the same logic against the same endpoint. It never
 * received any of the columns added to `shaperows` over several changes, nor docs/issues/0115's fix,
 * so it still read `description` from the frozen DISPLAY WRAPPER. Net effect: the table renders
 * correctly on load and **silently reverts to four columns, with `Name -> …` descriptions, the
 * moment anything pushes** — which is exactly what P1-S2 exercises.
 *
 * ⚠️ Flow `f210iy001bt51d` is **runtime-only** — it is in the drift audit's "exist only in the
 * runtime DB (lost on re-provision)" list, so this fix CANNOT be committed to the provisioning
 * source and will be lost by a re-provision (docs/issues/0072 / docs/issues/0095). That exposure is
 * recorded in docs/issues/0149; this script is re-runnable so the fix can be re-applied.
 *
 *     node e2e/sync-push-table-columns.mjs            # report only
 *     node e2e/sync-push-table-columns.mjs --apply
 */
const FASTAPI = process.env.FASTAPI_BASE || 'http://localhost:8000'
const FLOW_ID = 'f210iy001bt51d'
const NODE = 'maprows'
const APPLY = process.argv.includes('--apply')

const FROM_MAP = `var mapped = rows.map(function(r){ return {
  name: (r.original && r.original.name) || r.name,
  heading: r.heading,
  description: String(r.description||'').replace(/<br\\s*\\/?>/g,' ').trim(),
  id: r.id
}; });`

const TO_MAP = `// alpha-launch docs/issues/0149: this node is an independent DUPLICATE of the shaped route's
// shaperows (flow f1kuzx001jo51d) - same source endpoint, its own mapping - and it never received
// the columns added there (Created/Status/Observed/Tasks) nor docs/issues/0115's fix, so every TMS
// push silently reverted the table to four columns and re-introduced display-wrapper text.
// Kept in step here; the duplication itself is the issue.
var mapped = rows.map(function(r){
  var o = r.original || {};
  var ext = o.extensions || {};
  var inc = {};
  for (var k in ext) {
    if (ext[k] && (ext[k].investigation_status || ext[k].task_refs || ext[k].other_object_refs)) { inc = ext[k]; break; }
  }
  var other = inc.other_object_refs || [];
  return {
    id: r.id,
    name: o.name || r.name,
    status: String(inc.investigation_status || ''),
    observed: other.filter(function(x){ return String(x).indexOf('observed-data--') === 0; }).length,
    created: String(o.created || '').slice(0,10),
    tasks: (inc.task_refs || []).length
  };
});`

const FROM_COLS = `columns: [{field:'name',title:'Name'},{field:'heading',title:'Type'},{field:'description',title:'Description'},{field:'id',title:'ID'}],`
const TO_COLS = `columns: [{field:'id',title:'ID'},{field:'name',title:'Name'},{field:'status',title:'Status'},{field:'observed',title:'Observed'},{field:'created',title:'Created'},{field:'tasks',title:'Tasks'}],`

const design = await (await fetch(`${FASTAPI}/flow/${FLOW_ID}/design`)).json()
const node = design[NODE]
if (!node?.config?.code) {
  console.error(`FAIL - node ${NODE} not found in flow ${FLOW_ID}`)
  process.exit(1)
}
const code = node.config.code

if (code.includes("field:'status'")) {
  console.log('already applied')
  process.exit(0)
}
for (const [name, anchor] of [['row mapping', FROM_MAP], ['column list', FROM_COLS]]) {
  if (!code.includes(anchor)) {
    console.error(`FAIL - ${name} anchor not found; the node has changed. Re-read it before editing.`)
    process.exit(1)
  }
}
console.log(`${APPLY ? 'applying' : 'would apply'}: row mapping + column list, to match shaperows`)

if (!APPLY) {
  console.log('\ndry run - nothing written. Re-run with --apply.')
  process.exit(0)
}

node.config.code = code.replace(FROM_MAP, TO_MAP).replace(FROM_COLS, TO_COLS)
const res = await fetch(`${FASTAPI}/flow/${FLOW_ID}/design/save`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(design),
})
console.log(`design/save -> ${res.status}`)
if (!res.ok) process.exit(1)
console.log('⚠️ runtime-only flow: NOT committed to the provisioning source, and lost on re-provision.')
