/**
 * alpha-launch 0071 follow-up — which flows exist only in the RUNTIME database?
 *
 * services/totaljs-flow/database/database.json is git-ignored runtime state. The provisioning source
 * is the strxi2-demo-api submodule's database.json. Anything fixed in the runtime copy alone is one
 * re-provision from vanishing -- which is exactly what had happened to alpha-launch 0050.
 *
 * Compares the two flow-by-flow and reports the drift. Read-only.
 */
import fs from 'fs'

const RUNTIME = 'typerefinery/services/totaljs-flow/database/database.json'
const SOURCE = 'typerefinery/services/totaljs-flow/database/demo/database.json'

const load = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const rt = load(RUNTIME)
const src = load(SOURCE)

const rtKeys = Object.keys(rt).filter((k) => k !== 'variables')
const srcKeys = Object.keys(src).filter((k) => k !== 'variables')

const onlyRuntime = rtKeys.filter((k) => !srcKeys.includes(k))
const onlySource = srcKeys.filter((k) => !rtKeys.includes(k))
const common = rtKeys.filter((k) => srcKeys.includes(k))

const nameOf = (f) => (f && (f.name || f.id)) || '(unnamed)'
const algsOf = (flow) => {
  const d = (flow && (flow.design || flow)) || {}
  const out = {}
  for (const [nid, n] of Object.entries(d)) {
    const a = n && n.config && n.config.algorithm
    if (typeof a === 'string') out[nid] = a
  }
  return out
}

console.log(`runtime flows: ${rtKeys.length}   provisioning-source flows: ${srcKeys.length}`)
console.log(`only in runtime: ${onlyRuntime.length}   only in source: ${onlySource.length}   common: ${common.length}`)
console.log()

if (onlyRuntime.length) {
  console.log('=== FLOWS THAT EXIST ONLY IN THE RUNTIME DB (lost on re-provision) ===')
  for (const k of onlyRuntime) console.log(`  ${k}  ${nameOf(rt[k])}`)
  console.log()
}
if (onlySource.length) {
  console.log('=== flows only in the source (never provisioned / deleted at runtime) ===')
  for (const k of onlySource) console.log(`  ${k}  ${nameOf(src[k])}`)
  console.log()
}

// Algorithm-level drift on the flows present in both.
const drifted = []
for (const k of common) {
  const a = algsOf(rt[k])
  const b = algsOf(src[k])
  const nodes = [...new Set([...Object.keys(a), ...Object.keys(b)])]
  const diffs = nodes.filter((n) => (a[n] || '') !== (b[n] || ''))
  if (diffs.length) {
    drifted.push({ id: k, name: nameOf(rt[k]), diffs, a, b })
  }
}

console.log(`=== ALGORITHM DRIFT: ${drifted.length} of ${common.length} common flows differ ===`)
for (const d of drifted) {
  console.log(`\n  ${d.id}  ${d.name}`)
  for (const n of d.diffs) {
    const ra = (d.a[n] || '').length
    const sb = (d.b[n] || '').length
    const sign = ra > sb ? 'RUNTIME AHEAD' : ra < sb ? 'source ahead' : 'same size, differs'
    console.log(`     node ${n.padEnd(12)} runtime ${String(ra).padStart(6)}  source ${String(sb).padStart(6)}   ${sign}`)
  }
}

// docs/issues/0096 Option 2 — stale-branch-URL gate. The drift comparison above is BLIND
// to this class: the 14 stale nodes were byte-identical on both sides (no drift), and the
// source-only flows never enter the common loop. Scan URL *content* in BOTH DBs instead.
// A raw-GitHub fetch pinned to refs/heads/main installs code 493 insertions behind
// (parse.py — no `references` writer) or a settings file missing its required sections
// (options.json, 0068's landmine). Allow-list starts EMPTY — the sweep
// (fix-0096-stale-branch-urls.mjs) landed first so this gate is born green; anything new
// fails by name. The TR_Settings_Branch comments in fixed algorithms are prose, not
// URL-shaped, and never match.
const STALE = /raw\.githubusercontent\.com\/[^"'\s\\]*\/refs\/heads\/main\//
const ALLOWED = [] // exact `${db} ${flow} ${node} ${field}` strings, if ever needed
const staleHits = []
for (const [dbName, dbObj] of [['runtime', rt], ['source', src]]) {
  for (const [flowId, flow] of Object.entries(dbObj)) {
    if (flowId === 'variables' || !flow?.design) continue
    for (const [nodeId, n] of Object.entries(flow.design)) {
      for (const field of ['algorithm', 'code']) {
        const s = n?.config?.[field]
        if (typeof s === 'string' && STALE.test(s)) {
          const key = `${dbName} ${flowId} ${nodeId} ${field}`
          if (!ALLOWED.includes(key)) {
            staleHits.push(`${key}: ${(s.match(STALE) || [''])[0]}…`)
          }
        }
      }
    }
  }
}
console.log(`\n=== STALE refs/heads/main URLS (0096 gate): ${staleHits.length} ===`)
for (const h of staleHits) console.log(`  🔴 ${h}`)
if (staleHits.length) {
  console.log('FAIL — a refs/heads/main fetch is back in a flow DB; sweep it (fix-0096-stale-branch-urls.mjs) or allow-list the exact tuple with a reason.')
  process.exitCode = 1
}
