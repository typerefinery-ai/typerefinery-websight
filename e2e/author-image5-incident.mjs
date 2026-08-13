/**
 * alpha-launch **decision 0036 (Option 2)** — author a separate, purpose-built demo incident whose
 * Composer panes match [`image5.png`](../../docs/mini-app-source/image5.png).
 *
 * Both existing incidents are left **untouched**: the rich `511d2ab7…` stays for Act 2 and for any
 * "show me more" question, exactly as the decision requires.
 *
 * ## What it authors
 *
 * **Promotable — image5's 8 labelled objects, as ONE connected subgraph:**
 * `Potential Threat Address` · `Suspicious URL` · `Observation 1` · `Microsoft Exchange` ·
 * `Potential Phishing Email` · `Sighting Alert` · `Naive User` · a `derived-from` SRO.
 *
 * **Scratch — image5's trio**, plus the address `network-traffic` needs to be valid STIX.
 *
 * ## 🔑 Why `references` is populated here and empty in `seed-scratch-trio.mjs`
 *
 * The Flow edge-builder derives EVERY edge from `node["references"]`, including the SRO branch
 * (`Get_Default_Incident_and_Objects`). An object with `references: {}` therefore emits no edges —
 * docs/issues/0169 Fault A, measured live as Composer Scratch showing 6 nodes and 0 edges.
 *
 * - **Scratch objects want `{}`**: decision 0007 keeps *unconnected* objects in Scratch, so emptiness
 *   is what puts them there. That is why the trio seed sets `{}` deliberately.
 * - **Promotable objects must NOT be `{}`**: Promo holds *subgraphs connected to a promotable object*.
 *   With `{}` these 8 would render as 8 disconnected dots and fall into Scratch — the precise failure
 *   this decision exists to avoid.
 *
 * ## Display fields are copied, not invented
 *
 * `icon` / `heading` / `object_form` / `object_group` / `object_family` are taken from the **live
 * wrappers** of the same types in the existing incident (and `icon_registry.csv` for `url`), so the
 * icons and forms are the ones the app already resolves.
 *
 * ⚠️ `name` carries the **design's label** while `original` carries **genuine STIX properties** — the
 * same deliberate split `seed-scratch-trio.mjs` documents. Nothing is invented into `original`.
 *
 *     node e2e/author-image5-incident.mjs            # report only
 *     node e2e/author-image5-incident.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const CONTEXT = path.resolve(HERE, '../../typerefinery/services/fastapi/generated/os-triage/context_mem')
const APPLY = process.argv.includes('--apply')

const INC = 'incident--1a9e5000-0000-4000-8000-00001a9e5000'
const CREATED = '2026-02-08T01:11:57.617Z'
/**
 * Shared id stem so a diff reads as one authored set.
 *
 * ⚠️ **The final group MUST be 12 hex characters — a valid UUID.** The first version of this script
 * emitted a 10-character tail (`…-0000e5a001`), and the consequence was silent and expensive:
 * `derive_references` in the Composer's split algorithm finds referenced objects by **validating the
 * STIX identifier FORMAT** (`type--UUID`), deliberately rather than by property name. A malformed
 * UUID therefore matches nothing, so every embedded reference was skipped and the authored cast came
 * out as loose nodes — which looked exactly like "the Composer only connects via SROs".
 * It does not: the live incident's Promotable pane carries **42** embedded edges
 * (`object-refs`, `sighting-of-ref`, `where-sighted-refs`, …) alongside its relationship edges.
 */
const B = '5c9a7f10-0000-4000-8000-'
const id = (t, n) => `${t}--${B}${n}`
const uuidTail = /^[0-9a-f]{12}$/
const EMAIL = id('email-addr', '00000e5a0001')
const URLO  = id('url', '00000e5a0002')
const OBS   = id('observed-data', '00000e5a0003')
const EXCH  = id('identity', '00000e5a0004')
const IND   = id('indicator', '00000e5a0005')
const ALERT = id('sighting', '00000e5a0006')
const NAIVE = id('sighting', '00000e5a0007')
const SRO   = id('relationship', '00000e5a0008')

