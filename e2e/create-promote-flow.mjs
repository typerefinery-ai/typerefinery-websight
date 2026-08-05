/**
 * docs/decisions/0010 Option 1 — create the flow that serves `POST /os-triage/promote-subgraph`.
 *
 * No promote route exists anywhere ([0045](../../docs/issues/0045-blocks-exist-upstream-but-have-no-flow-routes.md)),
 * so one is created here rather than provisioned from a CMS form: this is an API, not a form, and a
 * form-provisioned route would carry a `/content/.../form/*` URL that #84 does not describe.
 *
 * The import recipe is the one proven for the Composer options flow (docs/issues/0041):
 * `POST /fapi/streams_import/` with **`{"data": "<design as a JSON STRING>"}`** — a nested object
 * answers `400 The field "data" is invalid`.
 *
 *     node e2e/create-promote-flow.mjs            # report
 *     node e2e/create-promote-flow.mjs --apply
 */
const FLOW = 'http://localhost:8111'
const ROUTE = '/os-triage/promote-subgraph'
const APPLY = process.argv.includes('--apply')

const existing = await (await fetch(`${FLOW}/fapi/streams/`)).json()
const already = existing.filter((f) => (f.name || '').includes('Promote Sub-Graph'))
console.log(`flows already named "Promote Sub-Graph": ${already.length}${already.length ? ' — ' + already.map((f) => f.id).join(', ') : ''}`)

// A flow carries its component SOURCES inline in `components`. A design referencing
// c71gcc7fd3 / typerefinery_code / cgkli87a95 / typerefinery_printjson is inert without them —
// my first attempt imported {name, group, design} alone and Flow created a flow with an EMPTY
// design, which is exactly the 0054 empty-shell shape. So clone the component set from a flow
// that already has all four, and replace only the design.
import fsMod from 'fs'
const db = JSON.parse(fsMod.readFileSync('../../typerefinery/services/totaljs-flow/database/database.json', 'utf8'))
const donor = db['f21crl005rn51d']
if (!donor) throw new Error('donor flow f21crl005rn51d not found — pick another with the same components')

const flow = JSON.parse(JSON.stringify(donor))
delete flow.id
flow.name = 'Promote Sub-Graph'
flow.group = 'OS-Triage'
flow.readme = 'alpha-launch decisions/0010 Option 1 — moves a sub-graph from unattached into the incident (#84)'
flow.paused = false
flow.design = {
  httppost: {
    component: 'c71gcc7fd3',
    config: { url: ROUTE, method: 'POST', timeout: 60000, limit: 5000, upload: false, response: true },
    x: 260,
    y: 120,
    connections: {},
  },
}

console.log(`route to create: POST ${ROUTE}`)
if (!APPLY) {
  console.log('\n(report only — pass --apply to create the flow)')
  process.exit(0)
}

const res = await fetch(`${FLOW}/fapi/streams_import/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: JSON.stringify(flow) }),
})
const body = await res.text()
console.log(`streams_import -> ${res.status} ${body}`)
try {
  const parsed = JSON.parse(body)
  if (parsed.success && parsed.value) {
    console.log(`\nflow id: ${parsed.value}`)
    console.log(`next: node e2e/author-promote-subgraph-flow.mjs ${parsed.value}`)
  }
} catch {
  /* the status line above is the report */
}
