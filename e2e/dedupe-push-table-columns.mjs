/**
 * docs/issues/0149 Option 1 — define the incidents table's columns ONCE.
 *
 * The table has two data paths against the same data, each with its own mapping:
 *
 *   HTTP (page load)  f1kuzx001jo51d / shaperows  -> serves /viz-data/table-all-incidents-shaped
 *   TMS  (live push)  f210iy001bt51d / fetchinc+maprows -> re-derived it all from the RAW route
 *
 * Keeping them in step by hand is what failed: `maprows` missed four column additions and
 * docs/issues/0115's fix, so the table silently reverted to four columns on every push.
 *
 * This removes the second implementation rather than re-syncing it:
 *
 *   fetchinc   /viz-data/table-all-incidents  ->  /viz-data/table-all-incidents-shaped
 *   maprows    re-maps rows + declares columns  ->  publishes the shaped payload as-is
 *
 * The shaped route already returns `{columns, data}`, which is the table widget's payload shape, so
 * `maprows` only has to add the widget flags. After this there is exactly one place columns are
 * defined, and it is the one that lives in the provisioning source.
 *
 * ⚠️ Kept: the non-2xx guard (docs/issues/0014 — the request component delivers HTTP errors on
 * 'response' too, so a broken payload must not be published) and the row-count log.
 *
 * ⚠️ f210iy001bt51d is RUNTIME-ONLY (drift audit: "lost on re-provision"), so this cannot be
 * committed to the provisioning source and is re-runnable by design. That exposure is separate and
 * recorded in docs/issues/0149.
 *
 *     node e2e/dedupe-push-table-columns.mjs            # report only
 *     node e2e/dedupe-push-table-columns.mjs --apply
 */
const FASTAPI = process.env.FASTAPI_BASE || 'http://localhost:8000'
const FLOW_ID = 'f210iy001bt51d'
const APPLY = process.argv.includes('--apply')

const RAW_URL = 'http://127.0.0.1:8111/viz-data/table-all-incidents'
const SHAPED_URL = 'http://127.0.0.1:8111/viz-data/table-all-incidents-shaped'

const NEW_MAPROWS = `// docs/issues/0149 - the columns are defined ONCE, by the shaped route (flow f1kuzx001jo51d,
// node shaperows). This node used to re-derive rows AND declare its own column list from the RAW
// endpoint, and it silently fell four columns behind, so every TMS push reverted the table. It now
// publishes what the shaped route already returns.
var body = (data && data.body) || data;
// Guard non-2xx: the request component delivers HTTP errors on 'response' too
// (alpha-launch docs/issues/0014) - do not publish a broken payload.
if (!body || !Array.isArray(body.data) || !Array.isArray(body.columns)) {
  console.log('[incidents-table] shaped route returned no usable payload, skipping publish: ' + JSON.stringify(body).slice(0,160));
  $.destroy();
  return;
}
console.log('[incidents-table] publishing ' + body.data.length + ' incident rows, columns: ' + body.columns.map(function(c){ return c.title; }).join(', '));
$.send('output', {
  columns: body.columns,
  data: body.data,
  search: true,
  pagination: false,
  resizable: true
});`

const design = await (await fetch(`${FASTAPI}/flow/${FLOW_ID}/design`)).json()
const fetchinc = design.fetchinc
const maprows = design.maprows
if (!fetchinc?.config || !maprows?.config?.code) {
  console.error('FAIL - fetchinc or maprows not found in the flow')
  process.exit(1)
}

const alreadyShaped = String(fetchinc.config.url || '').includes('-shaped')
// ⚠️ Detect the pass-through by its BEHAVIOUR, not by an issue reference in a comment: the
// previous fix (docs/issues/0149's runtime sync) also mentions 0149, so a text match on the issue
// number reported 'already applied' and skipped the replacement - while fetchinc HAD been
// repointed, leaving maprows expecting an array it would never receive.
const alreadyPassthrough = maprows.config.code.includes('body.columns')
console.log(`fetchinc.url : ${fetchinc.config.url}`)
console.log(`  -> ${alreadyShaped ? 'already the shaped route' : SHAPED_URL}`)
console.log(`maprows      : ${alreadyPassthrough ? 'already a pass-through' : 're-derives rows and columns -> pass-through'}`)

if (alreadyShaped && alreadyPassthrough) {
  console.log('\nalready applied')
  process.exit(0)
}
if (!alreadyShaped && String(fetchinc.config.url || '') !== RAW_URL) {
  console.error(`FAIL - fetchinc.url is neither the raw nor the shaped route; refusing to guess. Found: ${fetchinc.config.url}`)
  process.exit(1)
}
if (!APPLY) {
  console.log('\ndry run - nothing written. Re-run with --apply.')
  process.exit(0)
}

fetchinc.config.url = SHAPED_URL
maprows.config.code = NEW_MAPROWS
const res = await fetch(`${FASTAPI}/flow/${FLOW_ID}/design/save`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(design),
})
console.log(`\ndesign/save -> ${res.status}`)
if (!res.ok) process.exit(1)
console.log('⚠️ runtime-only flow: not committed to the provisioning source, lost on re-provision (docs/issues/0149).')
