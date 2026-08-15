/**
 * Act 4 R4 (alpha-launch docs/issues/0008) — author the Attack-Transport flow:
 *
 *     GET /os-triage/transport/attack/{stix_id}
 *
 * The Navigator's context-menu items (R3, decision 0014 Option 5) open this URL in a new
 * tab (decision 0015: Navigator v5.3.0 opens custom items with window.open '_blank').
 * The flow runs the PINNED retrieval block (`brett_blocks@d088c63`
 * Block_Families/OS_Triage/Exchange_Objects/save_object_from_attack.py — structured
 * results per decision 0017, bundle cache per G7) and answers:
 *   - HTML confirmation for the human in the fresh tab (decision 0015), or JSON when
 *     ?format=json / Accept: application/json (R4's API shape for direct calls), and
 *   - a mapped status: not_found→404 · source_unreachable→502 · rate_limited→429 ·
 *     no_current_incident→409 · bad_request→400 (decision 0017), 500 when the algorithm
 *     itself crashed (the /algorithm envelope — the runner answers 500 since 0026).
 *
 * Structure (modeled on the routed exemplar f210uq001bt51d Incident-Context-Set-Current):
 *   route [cfbhsf66dd GET custom] → map [code: params.stix_id → block input; presentation
 *   context stashed in $.repo since the block node replaces $.data] → block
 *   [Save_Object_From_Attack, runner cloned from Create_Incident_Context] → respond
 *   [code, 2 outputs] → httpresponse html / httpresponse json  (+ printjson on payload)
 *
 * ⚠️ The block's dead-code parse.py header URL is rewritten main→os_triage so the 0096
 * gate stays green (same swap the sweep applied to every committed flow).
 * ⚠️ 0072 discipline: imports to the RUNTIME (/flow/import) AND appends to the
 * provisioning source demo/database.json. Re-runs replace both copies (idempotent).
 *
 *     node e2e/author-attack-transport-flow.mjs            # report (build + validate only)
 *     node e2e/author-attack-transport-flow.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const FASTAPI = process.env.FASTAPI_BASE || 'http://localhost:8000'
const SOURCE_DB = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database/demo/database.json')
const BRETT = path.join(WORKSPACE, 'brett_blocks')
const BLOCK_COMMIT = 'd088c63'
const BLOCK_PATH = 'Block_Families/OS_Triage/Exchange_Objects/save_object_from_attack.py'
const EXEMPLAR = 'f210uq001bt51d'
const FLOW_ID = 'f2r4at001tr51d'
const APPLY = process.argv.includes('--apply')

// ---- gather the ingredients ------------------------------------------------------------
const algorithm = execFileSync('git', ['-C', BRETT, 'show', `${BLOCK_COMMIT}:${BLOCK_PATH}`], {
  encoding: 'utf8',
}).replaceAll(
  'refs/heads/main/Block_Families/General/_library/parse.py',
  'refs/heads/os_triage/Block_Families/General/_library/parse.py'
)
if (!algorithm.includes('retrieve_attack_object_and_save_in_unattached')) {
  throw new Error('block source did not read as expected — check brett_blocks checkout')
}

const exemplarOuter = await (await fetch(`${FASTAPI}/flow/export/${EXEMPLAR}`)).json()
const exemplar = JSON.parse(exemplarOuter.value)
const comp = (id) => {
  const s = exemplar.components[id]
  if (!s) throw new Error(`exemplar is missing component ${id}`)
  return s
}

// This flow's PRIVATE copy of httpresponse reads the status from $.repo.r4_status:
// $.status set upstream does not survive message forwarding (measured — unknown id
// answered 200), while repo is a shared reference that demonstrably does. Falls back to
// $.status so the component stays drop-in compatible.
const httpResponsePatched = comp('httpresponse').replace(
  'status: $.status,',
  'status: ($.repo && $.repo.r4_status) || $.status,'
)
if (!httpResponsePatched.includes('r4_status')) throw new Error('httpresponse status patch did not apply')

const blockRunner = comp('Create_Incident_Context')
  .replaceAll("exports.id = 'Create_Incident_Context'", "exports.id = 'Save_Object_From_Attack'")
  .replaceAll("exports.name = 'Create Incident Context'", "exports.name = 'Save Object From Attack'")
  .replaceAll("exports.inputs = [{ id: 'incident', name: '{Incident}' }]", "exports.inputs = [{ id: 'stix_id', name: '{Stix ID}' }]")
if (!blockRunner.includes("id: 'stix_id'")) throw new Error('runner input rename did not apply')

const MAP_CODE = `// R4 (alpha-launch 0008): map GET /os-triage/transport/attack/{stix_id} to the block
// input. Presentation context is stashed OUT-OF-BAND in $.repo because the block node
// replaces $.data with the algorithm result before the responder runs.
var d = data || {};
var stixId = (d.params && d.params.stix_id) || '';
var accept = String((d.headers && d.headers.accept) || '');
repo.r4_wantjson = !!((d.query && d.query.format === 'json') || accept.indexOf('application/json') === 0);
repo.r4_stixid = stixId;
console.log('[attack-transport] GET stix_id=' + stixId + ' json=' + repo.r4_wantjson);
send(stixId);
`

const RESPOND_CODE = `// alpha-launch 0008 R4 + decisions 0015/0017: block result -> status + confirmation.
// data is the /algorithm response: the output-file JSON on success, or the error
// envelope {error:'true', 'log.url':...} when the script crashed (runner 500s per 0026,
// but the block component's fetch still resolves and forwards the envelope body).
var d = data || {};
var result = d.context_result;
var stixid = repo.r4_stixid || '';
var status = 200, ok = false, reason = '', detail = '';
if (d.error === 'true') { status = 500; reason = 'algorithm_crashed'; detail = 'see ' + (d['log.url'] || 'the algorithm log'); }
else if (result && result.ok === true) { ok = true; stixid = result.stix_id || stixid; }
else if (result) {
  reason = result.reason || 'unknown'; detail = result.detail || '';
  status = ({ not_found: 404, source_unreachable: 502, rate_limited: 429, no_current_incident: 409, bad_request: 400 })[reason] || 500;
} else { status = 502; reason = 'empty_response'; detail = 'no context_result in algorithm output'; }
// ⚠️ $.status does NOT survive message forwarding (measured: unknown id answered 200);
// $.repo demonstrably does (the wantjson flag rode it). This flow's own copy of the
// httpresponse component reads repo.r4_status as the status source.
// ⚠️ AND: Total.js replaces a custom body when the status is non-2xx (measured: 409
// arrived as text/plain "Bad Gateway"). So the JSON/API branch keeps the mapped status
// as the machine contract (decision 0017 — the body may be platform-generic), while the
// HTML/human branch always answers 200 with the readable page (decision 0015 — the
// popup must read well; its page TEXT carries the failure).
repo.r4_status = repo.r4_wantjson ? status : 200;
console.log('[attack-transport] ok=' + ok + ' status=' + status + (reason ? ' reason=' + reason : ''));
if (repo.r4_wantjson) {
  $.send('output2', ok ? { ok: true, stix_id: stixid, domain: result && result.domain } : { ok: false, reason: reason, detail: detail });
} else {
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var body = ok
    ? '<h1>Copied to Scratch</h1><p><code>' + esc(stixid) + '</code>' + (result && result.domain ? ' <small>(' + esc(result.domain) + ')</small>' : '') + '</p><p>The object is now in the Composer\\'s <b>Scratch</b> pane. You can close this tab.</p>'
    : '<h1>Copy failed</h1><p><b>' + esc(reason) + '</b></p><p>' + esc(detail) + '</p>';
  $.send('output', '<!doctype html><html><head><title>OS-Triage</title><style>body{font-family:system-ui,sans-serif;max-width:34rem;margin:4rem auto;padding:0 1rem;color:#222;background:#fff}code{background:#f0f0f0;padding:2px 6px;border-radius:4px}h1{font-size:1.3rem}</style></head><body>' + body + '</body></html>');
}
`

const flow = {
  paused: false,
  id: FLOW_ID,
  reference: '',
  author: 'OS-Triage.io',
  group: 'OS-Triage-Transport',
  icon: 'fa fa-crosshairs',
  color: '',
  version: '',
  readme:
    'Act 4 R4 (alpha-launch 0008): GET /os-triage/transport/attack/{stix_id} runs the pinned ' +
    'retrieval block (brett_blocks@d088c63) and saves the ATT&CK object into the current ' +
    "incident's unattached context (Composer Scratch). Answers an HTML confirmation " +
    '(decision 0015) or JSON with ?format=json; maps reason->status per decision 0017. ' +
    'Authored by e2e/author-attack-transport-flow.mjs.',
  url: 'https://',
  name: 'Attack-Transport',
  components: {
    cfbhsf66dd: comp('cfbhsf66dd'),
    typerefinery_code: comp('typerefinery_code'),
    typerefinery_printjson: comp('typerefinery_printjson'),
    httpresponse: httpResponsePatched,
    Save_Object_From_Attack: blockRunner,
  },
  design: {
    r4route: {
      id: 'r4route',
      component: 'cfbhsf66dd',
      x: 30,
      y: 60,
      config: { url: '/os-triage/transport/attack/{stix_id}', method: 'GET', timeout: 120000, limit: 5120, upload: false, response: 'custom' },
      connections: { output: [{ id: 'r4map', index: 'input' }] },
      template: { icon: 'fa fa-route', group: 'Triggers', name: 'HTTP Route', outputs: [{ id: 'output', name: 'Output' }] },
    },
    r4map: {
      id: 'r4map',
      component: 'typerefinery_code',
      x: 260,
      y: 60,
      config: { title: 'Map URL to block input', version: '2', outputs: 1, code: MAP_CODE },
      connections: { output: [{ id: 'r4block', index: 'stix_id' }] },
      template: { icon: 'fa fa-code', group: '@TypeRefinery', name: 'Code', outputs: [{ id: 'output', name: 'Output' }] },
    },
    r4block: {
      id: 'r4block',
      component: 'Save_Object_From_Attack',
      x: 490,
      y: 60,
      config: { title: 'Save Object From Attack', version: '1', algorithm, algorithmrequirements: 'argparse stixorm requests', endpoint: 'http://127.0.0.1:8000/algorithm', jyputerid: '' },
      connections: { output: [{ id: 'r4respond', index: 'input' }], payload: [{ id: 'r4log', index: 'input' }] },
      template: { icon: 'fa fa-code', group: '@OS-Triage', name: 'Save Object From Attack', outputs: [{ id: 'output', name: 'result' }, { id: 'payload', name: 'Payload' }] },
    },
    r4log: {
      id: 'r4log',
      component: 'typerefinery_printjson',
      x: 490,
      y: 210,
      config: { title: 'Print JSON', version: '2', repo: false, data: true },
      connections: {},
      template: { icon: 'fa fa-print', group: '@TypeRefinery', name: 'Print JSON', outputs: [] },
    },
    r4respond: {
      id: 'r4respond',
      component: 'typerefinery_code',
      x: 740,
      y: 60,
      config: { title: 'Status + confirmation', version: '2', outputs: 2, code: RESPOND_CODE },
      connections: { output: [{ id: 'r4html', index: 'input' }], output2: [{ id: 'r4json', index: 'input' }] },
      template: { icon: 'fa fa-code', group: '@TypeRefinery', name: 'Code', outputs: [{ id: 'output', name: 'Output #1' }, { id: 'output2', name: 'Output #2' }] },
    },
    r4html: {
      id: 'r4html',
      component: 'httpresponse',
      x: 990,
      y: 30,
      config: { type: 'html' },
      connections: {},
      template: { icon: 'fa fa-reply', group: 'Total.js', name: 'HTTP Response', outputs: [] },
    },
    r4json: {
      id: 'r4json',
      component: 'httpresponse',
      x: 990,
      y: 130,
      config: { type: 'json' },
      connections: {},
      template: { icon: 'fa fa-reply', group: 'Total.js', name: 'HTTP Response', outputs: [] },
    },
  },
  variables: {},
  variables2: {},
  sources: {},
}

console.log(`flow built: ${FLOW_ID} (${flow.name}) — algorithm ${algorithm.length} chars, 5 components, ${Object.keys(flow.design).length} nodes`)
const staleCheck = /refs\/heads\/main\//.test(JSON.stringify(flow))
console.log(`0096 gate self-check (refs/heads/main present): ${staleCheck ? '🔴 YES — fix before applying' : 'clean'}`)
if (staleCheck) process.exit(1)

if (!APPLY) {
  console.log('\ndry run — nothing imported/written. Re-run with --apply.')
  process.exit(0)
}

// runtime half — streams_import MINTS ITS OWN flow id, so re-applying would stack
// duplicate route registrations. Remove any existing runtime copy by NAME first
// (Total.js GET /fapi/streams_remove/{id}/; the Flow host is reachable directly).
const FLOW_HOST = process.env.FLOW_HOST_HTTP || 'http://localhost:8111'
const existing = await (await fetch(`${FLOW_HOST}/fapi/streams/`)).json()
for (const f of existing.filter((f) => f && f.name === flow.name)) {
  const rm = await fetch(`${FLOW_HOST}/fapi/streams_remove/${f.id}/`)
  console.log(`removed previous runtime copy ${f.id} -> ${rm.status}`)
}
const imp = await fetch(`${FASTAPI}/flow/import`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(flow),
})
console.log(`/flow/import -> ${imp.status} ${JSON.stringify(await imp.json().catch(() => null))}`)
if (!imp.ok) process.exit(1)

// source half (0072): replace-or-append in demo/database.json
const db = JSON.parse(fs.readFileSync(SOURCE_DB, 'utf8'))
if (Array.isArray(db)) {
  const i = db.findIndex((f) => f && f.id === FLOW_ID)
  if (i >= 0) db[i] = flow
  else db.push(flow)
} else {
  db[FLOW_ID] = flow
}
fs.writeFileSync(SOURCE_DB, JSON.stringify(db, null, '\t'))
console.log(`source written: ${SOURCE_DB}`)
console.log('\nVerify: curl the route with a known technique id, an unknown id (expect 404), and ?format=json.')
