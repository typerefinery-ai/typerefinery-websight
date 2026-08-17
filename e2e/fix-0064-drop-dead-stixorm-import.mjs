/**
 * docs/issues/0064 Option 2a — drop a dead `stixorm` import from a flow's inline algorithm.
 *
 * ~700 ms of every ~830 ms `/viz-data/*` call is `stixorm.module.*` import paid fresh in a new
 * interpreter per request. Where the import is unused, removing it is most of the win at no risk to
 * the execution model. Proven on three routes already (byte-identical output, ~40 % faster).
 *
 * This one targets `/viz-data/unattached-split` — Act 3's panes, currently ~0.68 s against 0.14 s for
 * the route that has already had this treatment.
 *
 * In `Get_Unattached_NandE`:
 *     line 38  from stixorm.module.authorise import import_type_factory
 *     line 47  import_type = import_type_factory.get_all_imports()
 * `import_type` is **assigned once and never read**, and the module contains no `globals()`,
 * `locals()`, `eval()`, `exec()`, `__import__` or `getattr()` — so nothing can reach it dynamically.
 *
 * ⚠️ BOTH DATABASES, in one pass. The runtime DB is git-ignored (docs/issues/0072), so a design/save
 * alone would be erased by the next re-provision AND would create runtime-ahead drift that P0-S8
 * fails the run for. Editing only the source would leave source-ahead drift instead. Neither
 * direction alone is safe, so this writes both or neither.
 *
 *     node e2e/fix-0064-drop-dead-stixorm-import.mjs --route=<name>            # report
 *     node e2e/fix-0064-drop-dead-stixorm-import.mjs --route=<name> --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const FASTAPI = process.env.FASTAPI_BASE || 'http://localhost:8000'
const APPLY = process.argv.includes('--apply')

const SRC = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database/demo/database.json')

/**
 * One entry per route. Each names the SERVING algorithm node — the one reachable from the route node
 * through the design's connections — not merely an algorithm in the same flow.
 *
 * ⚠️ That distinction is load-bearing. `overview-default-incident`'s flow holds **15** algorithms and
 * exactly **1** runs for the route; editing any of the other 14 would cost effort and change nothing.
 */
