/**
 * decision 0031 (Decided 2026-08-12, Denis, Option 1) — stop concatenating the Create Incident form's
 * values into `description` and store the ones the STANDARD already settles.
 *
 * The `createincident` flow (`f210ot001bt51d`, node `mapform`) carries the author's own note:
 *
 *   // severity/tlp/pap have no agreed STIX mapping yet - carried in the description for now
 *
 * Decision 0031 is the answer that comment was waiting for. This change implements only the part the
 * standard determines, and leaves the rest alone rather than inventing it:
 *
 *   ✅ tags (`casetitle`)  ->  core `labels`                      — a core SDO property
 *   ✅ tlp                 ->  `object_marking_refs`               — the STIX 2.1 TLP
 *                                                                   marking-definitions, whose ids
 *                                                                   are FIXED by the standard
 *                                                                   (stix2/v21/common.py)
 *   ⬜ pap                 ->  still in the description            — conventionally a
 *                                                                   marking-definition, but NOT part
 *                                                                   of core STIX 2.1, so it needs a
 *                                                                   custom definition (0031 says so)
 *   ⬜ severity            ->  still in the description            — see the amendment below
 *   ⬜ casedate            ->  still in the description            — 0031's open question to the
 *                                                                   owner: created vs occurred
 *
 * 🔑 AMENDMENT TO DECISION 0031, worth recording: its premise was that severity has *"no home in
 * core STIX or in this dialect"*. That is not quite right. `IncidentCoreExt` (the os-threat incident
 * extension already attached to every incident) accepts BOTH:
 *     criticality  IntegerProperty(min=0)
 *     scores       ListProperty(IncidentScoreObject{name, value:int, description})
 * So no new dialect property is needed — what is needed is a MAPPING from the form's vocabulary
 * (low/medium/high/critical) to a number, and that is a judgement, not a lookup. Left for the owner
 * rather than invented here.
 *
 * ⚠️ Verified before writing that `incident` accepts `labels` and `object_marking_refs`
 * (e2e/stix-properties.json, dumped from the same stixorm the algorithms import). Adding a property
 * the class does not accept is exactly how docs/issues/0142 and docs/issues/0093 broke — silently,
 * behind an HTTP 200.
 *
 * ⚠️ 0072 DISCIPLINE — writes BOTH the runtime design and the provisioning source.
 *
 *     node e2e/map-incident-form-fields.mjs            # report only
 *     node e2e/map-incident-form-fields.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const FASTAPI = process.env.FASTAPI_BASE || 'http://localhost:8000'
const FLOW_ID = 'f210ot001bt51d'
const NODE = 'mapform'
const SOURCE_DB = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database/demo/database.json')
const APPLY = process.argv.includes('--apply')

const FROM = `var extras = [];
if (form.severity) extras.push('severity=' + form.severity);
if (form.tlp) extras.push('tlp=' + form.tlp);
if (form.pap) extras.push('pap=' + form.pap);
if (form.casedate) extras.push('date=' + form.casedate);
if (form.casetitle) extras.push('tags=' + form.casetitle);
var payload = {
  incident_form: {
    base_required: { modified: '' },
    base_optional: {},
    object: {
      name: form.incidenttitle || 'Untitled Incident',
      description: extras.length ? ('Created from CMS form (' + extras.join(', ') + ')') : 'Created from CMS form'
    },`

const TO = `// alpha-launch decision 0031 (Option 1): store what the STANDARD settles, and only that.
// Anything still without an agreed mapping stays in the description rather than being invented.
var extras = [];
if (form.severity) extras.push('severity=' + form.severity);
if (form.pap) extras.push('pap=' + form.pap);
if (form.casedate) extras.push('date=' + form.casedate);

// Tags -> core \`labels\`. A comma-separated field becomes a list; STIX labels is ListProperty.
var labels = [];
if (form.casetitle) {
  labels = String(form.casetitle).split(',').map(function(s){ return s.trim(); }).filter(Boolean);
}

// TLP -> object_marking_refs. These ids are FIXED by STIX 2.1 (stix2/v21/common.py), so they are a
// lookup, not a choice. An unrecognised value is left in the description rather than dropped.
var TLP_IDS = {
  white: 'marking-definition--613f2e26-407d-48c7-9eca-b8e91df99dc9',
  green: 'marking-definition--34098fce-860f-48ae-8e50-ebd3cc5e41da',
  amber: 'marking-definition--f88d31f6-486f-44da-b317-01333bde0b82',
  red:   'marking-definition--5e57c739-391a-4eb3-b6be-7d15ca92d5ed'
};
var markings = [];
if (form.tlp) {
  var tlpKey = String(form.tlp).toLowerCase().replace(/^tlp[:\\-\\s]*/, '');
  if (TLP_IDS[tlpKey]) {
    markings.push(TLP_IDS[tlpKey]);
    console.log('[createincident] tlp "' + form.tlp + '" -> ' + TLP_IDS[tlpKey]);
  } else {
    extras.push('tlp=' + form.tlp);
    console.log('[createincident] tlp "' + form.tlp + '" is not a standard TLP value; left in description');
  }
}

