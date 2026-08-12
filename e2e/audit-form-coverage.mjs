import fs from 'fs'
import https from 'https'

// Reproduce the widget's URL computation: object_family / object_group / <object_form>-forms /
// <object_form>-update.html, under the authored stixorm-forms root.
const ROOT =
  'https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms'
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const agent = new https.Agent({ rejectUnauthorized: false })

const payload = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const nodes = payload.nodes || []

// Unique (family, group, form) triples actually present in the current incident.
const seen = new Map()
for (const n of nodes) {
  const key = `${n.object_family}/${n.object_group}/${n.object_form}`
  if (!seen.has(key)) seen.set(key, { ...n, count: 0 })
  seen.get(key).count++
}

// ⚠️ 2026-08-12 — this audit was reporting **every** form as missing, and saying so in the summary
// ("nodes that would 404 on left-select: 28/28"). It was wrong: node's global `fetch` (undici)
// **ignores** the `agent` option, so every request failed TLS against Traefik's cert, fell into the
// `.catch()`, and came back as the string 'ERR' — which the row formatter then printed under a
// `404 ` mark. Measured against the same URLs with curl, identity and sequence answer **200**.
//
// Two defects, both fixed here, because the second is the dangerous one:
//   1. TLS: opt out explicitly for this local, self-signed host.
//   2. **An error was being rendered as a definitive verdict.** A tool whose failure mode is
//      indistinguishable from the defect it looks for is worse than no tool — it manufactures
//      false confidence in the wrong direction (docs/issues/0142's family). ERR is now its own
//      column, excluded from both counts, and the summary refuses to conclude while any remain.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const probe = (url) =>
  fetch(url, { headers: { Authorization: auth } })
    .then((r) => r.status)
    .catch((e) => `ERR:${(e && e.cause && e.cause.code) || (e && e.code) || 'unknown'}`)

console.log(`node types present in the default incident: ${seen.size}\n`)
const rows = []
for (const [key, n] of seen) {
  const url = `${ROOT}/${n.object_family}/${n.object_group}/${n.object_form}-forms/${n.object_form}-update.html`
  const status = await probe(url)
  rows.push({ key, type: n.type, count: n.count, status, path: url.replace(ROOT, '') })
}
rows.sort((a, b) => (a.status === b.status ? b.count - a.count : String(a.status) < String(b.status) ? 1 : -1))
let ok = 0,
  missing = 0,
  errored = 0
for (const r of rows) {
  const isErr = String(r.status).startsWith('ERR')
  const mark = r.status === 200 ? 'OK  ' : isErr ? '??? ' : 'MISS'
  if (r.status === 200) ok += r.count
  else if (isErr) errored += r.count
  else missing += r.count
  console.log(`${mark} ${String(r.status).padEnd(12)} ${String(r.count).padStart(2)} node(s)  ${r.type.padEnd(16)} ${r.path}`)
}
console.log(`\nnodes whose Update form RESOLVES : ${ok}/${nodes.length}`)
console.log(`nodes that would 404 on left-select: ${missing}/${nodes.length}`)
if (errored) {
  console.log(`\n⚠️  ${errored}/${nodes.length} node(s) COULD NOT BE PROBED (network/TLS, not a verdict).`)
  console.log('   The counts above are incomplete — do not read them as coverage until this is 0.')
  process.exitCode = 1
}