const TARGETS = {
  'unattached-split': {
    flow: 'f1uemw001rc51d',
    node: 'im03tgckd',
    dead: [
      'from stixorm.module.authorise import import_type_factory',
      'import_type = import_type_factory.get_all_imports()',
    ],
    // The symbol whose deadness justifies the removal; re-checked before every write.
    guard: 'import_type',
  },
  'overview-default-incident': {
    flow: 'f1kzb9001xs51d',
    node: 'im7cs30iz',
    dead: [
      'from stixorm.module.authorise import import_type_factory',
      'import_type = import_type_factory.get_all_imports()',
      // ⚠️ `nodes` is SHADOWED by local parameters on 69 lines (`def __init__(self, nodes, edges)`,
      // `self.nodes_by_id`), which is docs/issues/0064's own warning about `parse` verbatim. Counting
      // cannot decide it; only removing it and comparing the payload can.
      'from networkx import nodes',
      // Only reference in the module is this line itself.
      'import importlib.util',
    ],
    guard: 'import_type',
  },
  'table-all-incidents-shaped': {
    // ⚠️ This flow serves TWO routes — `/viz-data/table-all-incidents` from `im0oral5p` and
    // `/viz-data/table-all-incidents-shaped` from `rtshaped`. Taking the first route node found gives
    // the wrong one, and the shaped algorithm (`getallshaped`) then looks "off-path". The demo's
    // Act 1 table uses the SHAPED route.
    flow: 'f1kuzx001jo51d',
    node: 'getallshaped',
    dead: [
      'from stixorm.module.authorise import import_type_factory',
      'import_type = import_type_factory.get_all_imports()',
      'import importlib.util',
    ],
    // `sys` is also dead here — its only non-import mentions are two COMMENT lines — but it is a
    // cheap stdlib import that is already resident, so removing it buys nothing and is left alone.
    guard: 'import_type',
  },
  /**
   * The `tree-*` routes, and a correction to my own earlier claim.
   *
   * ⚠️ I recorded these as NOT candidates because `import_type` "has a genuine second reference, so
   * the stixorm import is live". It does have one — and that reference is itself dead:
   *
   *     48   import_type = import_type_factory.get_all_imports()
   *     112  auth_factory = get_auth_factory_instance()
   *     113  auth        = auth_factory.get_auth_for_import(import_type)
   *     114  auth_types  = copy.deepcopy(auth["types"])        ← assigned once, NEVER READ
   *
   * The whole chain terminates in a variable nobody uses, so BOTH stixorm imports die, and `copy`
   * with them. Checking one link and stopping is exactly the "one column short" trap docs/issues/0049
   * records — a plausible conclusion from a partial view.
   */
  // ⚠️ `tree-sighting` is deliberately NOT here. It carries the same seven lines, but references
  // `auth_types` **three** times — the chain is live in that one. The guard would refuse it; listing
  // the omission records that it was examined and rejected rather than overlooked.
  'tree-impact': {
    flow: 'f1fiw0001ra51d',
    node: 'ilzqp9scv',
    dead: [
      'from stixorm.module.authorise import import_type_factory',
      'from stixorm.module.typedb_lib.factories.auth_factory import get_auth_factory_instance',
      'import_type = import_type_factory.get_all_imports()',
      'auth_factory = get_auth_factory_instance()',
      'auth = auth_factory.get_auth_for_import(import_type)',
      'auth_types = copy.deepcopy(auth["types"])',
      'import copy',
    ],
    guard: 'auth_types',
  },
  'tree-task': {
    flow: 'f1fiw1001ra51d',
    node: 'ilzqp465b',
    dead: [
      'from stixorm.module.authorise import import_type_factory',
      'from stixorm.module.typedb_lib.factories.auth_factory import get_auth_factory_instance',
      'import_type = import_type_factory.get_all_imports()',
      'auth_factory = get_auth_factory_instance()',
      'auth = auth_factory.get_auth_for_import(import_type)',
      'auth_types = copy.deepcopy(auth["types"])',
      'import copy',
    ],
    guard: 'auth_types',
  },
  'tree-company': {
    flow: 'f1fiw5001ra51d',
    node: 'im03tbtwq',
    dead: [
      'from stixorm.module.authorise import import_type_factory',
      'from stixorm.module.typedb_lib.factories.auth_factory import get_auth_factory_instance',
      'import_type = import_type_factory.get_all_imports()',
      'auth_factory = get_auth_factory_instance()',
      'auth = auth_factory.get_auth_for_import(import_type)',
      'auth_types = copy.deepcopy(auth["types"])',
      'import copy',
    ],
    guard: 'auth_types',
  },
  'tree-user': {
    flow: 'f1fiw5002ra50d',
    node: 'im0or912a',
    dead: [
      'from stixorm.module.authorise import import_type_factory',
      'from stixorm.module.typedb_lib.factories.auth_factory import get_auth_factory_instance',
      'import_type = import_type_factory.get_all_imports()',
      'auth_factory = get_auth_factory_instance()',
      'auth = auth_factory.get_auth_for_import(import_type)',
      'auth_types = copy.deepcopy(auth["types"])',
      'import copy',
    ],
    guard: 'auth_types',
  },
  'tree-user-2': {
    flow: 'f1w116001pn51d',
    node: 'im0or912a',
    dead: [
      'from stixorm.module.authorise import import_type_factory',
      'from stixorm.module.typedb_lib.factories.auth_factory import get_auth_factory_instance',
      'import_type = import_type_factory.get_all_imports()',
      'auth_factory = get_auth_factory_instance()',
      'auth = auth_factory.get_auth_for_import(import_type)',
      'auth_types = copy.deepcopy(auth["types"])',
      'import copy',
    ],
    guard: 'auth_types',
  },
  'tree-event': {
    flow: 'f1fiw1002ra50d',
    node: 'ilzqpc24h',
    dead: [
      'from stixorm.module.authorise import import_type_factory',
      'from stixorm.module.typedb_lib.factories.auth_factory import get_auth_factory_instance',
      'import_type = import_type_factory.get_all_imports()',
      'auth_factory = get_auth_factory_instance()',
      'auth = auth_factory.get_auth_for_import(import_type)',
      'auth_types = copy.deepcopy(auth["types"])',
      'import copy',
    ],
    guard: 'auth_types',
  },
}

const which = process.argv.find((a) => a.startsWith('--route='))?.split('=')[1] || 'unattached-split'
const target = TARGETS[which]
if (!target) { console.error(`unknown route ${which}; known: ${Object.keys(TARGETS).join(', ')}`); process.exit(2) }
const FLOW = target.flow
const NODE = target.node
const DEAD = target.dead
console.log(`route: /viz-data/${which}  flow ${FLOW}  node ${NODE}  (${DEAD.length} line(s) to remove)`)

