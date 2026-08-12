/**
 * docs/issues/0151 — the fix already exists; the RUNTIME never got it.
 *
 * Both Overview flows have two copies of `generate_nodes_and_edges`:
 *
 *   source (provisioning)   node.get("references", {})       guarded    27382 / 29827 chars
 *   runtime (git-ignored)   node["references"]               UNGUARDED   9409 / 10316 chars
 *
 * So the running system is executing an older implementation that still carries the KeyError which
 * docs/issues/0053 fixed elsewhere — and one object without the key empties the entire Act 2 graph.
 *
 * 🔑 THIS CORRECTS A STATED ASSUMPTION IN P0-S8. That guard deliberately fails only on
 * "runtime ahead", with the comment: *"Source-ahead drift also exists (six flows), but that direction
 * loses nothing on a re-provision — it means the runtime is behind, which is a different problem and
 * not one preflight should block a demo for."* It is not "not a problem": here, source-ahead means
 * **the runtime is missing a High-severity fix**, and Act 2 is the Act it breaks.
 *
 * The right repair is therefore NOT to hand-patch one line into the outdated runtime copy — it is to
 * bring the runtime up to the source, which is exactly what a re-provision would install.
 *
 *     node e2e/sync-overview-runtime-from-source.mjs            # report only
 *     node e2e/sync-overview-runtime-from-source.mjs --apply
 *
 * ⚠️ Verify Act 0 + Act 2 immediately afterwards: the source version is 3x longer and has not run in
 * this runtime before. If it is worse, the previous runtime algorithm is printed to the scratch file
 * named below so it can be put back.
 */
import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const FASTAPI = process.env.FASTAPI_BASE || 'http://localhost:8000'
const SOURCE_DB = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database/demo/database.json')
const APPLY = process.argv.includes('--apply')

const TARGETS = [
  { flow: 'f1kzb9001xs51d', node: 'im7cs30iz', what: 'Overview - Get Default Incident & Objects' },
  { flow: 'f1kutl001ts51d', node: 'im7cpfumk', what: 'Overview - Get Incident & Objects' },
]

const db = JSON.parse(fs.readFileSync(SOURCE_DB, 'utf8'))
const backupDir = path.join(os.tmpdir(), 'claude', 'alpha-launch-overview-runtime-backup')

for (const t of TARGETS) {
  console.log(`\n${t.what}  (${t.flow} / ${t.node})`)
  const design = await (await fetch(`${FASTAPI}/flow/${t.flow}/design`)).json()
  const rNode = design[t.node]
  const sAlg = db[t.flow]?.design?.[t.node]?.config?.algorithm
  if (!rNode?.config?.algorithm || !sAlg) {
    console.log('  node or algorithm missing on one side — skipped')
    continue
  }
  const rAlg = rNode.config.algorithm
  const rGuarded = rAlg.includes('node.get("references"')
  const sGuarded = sAlg.includes('node.get("references"')
  console.log(`  runtime : ${rAlg.length} chars, guarded=${rGuarded}`)
  console.log(`  source  : ${sAlg.length} chars, guarded=${sGuarded}`)

  if (rAlg === sAlg) {
    console.log('  = identical, nothing to do')
    continue
  }
  if (!sGuarded) {
    console.log('  ! source is NOT guarded either — refusing to sync, this needs a look first')
    continue
  }
  if (!APPLY) {
    console.log('  ~ would replace the runtime algorithm with the source one')
    continue
  }

  fs.mkdirSync(backupDir, { recursive: true })
  const backup = path.join(backupDir, `${t.flow}-${t.node}.py`)
  fs.writeFileSync(backup, rAlg)
  console.log(`  previous runtime algorithm saved to ${backup}`)

  rNode.config.algorithm = sAlg
  const res = await fetch(`${FASTAPI}/flow/${t.flow}/design/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(design),
  })
  console.log(`  design/save -> ${res.status}`)
  if (!res.ok) process.exit(1)
}

if (!APPLY) console.log('\ndry run - nothing written. Re-run with --apply.')
else console.log('\nNow verify: Act 0 (P0-S4) and Act 2 must pass, and the drift audit should show these two in sync.')
