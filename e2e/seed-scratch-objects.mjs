/**
 * docs/issues/0051 — top the Scratch pane up so the demo survives a day of rehearsal.
 *
 * **Why this is the fix and not a workaround.** [decision 0007](../../docs/decisions/0007-scratch-pane-semantics.md)
 * settled the behaviour from GitHub #78: promotable-ness is decided by TYPE, and a Scratch object
 * that joins a promotable's sub-graph is *supposed* to move to Promo. So Create SRO consuming a
 * Scratch object is correct, and the pane emptying is a **demo-data** problem — the seed provides
 * three, and one full regression spends one.
 *
 * A Scratch object is simply an unattached object that **nothing links into a promotable's
 * sub-graph**: the three seed ones are identities with `references: {}` and no inbound reference.
 * These copies follow that shape exactly.
 *
 * ⚠️ The three existing ones are named `Runsheet identity 09:30:23` — they are **test residue that
 * was committed into the seed**. The ones added here are given plausible demo names instead, so the
 * seed reads as authored data rather than leftovers.
 *
 * Ids are fixed rather than generated, so the file is reproducible and reviewable in a diff.
 *
 *     node e2e/seed-scratch-objects.mjs            # report
 *     node e2e/seed-scratch-objects.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SEED = path.resolve(
  HERE,
  '../../typerefinery/services/fastapi/generated/os-triage/context_mem/incident--511d2ab7-c6a8-4ab9-bf11-2e027eee3eba/unattached_objs.json',
)
const APPLY = process.argv.includes('--apply')

/**
 * Plausible unattached contacts for a triage demo. Fixed ids keep the seed reproducible.
 *
 * ⚠️ **Roles and sectors are restricted to values this dataset already uses** — measured:
 * roles `user, sales, server, soc, support`, sectors `technology, agriculture`. Inventing
 * `analyst` or `threat-hunter` would have read better and been wrong: the data model belongs to
 * the application, and a value the forms' vocabulary does not offer is a value the UI cannot
 * round-trip.
 */
const PEOPLE = [
  ['identity--1c0f9a52-0d41-4a7e-9f2b-0a1b2c3d4e01', 'Priya Raman', 'soc'],
  ['identity--1c0f9a52-0d41-4a7e-9f2b-0a1b2c3d4e02', 'Tomas Weber', 'soc'],
  ['identity--1c0f9a52-0d41-4a7e-9f2b-0a1b2c3d4e03', 'Ana Belmonte', 'support'],
  ['identity--1c0f9a52-0d41-4a7e-9f2b-0a1b2c3d4e04', 'Kofi Mensah', 'support'],
  ['identity--1c0f9a52-0d41-4a7e-9f2b-0a1b2c3d4e05', 'Lena Novak', 'user'],
  ['identity--1c0f9a52-0d41-4a7e-9f2b-0a1b2c3d4e06', 'Hiroshi Tanabe', 'user'],
  ['identity--1c0f9a52-0d41-4a7e-9f2b-0a1b2c3d4e07', 'Marta Silva', 'sales'],
  ['identity--1c0f9a52-0d41-4a7e-9f2b-0a1b2c3d4e08', 'Owen Fitzgerald', 'soc'],
  ['identity--1c0f9a52-0d41-4a7e-9f2b-0a1b2c3d4e09', 'Sara Haddad', 'support'],
]

const CREATED = '2026-08-05T00:00:00.000Z'

const build = ([id, name, role]) => ({
  id,
  type: 'identity',
  icon: 'identity-individual',
  name,
  heading: 'Identity-Individual',
  description: `Name -> ${name}`,
  object_form: 'identity',
  object_group: 'sdo-forms',
  object_family: 'stix-forms',
  original: {
    type: 'identity',
    spec_version: '2.1',
    id,
    created: CREATED,
    modified: CREATED,
    name,
    roles: [role],
    identity_class: 'individual',
    sectors: ['technology'],
    extensions: {
      'extension-definition--66e2492a-bbd3-4be6-88f5-cc91a017a498': {
        extension_type: 'property-extension',
      },
    },
  },
  // Empty, and nothing references these ids — which is exactly what keeps them in Scratch.
  references: {},
})

const seed = JSON.parse(fs.readFileSync(SEED, 'utf8'))
const existing = new Set(seed.map((o) => o.id))
const toAdd = PEOPLE.filter(([id]) => !existing.has(id))

console.log(`seed currently holds ${seed.length} objects`)
console.log(`scratch-shaped identities to add: ${toAdd.length}`)
for (const [id, name, role] of toAdd) console.log(`   ${name.padEnd(18)} ${role.padEnd(20)} ${id.slice(-12)}`)

if (!APPLY) {
  console.log('\n(report only — pass --apply to write the seed)')
  process.exit(0)
}

const updated = seed.concat(toAdd.map(build))
fs.writeFileSync(SEED, JSON.stringify(updated, null, 1) + '\n')
console.log(`\nwrote ${updated.length} objects to unattached_objs.json (was ${seed.length})`)
console.log('Now: node e2e/reset-demo-context.mjs --apply, then check the Scratch count.')