/** Remove the dead lines, and refuse if the file is not the shape we measured. */
const strip = (algorithm, where) => {
  const lines = algorithm.split('\n')
  const found = DEAD.map((d) => lines.findIndex((l) => l.trim() === d))
  if (found.some((i) => i < 0)) {
    const missing = DEAD.filter((_, k) => found[k] < 0)
    return { error: `${where}: expected line(s) not present — ${missing.join(' | ')}` }
  }
  // Guard: only remove when the symbol really is unread, so a later edit that starts using it
  // cannot be silently undone by re-running this.
  const g = target.guard
  const uses = lines.filter((l) => new RegExp(`\\b${g}\\b`).test(l) && !l.includes(`${g}_factory.get_all_imports`)).length
  if (uses > 1) return { error: `${where}: ${g} is referenced ${uses}× — no longer dead, refusing` }
  const kept = lines.filter((l, i) => !found.includes(i))
  return { text: kept.join('\n'), removed: found.length }
}

// ---- source ----
const srcDb = JSON.parse(fs.readFileSync(SRC, 'utf8'))
const srcFlows = Array.isArray(srcDb) ? srcDb : (srcDb.flows || Object.values(srcDb))
const srcFlow = srcFlows.find((f) => (f.id || f.reference) === FLOW)
if (!srcFlow) { console.error(`flow ${FLOW} not in the provisioning source`); process.exit(2) }
const srcAlg = srcFlow.design?.[NODE]?.config?.algorithm
if (!srcAlg) { console.error(`node ${NODE} has no algorithm in source`); process.exit(2) }
const srcOut = strip(srcAlg, 'source')
if (srcOut.error) { console.error(`🚩 ${srcOut.error}`); process.exit(1) }

// ---- runtime ----
const design = await fetch(`${FASTAPI}/flow/${FLOW}/design`).then((r) => r.json()).catch(() => null)
if (!design) { console.error(`could not read the runtime design for ${FLOW} — is FastAPI up?`); process.exit(2) }
const rtAlg = design?.[NODE]?.config?.algorithm
if (!rtAlg) { console.error(`node ${NODE} has no algorithm in the runtime design`); process.exit(2) }
const rtOut = strip(rtAlg, 'runtime')
if (rtOut.error) { console.error(`🚩 ${rtOut.error}`); process.exit(1) }

console.log(`source  algorithm: ${srcAlg.length} -> ${srcOut.text.length} chars (${srcOut.removed} line(s) removed)`)
console.log(`runtime algorithm: ${rtAlg.length} -> ${rtOut.text.length} chars (${rtOut.removed} line(s) removed)`)
console.log(`the two copies were ${srcAlg === rtAlg ? 'IDENTICAL' : '⚠️ DIFFERENT'} before this edit`)

if (!APPLY) { console.log('\ndry run. Re-run with --apply to write both.'); process.exit(0) }

// Back up before either write — this is an unversioned runtime DB and a submodule file.
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupDir = path.join(WORKSPACE, 'docs/.backup', `0064-${stamp}`)
fs.mkdirSync(backupDir, { recursive: true })
fs.writeFileSync(path.join(backupDir, 'runtime-design.json'), JSON.stringify(design, null, 1))
fs.writeFileSync(path.join(backupDir, 'source-algorithm.py'), srcAlg)
console.log(`\nbackups: ${path.relative(WORKSPACE, backupDir).replace(/\\/g, '/')}`)

// source
srcFlow.design[NODE].config.algorithm = srcOut.text
fs.writeFileSync(SRC, JSON.stringify(srcDb, null, 1))
console.log('source: written')

// runtime
design[NODE].config.algorithm = rtOut.text
const res = await fetch(`${FASTAPI}/flow/${FLOW}/design/save`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(design),
})
console.log(`runtime: design/save -> ${res.status} ${(await res.text()).slice(0, 120)}`)

// Read it back — a 200 is not evidence the design took (docs/issues/0057's lesson, applied to Flow).
const after = await fetch(`${FASTAPI}/flow/${FLOW}/design`).then((r) => r.json()).catch(() => null)
const landed = after?.[NODE]?.config?.algorithm === rtOut.text
console.log(`runtime: reads back ${landed ? 'MATCHING' : '🚩 NOT matching'}`)
if (!landed) process.exitCode = 1
