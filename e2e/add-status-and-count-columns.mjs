/**
 * docs/issues/0116 / docs/issues/0123 — add the mockup's **Status**, **Observed** and **Tasks**
 * columns to the incidents table.
 *
 * MEASURED FIRST, 2026-08-12, across all 192 rows:
 *
 *   investigation_status present   2 / 192   (values: {"new": 2})
 *   created_by_ref present         0 / 192
 *   labels present                 0 / 192
 *   any *_refs present             2 / 192
 *
 * 🔑 So of the docx's five remaining columns, **three are derivable from data stored today** and two
 * are not:
 *
 *   ✅ Status    extensions[<os-threat>].investigation_status
 *   ✅ Observed  count of `observed-data--` ids in other_object_refs
 *   ✅ Tasks     count of task_refs
 *   ❌ Author    created_by_ref is empty on EVERY row
 *   ❌ Tags      labels is empty on EVERY row  — both need decision 0031's write-path change
 *
 * ⚠️ AND THE HONEST CAVEAT, which is the more important finding: only the **2 curated incidents**
 * carry any of this. The other 190 are CMS-form creations whose os-threat extension is an empty
 * shell, so these columns read blank/0 for them. That is *true* — those incidents genuinely have no
 * tasks — but it means the columns only tell the mockup's story once the dataset is curated
 * (docs/issues/0138). Act 1's wireframe is gated on the DATASET, not only on decision 0031.
 *
 * Counts render as a number so an empty incident reads `0` rather than blank; Status renders as the
 * stored string and stays blank when nothing is recorded, because inventing "unknown" would be
 * asserting a status that is not there.
 *
 * ⚠️ 0072 DISCIPLINE — writes BOTH the runtime design and the provisioning source, or the next
 * re-provision reverts it and P0-S8 cannot see it (docs/issues/0095).
 *
 *     node e2e/add-status-and-count-columns.mjs            # report only
 *     node e2e/add-status-and-count-columns.mjs --apply
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

const EDITS = [
  {
    what: 'derive status / observed / tasks from the stored extension',
    from: `  created: String((r.original && r.original.created) || '').slice(0,10),\n`,
    to:
      `  created: String((r.original && r.original.created) || '').slice(0,10),\n` +
      `  // docs/issues/0116 - three of the mockup's remaining columns come from data already stored.\n` +
      `  // The os-threat incident extension is keyed by its definition id; read it without hardcoding\n` +
      `  // the key so a dialect version bump does not silently blank the columns.\n` +
      `  status: (function(){ var e=((r.original||{}).extensions)||{}; for(var k in e){ if(e[k] && e[k].investigation_status) return String(e[k].investigation_status); } return ''; })(),\n` +
      `  // Counts, not blanks: an incident with no tasks genuinely has 0. Blank would read as\n` +
      `  // "not known" and that would be a claim the data does not support.\n` +
      `  observed: (function(){ var e=((r.original||{}).extensions)||{}; for(var k in e){ if(e[k] && e[k].other_object_refs) return e[k].other_object_refs.filter(function(x){return String(x).indexOf('observed-data--')===0}).length; } return 0; })(),\n` +
      `  tasks: (function(){ var e=((r.original||{}).extensions)||{}; for(var k in e){ if(e[k] && e[k].task_refs) return e[k].task_refs.length; } return 0; })(),\n`,
  },
  {
    what: 'declare the three columns',
    from: `columns: [{field:'name',title:'Name'},{field:'heading',title:'Type'},{field:'description',title:'Description'},{field:'created',title:'Created'},{field:'id',title:'ID'}]`,
    to: `columns: [{field:'name',title:'Name'},{field:'heading',title:'Type'},{field:'description',title:'Description'},{field:'status',title:'Status'},{field:'observed',title:'Observed'},{field:'tasks',title:'Tasks'},{field:'created',title:'Created'},{field:'id',title:'ID'}]`,
  },
]

const applyEdits = (code, label) => {
  let out = code
  for (const e of EDITS) {
    if (out.includes("field:'status'") && out.includes('investigation_status')) {
      console.log(`  [${label}] already applied: ${e.what}`)
      continue
    }
    if (!out.includes(e.from)) {
      throw new Error(`[${label}] anchor not found for "${e.what}" - the node's code has changed; re-read it before editing`)
    }
    out = out.replace(e.from, e.to)
    console.log(`  [${label}] ${APPLY ? 'applied' : 'would apply'}: ${e.what}`)
  }
  return out
}

console.log(`runtime: GET /flow/${FLOW_ID}/design`)
const design = await (await fetch(`${FASTAPI}/flow/${FLOW_ID}/design`)).json()
const node = design[NODE]
if (!node?.config?.code) {
  console.error(`FAIL - node "${NODE}" or its config.code not found`)
  process.exit(1)
}
const newRuntimeCode = applyEdits(node.config.code, 'runtime')

const raw = fs.readFileSync(SOURCE_DB, 'utf8')
const db = JSON.parse(raw)
const list = Array.isArray(db) ? db : Object.values(db)
const srcFlow = list.find((f) => f && f.id === FLOW_ID)
if (!srcFlow?.design?.[NODE]) {
  console.error(`FAIL - flow ${FLOW_ID} / node ${NODE} not found in the provisioning source`)
  process.exit(1)
}
const newSourceCode = applyEdits(srcFlow.design[NODE].config.code, 'source')

if (!APPLY) {
  console.log('\ndry run - nothing written. Re-run with --apply.')
  process.exit(0)
}

// Runtime first: if it is rejected, the source is untouched and the two stay in sync.
node.config.code = newRuntimeCode
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
srcFlow.design[NODE].config.code = newSourceCode
fs.writeFileSync(SOURCE_DB, JSON.stringify(db, null, '\t'))
console.log(`source written: ${SOURCE_DB}`)