/** Promotable: image5's eight, wired into one connected subgraph. */
const PROMO = [
  { id: EMAIL, label: 'Potential Threat Address', icon: 'email-addr', head: 'Email-Addr',
    form: 'email-addr', group: 'sco-forms',
    original: { type: 'email-addr', spec_version: '2.1', value: 'evil@northkorea.nk' },
    references: {} },
  { id: URLO, label: 'Suspicious URL', icon: 'url', head: 'URL', form: 'url', group: 'sco-forms',
    original: { type: 'url', spec_version: '2.1', value: 'https://www.northkorea.nk/wp-content/invoice_2026.exe' },
    references: {} },
  { id: OBS, label: 'Observation 1', icon: 'observed-data', head: 'Observed-Data',
    form: 'observed-data', group: 'sdo-forms',
    original: { type: 'observed-data', spec_version: '2.1', created: CREATED, modified: CREATED,
      first_observed: CREATED, last_observed: CREATED, number_observed: 1,
      object_refs: [EMAIL, URLO] },
    references: { object_refs: [EMAIL, URLO] } },
  { id: EXCH, label: 'Microsoft Exchange', icon: 'identity-system', head: 'Identity-System',
    form: 'identity', group: 'sdo-forms',
    original: { type: 'identity', spec_version: '2.1', created: CREATED, modified: CREATED,
      name: 'Microsoft Exchange', identity_class: 'system' },
    references: {} },
  { id: IND, label: 'Potential Phishing Email', icon: 'indicator', head: 'Indicator',
    form: 'indicator', group: 'sdo-forms',
    original: { type: 'indicator', spec_version: '2.1', created: CREATED, modified: CREATED,
      name: 'Potential Phishing Email', indicator_types: ['malicious-activity'],
      pattern: "[email-addr:value = 'evil@northkorea.nk']", pattern_type: 'stix',
      valid_from: CREATED },
    references: {} },
  { id: ALERT, label: 'Sighting Alert', icon: 'sighting-alert', head: 'Sighting-Alert',
    form: 'sighting', group: 'sro-forms',
    original: { type: 'sighting', spec_version: '2.1', created: CREATED, modified: CREATED,
      sighting_of_ref: IND, where_sighted_refs: [EXCH], observed_data_refs: [OBS] },
    references: { sighting_of_ref: [IND], where_sighted_refs: [EXCH], observed_data_refs: [OBS] } },
  { id: NAIVE, label: 'Naive User', icon: 'sighting-anecdote', head: 'Sighting-Anecdote',
    form: 'sighting', group: 'sro-forms',
    original: { type: 'sighting', spec_version: '2.1', created: CREATED, modified: CREATED,
      sighting_of_ref: IND, where_sighted_refs: [EXCH] },
    references: { sighting_of_ref: [IND], where_sighted_refs: [EXCH] } },
  { id: SRO, label: 'derived-from', icon: 'relationship', head: 'Derived-From - SRO',
    form: 'relationship', group: 'sro-forms',
    original: { type: 'relationship', spec_version: '2.1', created: CREATED, modified: CREATED,
      relationship_type: 'derived-from', source_ref: IND, target_ref: OBS },
    references: { source_ref: [IND], target_ref: [OBS] } },
]

/**
 * Scratch: image5's trio. `references: {}` on purpose — unconnected is what keeps them in Scratch.
 * ⚠️ image5 shows THREE; the `ipv4-addr` is a fourth because `NetworkTraffic` requires at least one
 * of src_ref/dst_ref (docs/issues/0166 — omitting it produced invalid STIX that broke Create SRO).
 */
const IPV4 = id('ipv4-addr', '00000e5b0001')
const SCRATCH = [
  { id: id('process', '00000e5b0002'), label: 'Unauthorised Process', icon: 'process', head: 'Process',
    form: 'process', group: 'sco-forms',
    original: { type: 'process', spec_version: '2.1', pid: 4212,
      cwd: 'C:\\Users\\naive\\AppData\\Local\\Temp',
      command_line: 'C:\\Users\\naive\\AppData\\Local\\Temp\\invoice_2026.exe /silent', is_hidden: true },
    references: {} },
  { id: IPV4, label: '203.0.113.42', icon: 'ipv4-addr', head: 'IPv4-Addr', form: 'ipv4-addr',
    group: 'sco-forms',
    original: { type: 'ipv4-addr', spec_version: '2.1', value: '203.0.113.42' },
    references: {} },
  { id: id('network-traffic', '00000e5b0003'), label: 'Socket Connection', icon: 'network-traffic',
    head: 'Network-Traffic', form: 'network-traffic', group: 'sco-forms',
    original: { type: 'network-traffic', spec_version: '2.1', protocols: ['tcp'], dst_ref: IPV4,
      dst_port: 443 },
    references: {} },
  { id: id('malware', '00000e5b0004'), label: 'malware', icon: 'malware', head: 'Malware', form: 'malware',
    group: 'sdo-forms',
    original: { type: 'malware', spec_version: '2.1', created: CREATED, modified: CREATED,
      name: 'malware', is_family: false, malware_types: ['dropper'] },
    references: {} },
]

