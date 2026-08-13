/**
 * Decision 0039, Option 1 — give the image5 walkthrough incident the ATTACHED objects it lacks.
 *
 * ## Why
 *
 * 0036 authored `incident--1a9e5000…` so the Composer's Promotable pane shows image5's 8-object cast
 * instead of the live incident's 59-node hairball. It succeeded, but it authored only the UNATTACHED
 * side. Measured in 0039, the consequence is that the same incident renders:
 *
 *     Act 2 Overview      0 nodes   (blank screen)
 *     Evidence List tree  empty     (no sighting to build a tree from)
 *
 * Both read the incident's ATTACHED objects, which for this incident are all `[]`. Since Act 2 runs
 * before Act 3, a presenter switching to this incident destroys an Act the audience was just shown.
 *
 * ## What this does
 *
 * Clones the attached half of the curated rich incident (`511d2ab7`) into the image5 incident under
 * FRESH ids. The rich incident's attached side is already a coherent, curated phishing narrative —
 * 18 other objects (including the two sightings the Evidence tree renders: "User Report" and "Naive
 * User"), 1 event, 1 impact, 2 tasks, 3 sequences, 2 sequence starts, and the edges that join them.
 * 27 objects + the incident itself = the 28 nodes Act 2 draws.
 *
 * ⚠️ **The unattached side is NOT touched.** `unattached_objs.json` and `unattached_relation.json`
 * are left exactly as 0036 wrote them, because 0039's acceptance test is that the Promotable pane
 * must still render its 8-node cast afterwards. This script never opens those files.
 *
 * ## Id minting
 *
 * Every id is re-minted as `<type>--7e5c0000-0000-4000-8000-<12 hex>` — a distinctive stem, so the
 * clones are always identifiable, with a **12-hex tail**. ⚠️ That width is load-bearing: an earlier
 * authoring pass used 10-hex tails, `derive_references` validates the STIX id format, and it
 * silently matched nothing — which was then misread as "the Composer connects only via SROs"
 * (retracted in 0036). Ids are minted deterministically from a sorted list, so re-running produces
 * identical output rather than a second copy.
 *
 *     node e2e/author-image5-attached.mjs [--apply]
 *
 * Dry-run by default: prints what it would write and changes nothing.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CTX = path.join(
  __dirname, '..', '..', 'typerefinery', 'services', 'fastapi', 'generated', 'os-triage', 'context_mem',
)
const RICH = path.join(CTX, 'incident--511d2ab7-c6a8-4ab9-bf11-2e027eee3eba')
const IMG5 = path.join(CTX, 'incident--1a9e5000-0000-4000-8000-00001a9e5000')
const IMG5_ID = 'incident--1a9e5000-0000-4000-8000-00001a9e5000'
const RICH_ID = 'incident--511d2ab7-c6a8-4ab9-bf11-2e027eee3eba'
const APPLY = process.argv.includes('--apply')

// The attached half. unattached_objs.json / unattached_relation.json are deliberately absent.
const OBJECT_FILES = [
  'other_object_refs.json', 'event_refs.json', 'impact_refs.json',
  'task_refs.json', 'sequence_refs.json', 'sequence_start_refs.json',
]
const EDGE_FILES = ['incident_edges.json', 'relation_edges.json', 'relation_replacement_edges.json']
const OTHER_FILES = ['incident_relations.json']

// ⚠️ MERGE, never replace, for these three. They are NOT purely attached-side: 0036 used them for
// the UNATTACHED side's SROs too. A first run of this script overwrote them and destroyed the
// `derived-from` relationship — which is one of image5's 8 cast members, a labelled node in the
// mockup — taking the Promotable pane from 8 nodes to 7 and pushing a node into Scratch (4 -> 5).
// That failed 0039's own acceptance test. Merging keeps 0036's entries and adds the cloned ones.
// ⚠️ MERGE EVERY array file, not a hand-picked subset. The first attempt merged only the three
// files I had *noticed* were shared, and `incident_edges.json` slipped through — all 7 of its
// entries turn out to be the Promotable pane's embedded edges (the "7 embedded + 2 relationship"
// 0036 records). Picking which files are safe to overwrite is exactly the judgement that was wrong
// the first time, so the rule is now: merge everything, dedupe by id. The object-ref files are
// empty on this incident, so merging is identical to replacing for them, and it stays correct if
// 0036's side ever gains attached objects of its own.
const MERGE_FILES = new Set([...OBJECT_FILES, ...EDGE_FILES, ...OTHER_FILES])
const keyOf = (o) => String(o.id || o['stix-id'] || JSON.stringify(o))

const log = (...a) => console.log(...a)

// ⚠️ The type group must allow single dashes (`email-addr`, `x-oca-behavior`) but NEVER a double
// dash. A naive `[a-z][a-z0-9-]*` does allow `--`, and the edge files contain COMPOSITE ids of the
// form `<idA>-<idB>`: the greedy type group then swallowed idA whole and collapsed the pair into a
// single new id, silently losing idA's mapping in that context. Requiring `[a-z0-9]+` after every
// single dash makes `--` unmatchable inside the type, so each id in a composite is remapped on its
// own and the composite rebuilds itself correctly from its remapped halves.
const ID_RE =
  /\b([a-z][a-z0-9]*(?:-[a-z0-9]+)*)--([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\b/g

log(`source (rich) : ${RICH}`)
log(`target (image5): ${IMG5}`)
log(`mode          : ${APPLY ? 'APPLY' : 'dry run (pass --apply to write)'}\n`)

// ---- 1. Read the source files
const src = {}
for (const f of [...OBJECT_FILES, ...EDGE_FILES, ...OTHER_FILES]) {
  const p = path.join(RICH, f)
  if (!fs.existsSync(p)) { log(`  ⚠️ source missing: ${f}`); continue }
  src[f] = fs.readFileSync(p, 'utf8')
}

// ---- 2. Collect every id mentioned anywhere in the cloned material
const seen = new Set()
for (const text of Object.values(src)) {
  for (const m of text.matchAll(ID_RE)) seen.add(m[0])
}
seen.delete(RICH_ID) // handled explicitly below
const ordered = [...seen].sort()
log(`ids found in the attached half: ${ordered.length}`)

// ---- 3. Mint deterministic replacements
const hex12 = (n) => n.toString(16).padStart(12, '0')
const remap = new Map([[RICH_ID, IMG5_ID]])
ordered.forEach((oldId, i) => {
  const type = oldId.split('--')[0]
  remap.set(oldId, `${type}--7e5c0000-0000-4000-8000-${hex12(i + 1)}`)
})
log(`ids remapped                  : ${remap.size} (incl. the incident itself)\n`)

// Show a few so the mapping is reviewable rather than opaque.
;[...remap.entries()].slice(0, 4).forEach(([a, b]) => log(`   ${a}\n     -> ${b}`))
log('   …')

const rewrite = (text) => text.replace(ID_RE, (whole) => remap.get(whole) || whole)

// ---- 4. Build the output, validating as we go
const out = {}
for (const [f, text] of Object.entries(src)) {
  const rewritten = rewrite(text)
  let parsed
  try { parsed = JSON.parse(rewritten) } catch (e) { throw new Error(`${f}: rewritten JSON is invalid — ${e.message}`) }
  // ⚠️ Nothing may still point at the source incident's id space.
  const leftovers = [...rewritten.matchAll(ID_RE)].filter((m) => !/7e5c0000|1a9e5000/.test(m[0]))
  if (leftovers.length) {
    log(`  ⚠️ ${f}: ${leftovers.length} id(s) not remapped, e.g. ${leftovers[0][0]}`)
  }

  if (MERGE_FILES.has(f) && Array.isArray(parsed)) {
    const existingPath = path.join(IMG5, f)
    const existing = fs.existsSync(existingPath) ? JSON.parse(fs.readFileSync(existingPath, 'utf8')) : []
    const seenKeys = new Set(existing.map(keyOf))
    const added = parsed.filter((o) => !seenKeys.has(keyOf(o)))
    const merged = [...existing, ...added]
    log(`  ${f}: MERGED — kept ${existing.length} existing (0036's cast), added ${added.length}`)
    out[f] = { text: JSON.stringify(merged, null, 1), count: merged.length }
    continue
  }
  out[f] = { text: rewritten, count: Array.isArray(parsed) ? parsed.length : 1 }
}

// ---- 5. The incident wrapper itself must list the new refs
const incidentPath = path.join(IMG5, 'incident.json')
const incident = JSON.parse(fs.readFileSync(incidentPath, 'utf8'))
const idsOf = (f) => (out[f] ? JSON.parse(out[f].text).map((o) => o.id) : [])
const refFields = {
  other_object_refs: idsOf('other_object_refs.json'),
  event_refs: idsOf('event_refs.json'),
  impact_refs: idsOf('impact_refs.json'),
  task_refs: idsOf('task_refs.json'),
  sequence_refs: idsOf('sequence_refs.json'),
  sequence_start_refs: idsOf('sequence_start_refs.json'),
}
for (const [k, v] of Object.entries(refFields)) {
  incident[0].original[k] = v
  log(`incident.original.${k.padEnd(20)} = ${v.length} ref(s)`)
}

// ---- 5b. The STIX Incident property-extension — this is where the refs REALLY live
//
// ⚠️ Without this, Act 2 renders 0 nodes and the reason is invisible on screen. The overview
// algorithm does:
//
//     incident_ext = incident["extensions"]["extension-definition--ef765651-…"]
//
// and 0036's authored incident has no `extensions` key at all, so the algorithm dies with
// `KeyError: 'extensions'` — which the Flow runtime then returns as **HTTP 200 with error:true**
// (docs/issues/0167), so the widget sees a "successful" response carrying no graph and draws
// nothing. The blank Overview was never missing data; it was a crash reported as success.
//
// Top-level `original.other_object_refs` alone is NOT enough: the extension is the authoritative
// STIX location and the algorithm reads only the extension.
const EXT_DEF = 'extension-definition--ef765651-680c-498d-9894-99799f2fa126'
const richIncident = JSON.parse(fs.readFileSync(path.join(RICH, 'incident.json'), 'utf8'))[0]
const richExt = richIncident.original.extensions[EXT_DEF]
incident[0].original.extensions = {
  [EXT_DEF]: {
    extension_type: richExt.extension_type,
    // Act 1's table reads investigation_status as the Status column, so this also gives the
    // image5 row a real Status instead of a blank cell.
    investigation_status: richExt.investigation_status,
    incident_types: [...richExt.incident_types],
    ...refFields,
  },
}
log(`incident.original.extensions[${EXT_DEF.slice(0, 28)}…] written:`)
log(`   investigation_status = ${richExt.investigation_status}`)
log(`   incident_types       = ${JSON.stringify(richExt.incident_types)}`)
for (const [k, v] of Object.entries(refFields)) log(`   ${k.padEnd(20)} = ${v.length} ref(s)`)

log('\nfiles to write:')
for (const [f, v] of Object.entries(out)) log(`  ${f.padEnd(32)} ${String(v.count).padStart(3)} entr(y|ies)`)
log(`  incident.json                    refs updated`)
log('\nNOT touched (0036\'s Promotable/Scratch cast): unattached_objs.json, unattached_relation.json')

if (!APPLY) { log('\nDry run — nothing written. Re-run with --apply.'); process.exit(0) }

for (const [f, v] of Object.entries(out)) fs.writeFileSync(path.join(IMG5, f), v.text)
fs.writeFileSync(incidentPath, JSON.stringify(incident, null, 1))
log('\n✅ written.')
log('⚠️ Commit these in the stix2-demo-context submodule NOW — reset-demo-data.mjs purges untracked')
log('   incident data, and an uncommitted authoring pass is one reset away from being lost (0138).')
