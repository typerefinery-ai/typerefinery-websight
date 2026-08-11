/**
 * decision 0032 (Decided 2026-08-12, Denis, Option 2) — wire Act 1's toolbar Search to the table's
 * built-in `FILTER` event.
 *
 * The mockup shows ONE search affordance; the build has the mockup's toolbar (dead) plus a working
 * table filter. The toolbar is not decoration — it is a real submit on a flow-enabled form whose flow
 * is an empty echo template (docs/issues/0110). This connects it to the filter the table already
 * implements, and leaves the flow submit leg alone (a 200 echo is harmless), so nothing
 * correctly-wired is disconnected.
 *
 * Two authored `_events_` entries, both via the component-node servlet:
 *
 *   input_1  emit  INPUT_CHANGE  ->  topic  (the toolbar's text box, field name `case`)
 *   table    listen FILTER       <-  topic
 *
 * ⚠️ THREE shape mismatches had to be fixed before this could work, none of them authoring:
 *   1. `eventOnFilter` read a bare `{value}` where the bus sends `compileEventData`'s envelope
 *      (fixed f55c97c7, deployed and verified: the envelope now filters).
 *   2. the registration read `event.key`/`event.value` where `EventsListItem` provides
 *      `topic`/`type` — so an authored entry registered NOTHING and failed silently (fixed here).
 *   3. the input emits on `change`, so the value must be committed (blur/Enter), not just typed.
 *
 *     node e2e/wire-toolbar-search.mjs            # report only
 *     node e2e/wire-toolbar-search.mjs --apply
 *
 * ⚠️ Needs NODE_TLS_REJECT_UNAUTHORIZED=0 (Traefik's leaf cert).
 */
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const NODE_SERVLET = `${CMS}/bin/typerefinery/component-node`
const APPLY = process.argv.includes('--apply')

const PAGE = '/content/typerefinery-showcase/pages/os-triage/pages/incidents/jcr:content/rootcontainer'
// ⚠️ The input component's model is built from the FIELD child, not the input node — the rendered
// data-model reports `path: .../input_1/field` and `id: input_1_…-field_…`. An `_events_` authored on
// `input_1` is therefore invisible to the clientlib: the table registered its listener while the
// emit side silently never attached. Measured, after the first attempt filtered nothing.
const INPUT = `${PAGE}/container1/form/container/container_2/input_1/field`
const TABLE = `${PAGE}/container1/form/container2/table`
/** One topic, named for what it carries rather than for either component. */
const TOPIC = 'incidents-table-filter'

const post = (body) =>
  fetch(NODE_SERVLET, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  })

const read = async (p) => {
  const res = await fetch(`${CMS}${p}.2.json`, { headers: { Authorization: auth } })
  return res.ok ? res.json() : null
}

const TARGETS = [
  {
    what: 'toolbar text box emits its value on change',
    parent: INPUT,
    name: '_events_',
    json: {
      // A numbered child is one list entry — the servlet turns nested objects into child nodes.
      0: { action: 'INPUT_CHANGE', topic: TOPIC, type: 'emit', name: 'INPUT_CHANGE' },
    },
  },
  {
    what: 'table filters when that topic fires',
    parent: TABLE,
    name: '_events_',
    json: {
      0: { topic: TOPIC, type: 'FILTER', action: 'FILTER' },
    },
  },
]

for (const t of TARGETS) {
  const existing = await read(`${t.parent}/_events_`)
  console.log(`${t.what}`)
  console.log(`   node    ${t.parent}/_events_`)
  console.log(`   current ${existing ? JSON.stringify(Object.keys(existing).filter((k) => !k.startsWith('jcr:'))) : '(absent)'}`)
  console.log(`   target  ${JSON.stringify(t.json)}`)
  if (!APPLY) {
    console.log('   ~ would write (dry run)\n')
    continue
  }
  const res = await post({ parent: t.parent, name: t.name, json: JSON.stringify(t.json) })
  const body = await res.text()
  // A 200 from the servlet is not evidence the node landed (docs/issues/0057) - read it back.
  const after = await read(`${t.parent}/_events_`)
  const entry = after && after['0']
  console.log(`   POST ${res.status} ${body.slice(0, 90)}`)
  console.log(`   read back: ${entry ? JSON.stringify({ topic: entry.topic, type: entry.type, action: entry.action }) : 'MISSING'}\n`)
}

if (!APPLY) console.log('dry run - nothing written. Re-run with --apply.')
else console.log('Now verify in the UI: type into the toolbar box, commit the value, and the table must filter.')