const build = (t) => ({
  id: t.id,
  type: t.original.type,
  icon: t.icon,
  name: t.label,
  heading: t.head,
  description: t.label,
  object_form: t.form,
  object_group: t.group,
  object_family: 'stix-forms',
  original: { ...t.original, id: t.id },
  references: t.references,
})

const INCIDENT_WRAPPER = {
  id: INC,
  type: 'incident',
  icon: 'incident-ext',
  name: 'Phishing campaign - image5 walkthrough',
  heading: 'Extended-Incident',
  description: 'Purpose-built Composer demo incident (decision 0036)',
  object_form: 'incident',
  object_group: 'sdo-forms',
  object_family: 'stix-forms',
  original: {
    type: 'incident', spec_version: '2.1', id: INC, created: CREATED, modified: CREATED,
    name: 'Phishing campaign - image5 walkthrough',
    event_refs: [], impact_refs: [], task_refs: [], sequence_refs: [], sequence_start_refs: [],
    other_object_refs: [],
  },
  references: {},
}

// ---------------------------------------------------------------------------------------------
const dir = path.join(CONTEXT, INC)
const all = [...PROMO, ...SCRATCH]

console.log('=== decision 0036 Option 2 — author the image5 incident ===')
console.log(`incident dir : ${INC}`)
console.log(`exists       : ${fs.existsSync(dir)}`)
console.log(`\nPromotable (${PROMO.length}) — image5's labelled cast, one connected subgraph:`)
PROMO.forEach((t) => console.log(
  `   ${t.label.padEnd(26)} ${t.original.type.padEnd(15)} refs=${Object.keys(t.references).join(',') || '(none)'}`))
console.log(`\nScratch (${SCRATCH.length}) — image5's trio + the ipv4 NetworkTraffic requires:`)
SCRATCH.forEach((t) => console.log(`   ${t.label.padEnd(26)} ${t.original.type}`))

// Connectivity check: every Promotable object must be reachable, or it lands in Scratch instead.
const ids = new Set(PROMO.map((t) => t.id))
const adj = new Map([...ids].map((i) => [i, new Set()]))
for (const t of PROMO) {
  for (const list of Object.values(t.references)) {
    for (const target of list) {
      if (!ids.has(target)) continue
      adj.get(t.id).add(target)
      adj.get(target).add(t.id)
    }
  }
}
const seen = new Set([PROMO[0].id])
const queue = [PROMO[0].id]
while (queue.length) for (const n of adj.get(queue.pop()) || []) if (!seen.has(n)) { seen.add(n); queue.push(n) }
const connected = seen.size === ids.size
console.log(`\nconnectivity : ${seen.size}/${ids.size} reachable — ${connected ? 'OK, one subgraph' : 'FAIL, would split into Scratch'}`)
if (!connected) {
  console.error('FAIL - refusing to author a Promotable set that is not connected; it would render as')
  console.error('       loose dots in Scratch, which is exactly what decision 0036 exists to prevent.')
  process.exit(1)
}

// Every object must have an Update form, or it sits inert on the pane (docs/issues/0158).
const CMS = process.env.CMS_BASE_HTTP || 'http://localhost:8113'
const AUTH = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const FORMS = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms'
let ok = true
console.log('\nform resolution check:')
for (const t of all) {
  const url = `${CMS}${FORMS}/stix-forms/${t.group}/${t.form}-forms/${t.form}-update.html`
  const res = await fetch(url, { headers: { Authorization: AUTH } }).catch(() => null)
  const good = !!res?.ok
  if (!good) ok = false
  console.log(`   ${t.form.padEnd(16)} ${res?.status ?? 'ERR'} ${good ? 'OK' : '❌'}`)
}
if (!ok) {
  console.error('\nFAIL - at least one Update form does not resolve; refusing to author inert objects.')
  process.exit(1)
}

if (!APPLY) {
  console.log('\n(report only — pass --apply to author the incident)')
  process.exit(0)
}

fs.mkdirSync(dir, { recursive: true })
const write = (name, value) => fs.writeFileSync(path.join(dir, name), JSON.stringify(value, null, 1) + '\n')

