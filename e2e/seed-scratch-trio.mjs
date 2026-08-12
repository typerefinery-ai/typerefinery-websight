/**
 * Seed the Scratch Pad with the **three objects the design actually shows** — docs/issues/0138
 * phase 2, the Scratch third.
 *
 * Source of truth is [`docs/mini-app-source/image5.png`](../../docs/mini-app-source/image5.png), read
 * directly rather than paraphrased: its Scratch Pad holds exactly **Unauthorised Process** (gears),
 * **Socket Connection** (socket), **malware** (bug) — three labels, lowercase `malware` included.
 * ⚠️ The docx *text* export never names them; only the image does. Do not "correct" these from memory.
 *
 * 🔑 **Why these three types and not more identities.** `seed-scratch-objects.mjs` tops Scratch up
 * with nine identities, and it does not work: measured 2026-08-12, **7 of the 9 had been pulled into
 * relationships** and had therefore moved to Promo, and 2 were gone entirely — leaving exactly **one**
 * unreferenced object. That is not a bug, it is
 * [decision 0007](../../docs/decisions/0007-scratch-pane-semantics.md) working as designed, restated
 * by the docx itself: *"Promo holds subgraphs connected to a Promotable object. Scratch holds items
 * not yet connected to a Promotable."*
 *
 * So seeding Scratch with **identities is self-defeating** — the suite creates identity relationships
 * (P3-S6/S8), which promotes them out of Scratch and simultaneously bloats Promo. One mechanism, both
 * symptoms: Scratch drains (0051/0076) *and* Promotable grows. `process`, `network-traffic` and
 * `malware` are not types the suite relates to anything, so they stay put.
 *
 * These three were **inert until 2026-08-12** — none had an Update form, so left-selecting one opened
 * nothing. [decision 0034](../../docs/decisions/0034-what-should-the-incident-and-impact-update-forms-contain.md)
 * fixed that, which is what makes seeding them worth doing rather than misleading.
 *
 * Display fields come from `icon_registry.csv`, not invention: `icon` / `form` / `form_group` /
 * `form_family` / `head` are copied from its rows for these three types.
 *
 * ⚠️ **One deliberate divergence from the registry, and it follows CLAUDE.md's rule that the design
 * IS the specification.** The registry derives a display string per type — `CWD -> {cwd}` for
 * process, `Protocols -> {protocols}` for network-traffic — because neither type has a STIX `name`
 * property. The pane label is the wrapper's `name` (`panel.promo.js:866` → `.text((d) => d.name)`),
 * so to make the screen read as image5 does, `name` carries the **design's label** while `original`
 * carries **genuine STIX properties** for that type. Nothing is invented into `original`: a process
 * gets a real `cwd`/`command_line`/`pid`, not a fabricated `name` field the type does not have.
 *
 *     node e2e/seed-scratch-trio.mjs            # report
 *     node e2e/seed-scratch-trio.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const CONTEXT = path.resolve(
  HERE,
  '../../typerefinery/services/fastapi/generated/os-triage/context_mem',
)
const INCIDENT = 'incident--511d2ab7-c6a8-4ab9-bf11-2e027eee3eba'
const SEED = path.join(CONTEXT, INCIDENT, 'unattached_objs.json')
const APPLY = process.argv.includes('--apply')

const CREATED = '2026-02-08T01:11:57.617Z'

/**
 * Fixed ids so the seed is reproducible and reviewable in a diff, in the same style as
 * `seed-scratch-objects.mjs`. The `SCR` tail makes them recognisable as the Scratch trio.
 */
