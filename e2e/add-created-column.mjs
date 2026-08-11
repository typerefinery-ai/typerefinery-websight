/**
 * docs/issues/0116 / docs/issues/0123 — add the mockup's **Created** column to the incidents table.
 *
 * Of the docx's eight Act-1 columns (ID · Name · Author · Tags · Status · Observed · Created ·
 * Tasks) this is the ONLY one that needs no data-model decision: `original.created` is stored on
 * every incident and is simply missing from the shaped endpoint's column list. Everything else waits
 * on docs/decisions/0031.
 *
 * The flow is `f1kuzx001jo51d` (Table - All Incidents), node `shaperows`.
 *
 * ⚠️ 0072 DISCIPLINE. The runtime flow DB is git-ignored, so a change applied only there is reverted
 * by the next re-provision and is invisible to P0-S8 (docs/issues/0095). This script therefore writes
 * BOTH:
 *    runtime : POST /flow/<id>/design/save   (takes the RAW design; the handler wraps it)
 *    source  : typerefinery/services/totaljs-flow/database/demo/database.json  (the submodule)
 * Verified before running that both databases already carry this flow and that it is NOT in the
 * drift list, so the two are in sync to begin with.
 *
 *     node e2e/add-created-column.mjs            # report only
 *     node e2e/add-created-column.mjs --apply
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

/** The two edits, expressed as exact string replacements so they fail loudly if the code moved. */
const EDITS = [
  {
    what: 'map `created` onto each row',
    from: `  description: String(r.description||'').replace(/<br\\s*\\/?>/g,' ').trim(),\n  id: r.id\n}; });`,
    to:
      `  description: String(r.description||'').replace(/<br\\s*\\/?>/g,' ').trim(),\n` +
      `  // docs/issues/0116 - 'created' is stored on every incident and was simply never surfaced.\n` +
      `  // Rendered as YYYY-MM-DD: the raw value is an ISO timestamp and the column is for triage,\n` +
      `  // not forensics. Falls back to '' so a row without one does not print 'undefined'.\n` +
      `  created: String((r.original && r.original.created) || '').slice(0,10),\n` +
      `  id: r.id\n}; });`,
  },
  {
    what: 'declare the Created column',
    from: `columns: [{field:'name',title:'Name'},{field:'heading',title:'Type'},{field:'description',title:'Description'},{field:'id',title:'ID'}]`,
    to: `columns: [{field:'name',title:'Name'},{field:'heading',title:'Type'},{field:'description',title:'Description'},{field:'created',title:'Created'},{field:'id',title:'ID'}]`,
  },
]

const applyEdits = (code, label) => {
  let out = code
  for (const e of EDITS) {
    if (out.includes(e.to.split('\n')[0]) && out.includes("field:'created'")) {
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

// ---------- runtime ----------
console.log(`runtime: GET /flow/${FLOW_ID}/design`)
const design = await (await fetch(`${FASTAPI}/flow/${FLOW_ID}/design`)).json()
const node = design[NODE]
if (!node || !node.config || typeof node.config.code !== 'string') {
  console.error(`FAIL - node "${NODE}" or its config.code not found in the runtime design`)
  process.exit(1)
}
const newRuntimeCode = applyEdits(node.config.code, 'runtime')

// ---------- source ----------
if (!fs.existsSync(SOURCE_DB)) {
  console.error(`FAIL - provisioning source not found at ${SOURCE_DB}`)
  process.exit(1)
}
const raw = fs.readFileSync(SOURCE_DB, 'utf8')
const db = JSON.parse(raw)
const list = Array.isArray(db) ? db : Object.values(db)
const srcFlow = list.find((f) => f && f.id === FLOW_ID)
if (!srcFlow || !srcFlow.design || !srcFlow.design[NODE]) {
  console.error(`FAIL - flow ${FLOW_ID} / node ${NODE} not found in the provisioning source`)
  process.exit(1)
}
const newSourceCode = applyEdits(srcFlow.design[NODE].config.code, 'source')

if (!APPLY) {
  console.log('\ndry run - nothing written. Re-run with --apply.')
  process.exit(0)
}

// Write runtime first: if it fails, the source is untouched and the two stay in sync.
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
console.log('\nNow verify the live endpoint, then commit the submodule + parent pointer.')