/**
 * 🔑 **The Composer does NOT derive edges from `references` — it reads PERSISTED edge files.**
 *
 * Measured from the inline algorithm `Get_Unattached_NandE` (`im03tgckd`): it loads
 * `unattached_objs` as nodes, `unattached_relation` as SROs, and takes its edges from
 * `relation_edges` / `relation_replacement_edges` / `incident_edges`. It never looks at `references`.
 *
 * ⚠️ That is the opposite of the **Overview**, which derives every edge from `references`
 * (docs/issues/0169). Two panes, two different contracts — writing only `references`, as the first
 * version of this script did, produced **12 objects and 0 edges**: promo held just the two sightings
 * (the only promotable *types*) and everything else fell into Scratch.
 *
 * `references` is still populated on the wrappers, because the **Overview** reads it and these
 * objects can be promoted onto the incident later.
 */
const edgeId = (s, t) => `${s}-${t}`
const plainEdges = []
for (const t of PROMO) {
  if (t.id === SRO) continue // SROs are carried by relation_edges, not incident_edges
  for (const [label, list] of Object.entries(t.references)) {
    for (const target of list) {
      plainEdges.push({
        name: label.replace(/_/g, '-').replace(/-refs?$/, ''),
        type: 'embedded',
        source: t.id,
        target,
        id: edgeId(t.id, target),
      })
    }
  }
}

const sro = PROMO.find((t) => t.id === SRO)
const relationWrappers = [build(sro)]
// Two edges per SRO, exactly as the existing incident stores them: source -> SRO, SRO -> target.
const relationEdges = [
  { 'stix-id': SRO, type: 'relationship', name: sro.original.relationship_type,
    source: sro.original.source_ref, target: SRO, id: edgeId(sro.original.source_ref, SRO) },
  { 'stix-id': SRO, type: 'relationship', name: sro.original.relationship_type,
    source: SRO, target: sro.original.target_ref, id: edgeId(SRO, sro.original.target_ref) },
]
// The collapsed form used when SROs are hidden: source -> target directly.
const relationReplacementEdges = [
  { 'stix-id': SRO, type: 'relationship', name: sro.original.relationship_type,
    source: sro.original.source_ref, target: sro.original.target_ref,
    id: edgeId(sro.original.source_ref, sro.original.target_ref) },
]

write('incident.json', [INCIDENT_WRAPPER])
write('unattached_objs.json', all.filter((t) => t.id !== SRO).map(build))
/**
 * ⚠️ **The SRO file is `incident_relations.json`, NOT `unattached_relation.json`.**
 * `Get_Unattached_NandE` maps `"relations" : "/incident_relations.json"`. Both names exist in the
 * wild — `511d2ab7` has `incident_relations.json`, `f853d6f8` has `unattached_relation.json` — and
 * only the first is read. Writing the wrong one produced an SRO the Composer never loaded.
 */
write('incident_relations.json', relationWrappers)
write('unattached_relation.json', relationWrappers)
write('incident_edges.json', plainEdges)
write('relation_edges.json', relationEdges)
write('relation_replacement_edges.json', relationReplacementEdges)
for (const empty of [
  'event_refs.json', 'impact_refs.json', 'task_refs.json', 'sequence_refs.json',
  'sequence_start_refs.json', 'other_object_refs.json',
]) write(empty, [])

console.log(`\nedges authored: ${plainEdges.length} plain, ${relationEdges.length} relation, ` +
  `${relationReplacementEdges.length} replacement`)

// Register it so the incident list and the table can see it.
const mapPath = path.join(CONTEXT, 'context_map.json')
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'))
for (const key of ['incident_list', 'update_incident_list']) {
  if (!map[key].includes(INC)) map[key].push(INC)
}
fs.writeFileSync(mapPath, JSON.stringify(map, null, 1) + '\n')

console.log(`\nwrote ${dir}`)
console.log(`  incident.json          1 wrapper`)
console.log(`  unattached_objs.json   ${all.length} objects (${PROMO.length} promotable, ${SCRATCH.length} scratch)`)
console.log(`  context_map            registered in incident_list + update_incident_list`)
console.log('\n⚠️ current_incident was NOT changed — pointing it here would give Act 2 an empty Overview')
console.log('   and P0-S6 asserts the current incident has >5 nodes. Switching is a separate choice.')
console.log('⚠️ Commit this in the stix2-demo-context submodule, or the restore ritual reverts it.')
