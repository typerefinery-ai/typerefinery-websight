/**
 * docs/issues/0123 scope item 1 — make Act 1's table columns match the docx mockup.
 *
 * VERIFIED AGAINST THE SOURCE OF TRUTH, not against the issue's summary of it. Reading
 * `docs/mini-app-source/image2.png` directly, the header row is exactly:
 *
 *     ID | Name | Author | Tags | Status | Observed | Created | Tasks
 *
 * `Type` and `Description` are **not in the design at all** — they are build-only additions. And
 * since docs/issues/0138's dataset reset, `Description` is **empty on both curated incidents** (they
 * genuinely carry no STIX description), so it is an empty column on the first screen an investor
 * sees. `Type` reads `Extended-Incident` on every row, which distinguishes nothing.
 *
 * This drops both and reorders the rest into the mockup's sequence:
 *
 *     before   Name | Type | Description | Status | Observed | Tasks | Created | ID | Action
 *     after    ID | Name | Status | Observed | Created | Tasks | Action
 *
 * ⬜ `Author` and `Tags` are still absent: `created_by_ref` is unwritten
 * (docs/issues/0145) and `labels` only lands on incidents created since decision 0031's write path.
 * They are left out rather than shown blank — the same call made when they were added.
 * ⚠️ `Action` is NOT in the mockup either, but it carries the working Open button that P1-S7 drives
 * and decision 0024 covers where those actions land. Removing it would break real navigation to
 * match a picture, so it stays and the divergence is recorded instead.
 * ⚠️ `ID` still renders the raw 45-char UUID where the mockup shows a short `stix_id_1`. That is a
 * separate recorded divergence (docs/issues/0123) and is not decided here.
 *
 * ⚠️ 0072 DISCIPLINE — writes BOTH the runtime design and the provisioning source.
 *
 *     node e2e/align-table-columns-to-mockup.mjs            # report only
 *     node e2e/align-table-columns-to-mockup.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const FASTAPI = process.env.FASTAPI_BASE || 'http://localhost:8000'
const FLOW_ID = 'f1kuzx001jo51d'
const NODE = 'shaperows'
const SOURCE_DB = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database/demo/database.json')
const APPLY = process.argv.includes('--apply')

const FROM = `columns: [{field:'name',title:'Name'},{field:'heading',title:'Type'},{field:'description',title:'Description'},{field:'status',title:'Status'},{field:'observed',title:'Observed'},{field:'tasks',title:'Tasks'},{field:'created',title:'Created'},{field:'id',title:'ID'}]`

// The docx order, minus the two columns whose data does not exist yet.
const TO = `columns: [{field:'id',title:'ID'},{field:'name',title:'Name'},{field:'status',title:'Status'},{field:'observed',title:'Observed'},{field:'created',title:'Created'},{field:'tasks',title:'Tasks'}]`

const applyEdit = (code, label) => {
  if (code.includes(TO)) {
    console.log(`  [${label}] already applied`)
    return code
  }
  if (!code.includes(FROM)) {
    throw new Error(`[${label}] anchor not found - the column list has changed; re-read it before editing`)
  }
  console.log(`  [${label}] ${APPLY ? 'applied' : 'would apply'}: drop Type + Description, reorder to the mockup`)
  return code.replace(FROM, TO)
}

console.log(`runtime: GET /flow/${FLOW_ID}/design`)
const design = await (await fetch(`${FASTAPI}/flow/${FLOW_ID}/design`)).json()
const node = design[NODE]
if (!node?.config?.code) {
  console.error(`FAIL - node ${NODE} not found in the runtime design`)
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