var baseOptional = {};
if (labels.length) baseOptional.labels = labels;
if (markings.length) baseOptional.object_marking_refs = markings;
console.log('[createincident] structured fields: labels=' + JSON.stringify(labels) + ' object_marking_refs=' + JSON.stringify(markings) + ' still-in-description=' + JSON.stringify(extras));

var payload = {
  incident_form: {
    base_required: { modified: '' },
    base_optional: baseOptional,
    object: {
      name: form.incidenttitle || 'Untitled Incident',
      description: extras.length ? ('Created from CMS form (' + extras.join(', ') + ')') : 'Created from CMS form'
    },`

const applyEdit = (code, label) => {
  if (code.includes('object_marking_refs')) {
    console.log(`  [${label}] already applied`)
    return code
  }
  if (!code.includes(FROM)) {
    throw new Error(`[${label}] anchor not found - the node's code has changed; re-read it before editing`)
  }
  console.log(`  [${label}] ${APPLY ? 'applied' : 'would apply'}: tags -> labels, tlp -> object_marking_refs`)
  return code.replace(FROM, TO)
}

console.log(`runtime: GET /flow/${FLOW_ID}/design`)
const design = await (await fetch(`${FASTAPI}/flow/${FLOW_ID}/design`)).json()
const node = design[NODE]
if (!node?.config?.code) {
  console.error(`FAIL - node "${NODE}" not found in the runtime design`)
  process.exit(1)
}
const newRuntime = applyEdit(node.config.code, 'runtime')

const db = JSON.parse(fs.readFileSync(SOURCE_DB, 'utf8'))
const list = Array.isArray(db) ? db : Object.values(db)
const srcFlow = list.find((f) => f && f.id === FLOW_ID)
if (!srcFlow?.design?.[NODE]) {
  console.error(`FAIL - flow ${FLOW_ID} / node ${NODE} not found in the provisioning source`)
  process.exit(1)
}
const newSource = applyEdit(srcFlow.design[NODE].config.code, 'source')

if (!APPLY) {
  console.log('\ndry run - nothing written. Re-run with --apply.')
  process.exit(0)
}

node.config.code = newRuntime
const res = await fetch(`${FASTAPI}/flow/${FLOW_ID}/design/save`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(design),
})
console.log(`\nruntime design/save -> ${res.status}`)
if (!res.ok) {
  console.error('FAIL - runtime save rejected; source left unchanged')
  process.exit(1)
}
srcFlow.design[NODE].config.code = newSource
fs.writeFileSync(SOURCE_DB, JSON.stringify(db, null, '\t'))
console.log(`source written: ${SOURCE_DB}`)
