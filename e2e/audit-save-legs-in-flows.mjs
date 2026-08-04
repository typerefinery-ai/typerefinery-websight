/**
 * docs/issues/0046 — which routed forms actually SAVE, measured rather than inferred.
 *
 * `audit-form-save-legs.mjs` answers "does this form have a route?" by reading `/var` metadata. It
 * cannot answer "does that route do anything?", because a provisioned flow is the generic
 * `flowform-service`, which only echoes. The count of forms that truly persist has been carried
 * forward by inference for several ticks; this measures it.
 *
 * A form saves if the flow serving its route contains an HTTP-request node pointing at an
 * os-triage / stix-orm API — i.e. a save leg — rather than only the route + echo nodes.
 *
 * Paused flows are skipped: pausing is retirement (docs/issues/0052).
 */
import fs from 'fs'

const DB = '../../typerefinery/services/totaljs-flow/database/database.json'
const ROOT = '/content/typerefinery-showcase/pages/os-triage/forms'

const db = JSON.parse(fs.readFileSync(DB, 'utf8'))
const audit = JSON.parse(fs.readFileSync('audit-form-save-legs.json', 'utf8'))

/** An outbound call to an application API — the thing that makes a flow more than an echo. */
const isSaveCall = (url) =>
  typeof url === 'string' && /(os-triage|stix-orm)\//.test(url) && !url.startsWith('/content/')

/** Every live flow that registers a route under this component path. */
function flowsFor(contentPath) {
  const routePath = contentPath.replace('/jcr:content/', '/_jcr_content/')
  const found = []
  for (const [fid, f] of Object.entries(db)) {
    if (!f || !f.design || f.paused === true || f.paused === 'true') continue
    for (const n of Object.values(f.design)) {
      const u = n.config && n.config.url
      if (typeof u === 'string' && u.startsWith(routePath)) {
        found.push(fid)
        break
      }
    }
  }
  return found
}

const rows = []
for (const r of audit.healthy) {
  const flows = flowsFor(r.contentPath)
  const calls = []
  for (const fid of flows) {
    for (const n of Object.values(db[fid].design)) {
      const u = n.config && n.config.url
      if (isSaveCall(u)) calls.push(u.replace(/^https?:\/\/[^/]+/, ''))
    }
  }
  rows.push({ page: r.page, flows, saves: calls.length > 0, calls: [...new Set(calls)] })
}

const persist = rows.filter((r) => r.saves)
const echo = rows.filter((r) => !r.saves)

console.log(`ROUTED FORMS: ${rows.length}\n`)
console.log(`PERSIST (have a save leg): ${persist.length}`)
for (const r of persist) console.log(`   OK ${r.page}\n      -> ${r.calls.join(', ')}`)
console.log(`\nECHO ONLY (route resolves, nothing is written): ${echo.length}`)
for (const r of echo) console.log(`   -- ${r.page}${r.flows.length ? '' : '   [no live flow found!]'}`)

fs.writeFileSync('save-legs-in-flows.json', JSON.stringify({ persist, echo }, null, 1))
console.log('\nwrote save-legs-in-flows.json')
