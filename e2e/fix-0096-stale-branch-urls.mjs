/**
 * docs/issues/0096 Option 1 — sweep the stale `refs/heads/main` URLs out of both flow DBs.
 *
 * The inline algorithm headers fetch two files from raw GitHub pinned to `main`, which is
 * 493 insertions behind on parse.py (no `references` writer — manufactures 0083's data
 * gap on every write path) and serves an options.json that LACKS the sections every
 * reader needs (0068's landmine: overwrites a good settings file with the thin copy).
 * Targets per 0096's worklist — same path, branch swapped:
 *
 *   …/refs/heads/main/Block_Families/General/_library/parse.py            -> os_triage
 *   …/refs/heads/main/Block_Families/OS_Triage/User_Options/options.json  -> os_triage
 *
 * Touches design.<node>.config.algorithm AND config.code in:
 *   - the provisioning source (strxi2-demo-api demo/database.json) — parsed edit;
 *     round-trip proven stable by 0165/0172's commits (16-line and 1-line diffs), the
 *     0083-era "never re-stringify" hazard predates the file's pretty-printing.
 *   - every RUNTIME flow carrying a stale URL, via /flow/{id}/design/save (0072 machinery).
 *
 * The TR_Settings_Branch comment hits in fixed algorithms are prose, not URLs — the
 * replacement strings never match them (0096 verified this class needs no allow-list).
 *
 *     node e2e/fix-0096-stale-branch-urls.mjs            # report
 *     node e2e/fix-0096-stale-branch-urls.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const FASTAPI = process.env.FASTAPI_BASE || 'http://localhost:8000'
const SOURCE_DB = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database/demo/database.json')
const APPLY = process.argv.includes('--apply')

const SWAPS = [
  ['refs/heads/main/Block_Families/General/_library/parse.py',
   'refs/heads/os_triage/Block_Families/General/_library/parse.py'],
  ['refs/heads/main/Block_Families/OS_Triage/User_Options/options.json',
   'refs/heads/os_triage/Block_Families/OS_Triage/User_Options/options.json'],
]
const isStale = (s) => typeof s === 'string' && SWAPS.some(([from]) => s.includes(from))
const swap = (s) => SWAPS.reduce((acc, [from, to]) => acc.split(from).join(to), s)
const countStale = (text) => SWAPS.reduce((n, [from]) => n + text.split(from).length - 1, 0)

const raw = fs.readFileSync(SOURCE_DB, 'utf8')
console.log(`source stale occurrences before: ${countStale(raw)}`)
const db = JSON.parse(raw)
const flows = Array.isArray(db) ? db : Object.values(db)

let sourceNodes = 0
const runtimeFlowIds = new Set()
for (const flow of flows) {
  if (!flow?.design) continue
  for (const [nodeId, n] of Object.entries(flow.design)) {
    for (const key of ['algorithm', 'code']) {
      const s = n?.config?.[key]
      if (isStale(s)) {
        console.log(`  [source]  ${flow.id} (${flow.name}) ${nodeId}.${key}`)
        if (APPLY) n.config[key] = swap(s)
        sourceNodes++
        runtimeFlowIds.add(flow.id)
      }
    }
  }
}

// runtime half — check every flow that is stale in source, plus report any runtime-only
// staleness the fetch reveals (0096 measured none, but verify rather than assume).
let runtimeFixed = 0
for (const id of runtimeFlowIds) {
  const res = await fetch(`${FASTAPI}/flow/${id}/design`)
  if (!res.ok) { console.log(`  [runtime] ${id}: design fetch ${res.status} (not provisioned) — source-only`); continue }
  const design = await res.json()
  let changed = false
  for (const [nodeId, n] of Object.entries(design)) {
    for (const key of ['algorithm', 'code']) {
      const s = n?.config?.[key]
      if (isStale(s)) {
        console.log(`  [runtime] ${id} ${nodeId}.${key}`)
        if (APPLY) { n.config[key] = swap(s); changed = true }
        else changed = true
      }
    }
  }
  if (changed && APPLY) {
    const save = await fetch(`${FASTAPI}/flow/${id}/design/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(design),
    })
    console.log(`  [runtime] ${id} design/save -> ${save.status}`)
    if (save.ok) runtimeFixed++
  }
}

if (!APPLY) {
  console.log(`\ndry run — ${sourceNodes} source node-field(s); nothing written. Re-run with --apply.`)
  process.exit(0)
}

fs.writeFileSync(SOURCE_DB, JSON.stringify(db, null, '\t'))
const after = fs.readFileSync(SOURCE_DB, 'utf8')
console.log(`\nsource written: stale occurrences now ${countStale(after)} (flow count ${flows.length} unchanged: ${(Array.isArray(JSON.parse(after)) ? JSON.parse(after) : Object.values(JSON.parse(after))).length === flows.length})`)
console.log(`runtime flows saved: ${runtimeFixed}`)
console.log('Next: the guard in audit-flow-provisioning-drift.mjs (0096 Option 2) + negative test.')
