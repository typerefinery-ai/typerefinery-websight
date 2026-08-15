/**
 * docs/issues/0167 residue — which routed flows swallow an upstream non-2xx?
 *
 * FastAPI answers 500 for a crashed algorithm (0026/4153e8a3), and Total.js's request component
 * routes a non-2xx response to its ERROR output — but a flow whose request-node error output is
 * unwired (or wired back into the success path) answers 200 to ITS caller, so the failure dies at
 * the first hop (measured in 0164's crash trace: Flow→Flow hop reported status 200 around a body
 * of error:"true").
 *
 * For every flow in BOTH Flow databases this prints, per request-ish node:
 *   - whether its error output has any connection, and
 *   - where the error path terminates (a response node, a success sink, or a dead end).
 *
 *     node e2e/audit-flow-error-paths.mjs [--db <path>]
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const WORKSPACE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const DBS = [
  ['provisioning', path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database/demo/database.json')],
  ['runtime', path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database/database.json')],
]

// component kinds that make an outbound HTTP call and expose an error output
const REQUESTY = /^(request|resthttp|http|fetch)/i
// component kinds that terminate a route with a response
const RESPONSY = /^(httpresponse|response)/i

for (const [label, dbPath] of DBS) {
  if (!fs.existsSync(dbPath)) {
    console.log(`⚠️ ${label}: ${dbPath} missing — skipped`)
    continue
  }
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
  console.log(`\n=== ${label}: ${path.basename(path.dirname(dbPath))}/database.json ===`)
  for (const key of Object.keys(db)) {
    if (key === 'variables') continue
    const flow = db[key]
    const design = flow.design || {}
    const url = flow.url || ''
    const nodes = Object.entries(design).filter(([, n]) => n && typeof n === 'object' && n.component)

    // map: nodeId -> its outgoing connections per output index
    const findings = []
    for (const [nodeId, node] of nodes) {
      if (!REQUESTY.test(node.component)) continue
      const conns = node.connections || {}
      // Total.js design: connections keyed by output index ('0' = success, '1' = error for request)
      const outputs = Object.keys(conns)
      const errorOut = conns['1'] || []
      const hasError = Array.isArray(errorOut) && errorOut.length > 0
      let terminus = '(unwired)'
      if (hasError) {
        // follow one hop to name the target component(s)
        terminus = errorOut
          .map((c) => {
            const target = design[c.id]
            return target ? `${target.component}${RESPONSY.test(target.component) ? ' ✅' : ''}` : '??'
          })
          .join(', ')
      }
      findings.push({ nodeId, component: node.component, outputs: outputs.join('/'), hasError, terminus })
    }
    if (findings.length) {
      console.log(`\n${key}  "${flow.name || ''}"  url=${url}`)
      for (const f of findings) {
        console.log(
          `  ${f.hasError ? '  ' : '🔴'} ${f.component} [${f.nodeId}] outputs:${f.outputs || '(none)'} error→ ${f.terminus}`
        )
      }
    }
  }
}
