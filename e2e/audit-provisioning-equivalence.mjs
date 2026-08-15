/**
 * docs/issues/0095 / 0096 — the "re-provision rehearsal", statically.
 *
 * The verification debt both issues carry is "prove a re-provision would not regress". Running a
 * real re-provision against the live stack is the risky way to learn that. This audit is the safe
 * way: for every INBOUND route the runtime DB serves from an unpaused flow (= every capability
 * the demo can currently reach), find the provisioning source's unpaused claimant of the same
 * route and diff the flow bodies node-by-node. Perfect equivalence means a re-provision
 * reproduces today's behaviour; each divergence is a concrete 0095 body-sync work item.
 *
 * Route components only (docs/issues/0183: a naive config.url scan counts outbound fetches).
 *
 *     node e2e/audit-provisioning-equivalence.mjs           # report
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { inboundRoutes } from './lib-flow-routes.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const RUNTIME_DB = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database/database.json')
const SOURCE_DB = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database/demo/database.json')

const runtime = JSON.parse(fs.readFileSync(RUNTIME_DB, 'utf8'))
const source = JSON.parse(fs.readFileSync(SOURCE_DB, 'utf8'))

// route -> unpaused claimant ids, per DB
const claim = (db) => {
  const out = {}
  for (const [id, f] of Object.entries(db)) {
    if (id === 'variables' || !f || !f.design || f.paused) continue
    for (const r of inboundRoutes(f)) (out[r] = out[r] || []).push(id)
  }
  return out
}
const rt = claim(runtime)
const src = claim(source)

// Same tolerance as P0-S8: the form-flow-metadata TEST flow is deliberately not provisioned
// (0075 follow-through) — losing it on re-provision is the intended outcome, not a regression.
const KNOWN_UNPROVISIONED = new Set(['f21crm003rn51d'])

// Node-level diff of two flow designs: compare each node's component + config (algorithm/code
// included — that is where 0064/0061-class fixes live).
const designDelta = (a, b) => {
  const deltas = []
  const keys = new Set([...Object.keys(a.design || {}), ...Object.keys(b.design || {})])
  for (const k of keys) {
    const na = a.design?.[k]
    const nb = b.design?.[k]
    if (!na || !nb) { deltas.push(`node ${k}: ${!na ? 'runtime-missing' : 'source-missing'}`); continue }
    if (na.component !== nb.component) { deltas.push(`node ${k}: component ${na.component} vs ${nb.component}`); continue }
    if (JSON.stringify(na.config || {}) !== JSON.stringify(nb.config || {})) deltas.push(`node ${k}: config differs (${na.component})`)
  }
  return deltas
}

let missing = 0, differentFlow = 0, bodyDrift = 0, identical = 0
const report = []
for (const [route, rids] of Object.entries(rt).sort()) {
  const sids = src[route] || []
  if (!sids.length) {
    if (rids.every((id) => KNOWN_UNPROVISIONED.has(id))) { report.push(`= tolerated ${route} — ${rids.join(',')} deliberately not provisioned`); continue }
    missing++; report.push(`❌ MISSING  ${route} — runtime ${rids.join(',')} has NO unpaused source claimant`); continue
  }
  // same id preferred; else a different flow serves it (id re-mint) — still compare bodies
  const rid = rids[0]
  const sid = sids.includes(rid) ? rid : sids[0]
  const deltas = designDelta(runtime[rid], source[sid])
  if (rid !== sid) {
    differentFlow++
    report.push(`◐ REMINTED ${route} — runtime ${rid} vs source ${sid}${deltas.length ? ` (+${deltas.length} node deltas)` : ' (bodies match)'}`)
  } else if (deltas.length) {
    bodyDrift++
    report.push(`⚠️ DRIFT    ${route} — ${rid}: ${deltas.slice(0, 3).join('; ')}${deltas.length > 3 ? ` …+${deltas.length - 3}` : ''}`)
  } else identical++
}
report.forEach((l) => console.log(l))
console.log(`\nroutes served by runtime (unpaused): ${Object.keys(rt).length}`)
console.log(`  identical in source: ${identical}`)
console.log(`  body drift (same id): ${bodyDrift}`)
console.log(`  served by a re-minted id: ${differentFlow}`)
console.log(`  MISSING from source: ${missing}`)
process.exit(missing ? 1 : 0)
