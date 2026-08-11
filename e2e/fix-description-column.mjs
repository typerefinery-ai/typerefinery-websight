/**
 * docs/issues/0115 — the incidents table's Description column reads
 * `Name -> potential phishing` / `<br>Created from CMS form (severity=…)`.
 *
 * ROOT CAUSE (measured 2026-08-12, and NOT what 0115 assumed).
 * The `->` strings are not debug plumbing. `common_files/convert_n_and_e.py` builds, for every
 * object type, an HTML micro-summary intended for a GRAPH TOOLTIP:
 *
 *     description = '<br>' + stix_description
 *     description += "<br>Incident Types -> " + …          (and ~60 more `<br>Label -> value` lines)
 *
 * In a tooltip that renders as labelled lines. It only looks like debug output because the TABLE
 * puts it in a text cell. And that wrapper is **frozen on disk at creation time** — every
 * `context_mem/incident--<uuid>/incident.json` stores its own `description` beside the untouched STIX
 * object under `original`. So editing convert_n_and_e.py would not change a single one of the 186
 * existing rows, and WOULD change the Act 2 / Act 3 tooltips that legitimately want the HTML.
 *
 * THE FIX, in the table's own shaper: read the real STIX description from `original.description`,
 * the same way `created` is read (docs/issues/0116). This is 0115's Preferred Option 1 — "emit the
 * bare description" — applied at the one consumer that wants plain text, instead of at the shared
 * shaper that four Acts depend on.
 *
 * Measured on the live 186 rows before writing anything:
 *     wrapper `description`   : 17 contain `->`, 184 contain `<br>`
 *     `original.description`  :  0 contain `->`,   0 contain `<br>`, 184 of 186 non-empty
 * The 2 empties are the curated seed incidents, which genuinely carry no STIX description. That is
 * honest — a blank cell for an object with no description, rather than an invented one.
 *
 * ⚠️ 0072 DISCIPLINE. The runtime flow DB is git-ignored, so a change applied only there is reverted
 * by the next re-provision and is invisible to P0-S8 (docs/issues/0095). This script writes BOTH.
 *
 *     node e2e/fix-description-column.mjs            # report only
 *     node e2e/fix-description-column.mjs --apply
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

/** Exact string replacement, so it fails loudly if the node's code moved. */
const FROM = `  description: String(r.description||'').replace(/<br\\s*\\/?>/g,' ').trim(),\n`
const TO =
  `  // docs/issues/0115 - read the object's OWN description, not the display wrapper.\n` +
  `  // r.description is an HTML micro-summary built for a graph tooltip ('<br>Label -> value'),\n` +
  `  // frozen on disk at creation time; original.description is the real STIX field. Measured:\n` +
  `  // 0 of 186 originals contain '->' or '<br>', against 17 and 184 of the wrappers.\n` +
  `  // The <br> normalisation is kept as a cheap guard in case a wrapper ever leaks back in.\n` +
  `  description: String((r.original && r.original.description) || '').replace(/<br\\s*\\/?>/g,' ').trim(),\n`

const applyEdit = (code, label) => {
  if (code.includes('r.original && r.original.description')) {
    console.log(`  [${label}] already applied`)
    return code
  }
  if (!code.includes(FROM)) {
    throw new Error(`[${label}] anchor not found - the node's code has changed; re-read it before editing`)
  }
  console.log(`  [${label}] ${APPLY ? 'applied' : 'would apply'}: description <- original.description`)
  return code.replace(FROM, TO)
}

// ---------- runtime ----------
console.log(`runtime: GET /flow/${FLOW_ID}/design`)
const design = await (await fetch(`${FASTAPI}/flow/${FLOW_ID}/design`)).json()
const node = design[NODE]
if (!node || !node.config || typeof node.config.code !== 'string') {
  console.error(`FAIL - node "${NODE}" or its config.code not found in the runtime design`)
  process.exit(1)
}
const newRuntimeCode = applyEdit(node.config.code, 'runtime')

// ---------- source ----------
const raw = fs.readFileSync(SOURCE_DB, 'utf8')
const db = JSON.parse(raw)
const list = Array.isArray(db) ? db : Object.values(db)
const srcFlow = list.find((f) => f && f.id === FLOW_ID)
if (!srcFlow || !srcFlow.design || !srcFlow.design[NODE]) {
  console.error(`FAIL - flow ${FLOW_ID} / node ${NODE} not found in the provisioning source`)
  process.exit(1)
}
const newSourceCode = applyEdit(srcFlow.design[NODE].config.code, 'source')

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