const TRIO = [
  {
    // image5: gears icon, label "Unauthorised Process"
    id: 'process--5c9a7f10-0000-4000-8000-00005c721001',
    label: 'Unauthorised Process',
    icon: 'process',
    head: 'Process',
    form: 'process',
    group: 'sco-forms',
    family: 'stix-forms',
    // Real Process properties. A process has NO `name` in STIX 2.1 — inventing one would serialise
    // under a fallback key (docs/issues/0144).
    original: {
      type: 'process',
      spec_version: '2.1',
      pid: 4212,
      cwd: 'C:\\Users\\naive\\AppData\\Local\\Temp',
      command_line: 'C:\\Users\\naive\\AppData\\Local\\Temp\\invoice_2026.exe /silent',
      is_hidden: true,
    },
  },
  {
    // image5: socket icon, label "Socket Connection"
    id: 'network-traffic--5c9a7f10-0000-4000-8000-00005c721002',
    label: 'Socket Connection',
    icon: 'network-traffic',
    head: 'Network-Traffic',
    form: 'network-traffic',
    group: 'sco-forms',
    family: 'stix-forms',
    original: {
      type: 'network-traffic',
      spec_version: '2.1',
      protocols: ['tcp'],
      src_port: 49722,
      dst_port: 443,
      is_active: false,
    },
  },
  {
    // image5: bug icon, label "malware" (lowercase in the design)
    id: 'malware--5c9a7f10-0000-4000-8000-00005c721003',
    label: 'malware',
    icon: 'malware',
    head: 'Malware',
    form: 'malware',
    group: 'sdo-forms',
    family: 'stix-forms',
    // Malware IS an SDO and does have `name`, so this one is a genuine property.
    original: {
      type: 'malware',
      spec_version: '2.1',
      created: CREATED,
      modified: CREATED,
      name: 'malware',
      is_family: false,
      malware_types: ['dropper'],
    },
  },
]

/** The frozen display wrapper. Written once at creation and never recomputed — get it right here. */
const build = (t) => ({
  id: t.id,
  type: t.original.type,
  icon: t.icon,
  name: t.label,
  heading: t.head,
  description: t.label,
  object_form: t.form,
  object_group: t.group,
  object_family: t.family,
  original: { ...t.original, id: t.id },
  // Empty, and nothing references these ids — which is exactly what keeps them in Scratch.
  references: {},
})

const seed = JSON.parse(fs.readFileSync(SEED, 'utf8'))
const existing = new Set(seed.map((o) => o.id))
const toAdd = TRIO.filter((t) => !existing.has(t.id))

console.log(`unattached_objs.json currently holds ${seed.length} objects`)
console.log(`Scratch trio to add: ${toAdd.length}`)
for (const t of toAdd) {
  console.log(`   ${t.label.padEnd(22)} ${t.original.type.padEnd(16)} form=${t.form} (${t.family}/${t.group})`)
}

// Assert the forms these objects will open actually exist, before creating objects that point at
// them. These three were inert before decision 0034 and that is the whole reason this seed is new.
const CMS = process.env.CMS_BASE_HTTP || 'http://localhost:8113'
const AUTH = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const FORMS = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms'
let allResolve = true
for (const t of TRIO) {
  const url = `${CMS}${FORMS}/${t.family}/${t.group}/${t.form}-forms/${t.form}-update.html`
  const res = await fetch(url, { headers: { Authorization: AUTH } }).catch(() => null)
  const html = res && res.ok ? await res.text() : ''
  const h1 = (/<h1>\s*([^<]+?)\s*<\/h1>/.exec(html) || [, '(none)'])[1]
  const ok = res?.ok && h1.toLowerCase().startsWith(t.form.replaceAll('-', ' '))
  if (!ok) allResolve = false
  console.log(`   form check ${t.form.padEnd(16)} ${res?.status ?? 'ERR'}  h1="${h1}" ${ok ? 'OK' : '❌'}`)
}
if (!allResolve) {
  console.error('\nFAIL - at least one Update form is missing or mislabelled. Refusing to seed objects')
  console.error('       that would sit inert on the pane (the exact reason this seed was blocked before')
  console.error('       decision 0034). See docs/issues/0158.')
  process.exit(1)
}

if (!APPLY) {
  console.log('\n(report only — pass --apply to write the seed)')
  process.exit(0)
}

const updated = seed.concat(toAdd.map(build))
fs.writeFileSync(SEED, JSON.stringify(updated, null, 1) + '\n')
console.log(`\nwrote ${updated.length} objects (was ${seed.length})`)
console.log('⚠️ Commit this in the submodule — the restore ritual git-checkouts tracked files, so an')
console.log('   uncommitted seed is reverted by the next suite teardown.')
