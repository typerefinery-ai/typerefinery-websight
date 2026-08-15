/**
 * docs/issues/0172 — compact Act 1's ID column (Option 1: truncate the DISPLAY, keep the
 * full value in the DOM).
 *
 * The design (image2.png) shows a compact id; the build rendered the full 45-char STIX
 * identifier as the widest column on the first screen an investor reads. The fix is pure
 * COLUMN CONFIG in the shaper's payload — bootstrap-table applies `width` + Bootstrap's
 * `text-truncate` class to the cells, so the cell CLIPS (ellipsis) while `textContent`
 * keeps the full identifier.
 *
 * ⚠️ Why not an HTML formatter in the shaper: the Open action POSTs the WHOLE ROW to
 * `/os-triage/incident-context/set-current` (table clientlib functions.js:103) and the
 * Flow reads `row.id` — HTML in the id field would break P1-S7's context switch. The id
 * field must stay clean; only presentation changes.
 * ⚠️ `e2e/set-current-incident-by-ui.mjs` locates rows by hasText(uuid-stem): unaffected,
 * Playwright matches textContent, which still carries the full id.
 *
 * Measured after (probe-0172-id-column.mjs): ID 110px = 9% of the table (was ~25%),
 * clipped=true, full id in textContent.
 *
 * ⚠️ 0072 DISCIPLINE — writes BOTH the runtime design and the provisioning source.
 *
 *     node e2e/fix-0172-truncate-id-column.mjs            # report only
 *     node e2e/fix-0172-truncate-id-column.mjs --apply
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

const PLAIN = `{field:'id',title:'ID'},`
// ⚠️ The cellStyle max-width is LOAD-BEARING, not decoration: a first "minimal" cut kept
// only width+class and the td did NOT clip (auto table layout expands it; ID share went
// back to 30%). bootstrap-table applies the cellStyle object's css map to the td, and
// max-width is what makes text-truncate actually truncate in a table cell.
const MINIMAL_REGRESSION = `{field:'id',title:'ID',width:110,widthUnit:'px',class:'text-truncate'},`
const FINAL = `{field:'id',title:'ID',width:110,widthUnit:'px',class:'text-truncate',cellStyle:{css:{'max-width':'110px','overflow':'hidden','text-overflow':'ellipsis','white-space':'nowrap'}}},`

const applyEdit = (code, label) => {
  if (code.includes(FINAL)) {
    console.log(`  [${label}] already applied`)
    return code
  }
  const anchor = code.includes(MINIMAL_REGRESSION) ? MINIMAL_REGRESSION : code.includes(PLAIN) ? PLAIN : null
  if (!anchor) {
    throw new Error(`[${label}] anchor not found - the ID column def has changed; re-read it before editing`)
  }
  console.log(`  [${label}] ${APPLY ? 'applied' : 'would apply'}: compact ID column (110px, text-truncate)`)
  return code.replace(anchor, FINAL)
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
console.log('\nVerify: node e2e/probe-0172-id-column.mjs and node e2e/walk-acts-gestures.mjs <outdir>')
