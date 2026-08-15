/**
 * docs/issues/0165 — the make-blocks build `extensions` as a SET literal.
 *
 *     for k,v in extensions.items():
 *         contents["extensions"] = {k, v}      # set, not dict
 *
 * The moment a form submits ANY extension content the algorithm dies with
 * `TypeError: unhashable type: 'dict'` behind the transport's 200 (0026-shape) — measured
 * live on indicator-create (req-1786769999.….log) while verifying 0164. The typo exists
 * UPSTREAM too (brett_blocks origin/os_triage, 8 blocks — anecdote, email-addr,
 * email-message, url, user-account, indicator, observed-data, sro), so this is a faithful
 * port fix, not a local divergence: the loop's intent is to accumulate every extension
 * entry, so the fix is `contents.setdefault("extensions", {})[k] = v` (equal to the
 * intended dict for the single-extension forms, lossless for multi).
 *
 * Edits every flow whose inline algorithm carries the defect — runtime via
 * /flow/{id}/design/save AND the provisioning source (0072 discipline).
 *
 *     node e2e/fix-0165-extensions-set-literal.mjs            # report
 *     node e2e/fix-0165-extensions-set-literal.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const FASTAPI = process.env.FASTAPI_BASE || 'http://localhost:8000'
const SOURCE_DB = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database/demo/database.json')
const APPLY = process.argv.includes('--apply')

const BAD = 'contents["extensions"] = {k, v}'
const GOOD =
  '# alpha-launch docs/issues/0165 - was a SET literal {k, v} (TypeError: unhashable\n' +
  "        # type: 'dict' as soon as any extension is submitted); accumulate a dict instead.\n" +
  '        contents.setdefault("extensions", {})[k] = v'

const db = JSON.parse(fs.readFileSync(SOURCE_DB, 'utf8'))
const flows = Array.isArray(db) ? db : Object.values(db)

let touchedRuntime = 0
let touchedSource = 0
for (const flow of flows) {
  if (!flow?.design) continue
  const nodes = Object.entries(flow.design).filter(
    ([, n]) => typeof n?.config?.algorithm === 'string' && n.config.algorithm.includes(BAD)
  )
  if (!nodes.length) continue

  console.log(`flow ${flow.id} (${flow.name}): ${nodes.length} node(s) carry the set literal`)

  // runtime half
  const res = await fetch(`${FASTAPI}/flow/${flow.id}/design`)
  if (!res.ok) {
    console.log(`  ⚠️ runtime design fetch ${res.status} — source-only for this flow`)
  } else {
    const design = await res.json()
    let changed = false
    for (const [nodeId] of nodes) {
      const alg = design?.[nodeId]?.config?.algorithm
      if (typeof alg === 'string' && alg.includes(BAD)) {
        if (APPLY) design[nodeId].config.algorithm = alg.split(BAD).join(GOOD)
        changed = true
        console.log(`  [runtime] ${nodeId}: ${APPLY ? 'fixed' : 'would fix'}`)
      } else {
        console.log(`  [runtime] ${nodeId}: already clean (or diverged — check by hand)`)
      }
    }
    if (APPLY && changed) {
      const save = await fetch(`${FASTAPI}/flow/${flow.id}/design/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(design),
      })
      console.log(`  runtime design/save -> ${save.status}`)
      if (save.ok) touchedRuntime++
    }
  }

  // source half
  for (const [nodeId, n] of nodes) {
    if (APPLY) {
      n.config.algorithm = n.config.algorithm.split(BAD).join(GOOD)
      touchedSource++
    }
    console.log(`  [source]  ${nodeId}: ${APPLY ? 'fixed' : 'would fix'}`)
  }
}

if (APPLY) {
  fs.writeFileSync(SOURCE_DB, JSON.stringify(db, null, '\t'))
  console.log(`\nsource written (${touchedSource} node(s)); runtime flows saved: ${touchedRuntime}`)
  console.log('Verify per form with a round-trip create; indicator: e2e/probe-0164-roundtrip.mjs')
} else {
  console.log('\ndry run — nothing written. Re-run with --apply.')
}
