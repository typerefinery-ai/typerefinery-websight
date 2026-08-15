/**
 * docs/issues/0133 step 2 (decision 0021 Option 3) — the viz flows SERVE each node's
 * resolved `form_path`, looked up from icon_registry.csv (single source of truth,
 * reconciled by 0085 the same day — registry == authored reality, so no mapping table).
 *
 * Served shape: `form_path = {form_family}/{form_group}/{form}-forms/{form}` (base path;
 * consumers append `-update.html` / `-create.html` — the smallest template edit).
 * Resolution is PER-ICON, matching the registry's own granularity (the per-type-vs-
 * per-icon open question is thereby answered by the registry's structure; recorded in
 * 0133). Fallback: a node whose icon has no registry row keeps deriving from its stored
 * object_* trio — today's behaviour, logged so the gap is visible.
 *
 * Insertion is a FENCED helper + one call per flow, in the inline algorithms of the
 * three viz flows (the writable os-triage flow layer — the data-agnostic ladder's
 * "API → Flow" rung; the runtime-fetched parse.py/convert_n_and_e.py stay untouched):
 *   f1uemw001rc51d Composer - Unattached - Split   (node im03tgckd)
 *   f1kzb9001xs51d Overview - Get Default Incident (node im7cs30iz)
 *   f1kutl001ts51d Overview - Get Incident         (node im7cpfumk)
 *
 * Runtime via /flow/{id}/design/save AND the provisioning source (0072).
 *
 *     node e2e/fix-0133-serve-form-path.mjs            # report
 *     node e2e/fix-0133-serve-form-path.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const FASTAPI = process.env.FASTAPI_BASE || 'http://localhost:8000'
const SOURCE_DB = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database/demo/database.json')
const APPLY = process.argv.includes('--apply')

const HELPER = `
# ------------------------------------------------------------------------------------ #
# alpha-launch decision 0021 / issue 0133 - serve the RESOLVED form path per node.     #
# icon_registry.csv is the single source of truth (reconciled with authored reality,  #
# issue 0085); consumers must stop assembling URLs from the object_* trio.            #
# ------------------------------------------------------------------------------------ #
def decorate_form_paths(node_lists):
    import csv as _csv
    _registry = {}
    _reg_path = "./generated/os-triage/common_files/icon_registry.csv"
    try:
        with open(_reg_path, "r") as _reg_file:
            for _row in _csv.DictReader(_reg_file):
                if _row.get("icon") and _row.get("form_family") and _row.get("form"):
                    _registry[_row["icon"]] = _row
    except OSError as _reg_err:
        print(f"form_path decoration skipped: registry unreadable ({_reg_err})")
        return
    _decorated = 0
    _fallbacks = 0
    for _nodes in node_lists:
        for _node in _nodes or []:
            _row = _registry.get(_node.get("icon"))
            if _row:
                _node["form_path"] = _row["form_family"] + "/" + _row["form_group"] + "/" + _row["form"] + "-forms/" + _row["form"]
                _decorated += 1
            elif _node.get("object_family") and _node.get("object_group") and _node.get("object_form"):
                # no registry row for this icon - degrade to the stored trio (today's
                # behaviour) and SAY SO, never guess silently
                _node["form_path"] = _node["object_family"] + "/" + _node["object_group"] + "/" + _node["object_form"] + "-forms/" + _node["object_form"]
                _fallbacks += 1
                print(f"form_path FALLBACK for icon {_node.get('icon')}: no registry row")
    print(f"form_path decoration: {_decorated} from registry, {_fallbacks} fallback(s)")
# ------------------------------------------------------------------------------------ #

`

const FLOWS = [
  {
    id: 'f1uemw001rc51d',
    node: 'im03tgckd',
    anchor: '    unattached = get_unattached()\n',
    call: '    decorate_form_paths([unattached.get("promo", {}).get("nodes", []), unattached.get("scratch", {}).get("nodes", [])])\n',
  },
  {
    id: 'f1kzb9001xs51d',
    node: 'im7cs30iz',
    anchor: '    nodes_and_edges = get_default_incidents_objects()\n',
    call: '    decorate_form_paths([nodes_and_edges.get("nodes", [])])\n',
  },
  {
    id: 'f1kutl001ts51d',
    node: 'im7cpfumk',
    anchor: null, // discovered at run time — assert it matches the same get_* + dump shape
    call: '    decorate_form_paths([nodes_and_edges.get("nodes", [])])\n',
  },
]

const editAlgorithm = (alg, flow, label) => {
  if (alg.includes('decorate_form_paths')) {
    console.log(`  [${label}] ${flow.id}/${flow.node}: already decorated`)
    return null
  }
  let anchor = flow.anchor
  let call = flow.call
  if (!anchor) {
    const m = alg.match(/( *)nodes_and_edges = get_[a-z_]+\([a-z_]*\)\n/)
    if (!m) throw new Error(`${flow.id}: no nodes_and_edges anchor found — inspect by hand`)
    anchor = m[0]
    // match the anchor's own indentation (it can sit inside a with/if block)
    call = m[1] + call.trimStart()
  }
  if (!alg.includes(anchor)) throw new Error(`${flow.id}: anchor not found — inspect by hand`)
  let out = alg.replace('def main(', HELPER + 'def main(')
  out = out.replace(anchor, anchor + call)
  console.log(`  [${label}] ${flow.id}/${flow.node}: helper + call inserted`)
  return out
}

const db = JSON.parse(fs.readFileSync(SOURCE_DB, 'utf8'))
const flows = Array.isArray(db) ? db : Object.values(db)

for (const flow of FLOWS) {
  // runtime half
  const design = await (await fetch(`${FASTAPI}/flow/${flow.id}/design`)).json()
  const alg = design?.[flow.node]?.config?.algorithm
  if (typeof alg !== 'string') throw new Error(`${flow.id}/${flow.node}: no algorithm at runtime`)
  const newAlg = editAlgorithm(alg, flow, 'runtime')
  if (newAlg && APPLY) {
    design[flow.node].config.algorithm = newAlg
    const save = await fetch(`${FASTAPI}/flow/${flow.id}/design/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(design),
    })
    console.log(`  [runtime] ${flow.id} design/save -> ${save.status}`)
  }
  // source half
  const src = flows.find((f) => f && f.id === flow.id)
  if (!src?.design?.[flow.node]?.config?.algorithm) throw new Error(`${flow.id}: missing in provisioning source`)
  const newSrc = editAlgorithm(src.design[flow.node].config.algorithm, flow, 'source ')
  if (newSrc && APPLY) src.design[flow.node].config.algorithm = newSrc
}

if (!APPLY) {
  console.log('\ndry run — nothing written. Re-run with --apply.')
  process.exit(0)
}
fs.writeFileSync(SOURCE_DB, JSON.stringify(db, null, '\t'))
console.log(`\nsource written. Verify: both /viz-data payloads carry form_path on every node, and GET of each distinct {form_path}-update.html returns 200.`)
