/**
 * docs/issues/0146 — `POST /os-triage/user-context/get` crashes instead of validating.
 *
 *     UnboundLocalError: cannot access local variable 'get_query' where it is not associated
 *
 * `main()` binds `get_query` and `context_type` ONLY inside `if "get_query" in input_data:` /
 * `elif "api" in input_data:`. Any input that matches neither branch falls straight through to
 *
 *     context_data = get_context_object(get_query, context_type["context_type"], ...)
 *
 * with both names unbound. So a caller that gets the input shape wrong receives a stack trace behind
 * an HTTP 200 rather than a message saying what was missing (docs/issues/0142's signature).
 *
 * ⚠️ TWO variables, not one. The traceback names `get_query`, but `context_type` is unbound on
 * exactly the same paths and is additionally SUBSCRIPTED (`context_type["context_type"]`), so it
 * would raise `TypeError` the moment `get_query` was supplied without it. Fixing only the name in
 * the traceback would have moved the crash, not removed it.
 *
 * This is docs/issues/0146 Option 1: initialise both, and return a clear error through the normal
 * output path — which is the module's own convention (`get_context_object` already returns
 * `"context_type unknown " + str(...)` rather than raising).
 *
 * ⚠️ Flow carries blocks INLINE as `design.<node>.config.algorithm`, so editing `brett_blocks` would
 * NOT change runtime behaviour. This edits the flow design, and writes the provisioning source too
 * (docs/issues/0072).
 * ⚠️ ASCII only — non-ASCII in a flow algorithm has bitten this project before.
 *
 *     node e2e/fix-user-context-get.mjs            # report only
 *     node e2e/fix-user-context-get.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const FASTAPI = process.env.FASTAPI_BASE || 'http://localhost:8000'
const FLOW_ID = 'f1fivw004ra50d'
const NODE = 'im03tn8bb'
const SOURCE_DB = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database/demo/database.json')
const APPLY = process.argv.includes('--apply')

const FROM = `def main(inputfile, outputfile):
    source_value = None
    source_id = None`

const TO = `def main(inputfile, outputfile):
    # alpha-launch docs/issues/0146. get_query and context_type used to be bound only inside the
    # branches below, so any input matching neither reached get_context_object() with both names
    # unbound and raised UnboundLocalError - a stack trace instead of a message saying what was
    # missing, delivered behind an HTTP 200. Initialise them, then say so plainly.
    get_query = None
    context_type = None
    source_value = None
    source_id = None`

const FROM2 = `    # setup logger for execution
    context_data = get_context_object(get_query, context_type["context_type"], source_value, source_id)`

const TO2 = `    # Validate before use, and report through the normal output path - the same convention
    # get_context_object() already follows when it returns "context_type unknown ...".
    missing = []
    if get_query is None:
        missing.append("get_query")
    if context_type is None:
        missing.append("context_type")
    if missing:
        result = "error, missing required input -> " + ", ".join(missing)
        print("[user-context/get] " + result + "; input keys were " + str(list(input_data.keys()) if "input_data" in dir() else []))
        with open(outputfile, "w") as outfile:
            json.dump(result, outfile)
        return
    if not isinstance(context_type, dict) or "context_type" not in context_type:
        result = "error, context_type must be an object with a context_type key, got -> " + str(context_type)
        print("[user-context/get] " + result)
        with open(outputfile, "w") as outfile:
            json.dump(result, outfile)
        return

    print("[user-context/get] context_type=" + str(context_type["context_type"]) + " source_value=" + str(source_value) + " source_id=" + str(source_id))
    context_data = get_context_object(get_query, context_type["context_type"], source_value, source_id)`

const applyEdit = (code, label) => {
  if (code.includes('docs/issues/0146')) {
    console.log(`  [${label}] already applied`)
    return code
  }
  for (const [from] of [[FROM], [FROM2]]) {
    if (!code.includes(from)) {
      throw new Error(`[${label}] anchor not found - the algorithm has changed; re-read it before editing`)
    }
  }
  console.log(`  [${label}] ${APPLY ? 'applied' : 'would apply'}: initialise get_query + context_type, validate, log`)
  return code.replace(FROM, TO).replace(FROM2, TO2)
}

const nonAscii = (s) => [...s].filter((c) => c.charCodeAt(0) > 127)
for (const [n, s] of [['TO', TO], ['TO2', TO2]]) {
  const bad = nonAscii(s)
  if (bad.length) {
    console.error(`FAIL - ${n} contains non-ASCII: ${JSON.stringify(bad.join(''))}`)
    process.exit(1)
  }
}

console.log(`runtime: GET /flow/${FLOW_ID}/design`)
const design = await (await fetch(`${FASTAPI}/flow/${FLOW_ID}/design`)).json()
const node = design[NODE]
if (!node?.config?.algorithm) {
  console.error(`FAIL - node ${NODE} has no config.algorithm in the runtime design`)
  process.exit(1)
}
const newRuntime = applyEdit(node.config.algorithm, 'runtime')

const db = JSON.parse(fs.readFileSync(SOURCE_DB, 'utf8'))
const list = Array.isArray(db) ? db : Object.values(db)
const srcFlow = list.find((f) => f && f.id === FLOW_ID)
if (!srcFlow?.design?.[NODE]?.config?.algorithm) {
  console.error(`FAIL - flow ${FLOW_ID} / node ${NODE} algorithm not found in the provisioning source`)
  process.exit(1)
}
const newSource = applyEdit(srcFlow.design[NODE].config.algorithm, 'source')

if (!APPLY) {
  console.log('\ndry run - nothing written. Re-run with --apply.')
  process.exit(0)
}

node.config.algorithm = newRuntime
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
srcFlow.design[NODE].config.algorithm = newSource
fs.writeFileSync(SOURCE_DB, JSON.stringify(db, null, '\t'))
console.log(`source written: ${SOURCE_DB}`)
