/**
 * docs/issues/0138 phase 2 / decision 0027 (DECIDED) — rename the junk-named demo fixtures to
 * analyst-plausible names.
 *
 * Why this is a rename and not a prune: 0027 Option 1 says *"rename the ~15 junk-named fixtures to
 * analyst-plausible names"*. It is decided intent, so this implements it rather than re-opening it.
 *
 * Why it is safe to touch the SCO values: `email-addr` and `user-account` ids are UUIDv5 derived from
 * their ID-contributing properties, so renaming a value invalidates the id — unless the id is
 * recomputed. `probe-0138-stix-scoid.mjs` PROVES the computation by reproducing 6 ids the platform
 * itself wrote, so the recomputation here is verified, not hopeful.
 *
 * What it does, in order:
 *   1. text-substitutes every joke string across every .json in the context_mem submodule
 *      (longest first, so "Strange Billy" is consumed before "Strange"),
 *   2. recomputes the id of every SCO whose ID-contributing property changed,
 *   3. swaps old ids for new ids everywhere,
 *   4. verifies: no joke strings remain, no old ids remain, every file still parses.
 *
 * ⚠️ The wrapper `name`/`description` are rewritten by the same text pass on purpose. docs/issues/0115
 * established those display micro-summaries are FROZEN at creation, so changing `original.display_name`
 * alone would leave the panes rendering the old text.
 *
 * ⚠️ This edits the `stix2-demo-context` submodule, which `reset-demo-data.mjs` restores from git — so
 * the commit after this IS the new restore point for every future gate. Dry run by default.
 *
 *     node e2e/fix-0138-curate-demo-names.mjs            # report what would change
 *     node e2e/fix-0138-curate-demo-names.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CM = path.resolve(__dirname, '../../typerefinery/services/fastapi/generated/os-triage/context_mem')
const APPLY = process.argv.includes('--apply')

// Ordered longest-first. Emails before bare names, because "strange@mycompany.com" contains "strange".
const RENAMES = [
  ['sbilly@example.com', 'sbell@example.com'],
  ['wwhilly@example.com', 'whall@example.com'],
  ['strange@mycompany.com', 'sgray@mycompany.com'],
  ['dumbo@mycompany.com', 'dmoore@mycompany.com'],
  ['Whooping Whilly', 'Wesley Hall'],
  ['Whooping Willy', 'Wesley Hall'],
  ['Strange Billy', 'Sarah Bell'],
  ['Strange Guy', 'Stephen Gray'],
  ['strange guy', 'Stephen Gray'],
  ['dumbo guy', 'Diana Moore'],
  ['Whooping', 'Wesley Hall'],
  ['Strange', 'Sarah Bell'],
  ['Dumbo', 'Diana Moore'],
  ['sbilly', 'sbell'],
  ['wwhilly', 'whall'],
]
const JOKE = /dumbo|whooping|strange|whilly|billy/i

// ---- STIX 2.1 deterministic SCO id (proven in probe-0138-stix-scoid.mjs) -------------------------
const NS = '00abedb4-aa42-466c-9c01-fed23315a9b7'
const jcs = (v) => {
  if (v === null || typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') return JSON.stringify(v)
  if (Array.isArray(v)) return `[${v.map(jcs).join(',')}]`
  return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${jcs(v[k])}`).join(',')}}`
}
const uuid5 = (ns, name) => {
  const h = crypto.createHash('sha1').update(Buffer.concat([Buffer.from(ns.replace(/-/g, ''), 'hex'), Buffer.from(name, 'utf8')])).digest()
  const b = Buffer.from(h.subarray(0, 16))
  b[6] = (b[6] & 0x0f) | 0x50
  b[8] = (b[8] & 0x3f) | 0x80
  const s = b.toString('hex')
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`
}
const CONTRIB = { 'email-addr': ['value'], 'user-account': ['account_type', 'user_id', 'account_login'] }
const scoId = (o) => {
  const props = CONTRIB[o.type]
  if (!props) return null
  const c = {}
  for (const p of props) if (o[p] !== undefined) c[p] = o[p]
  return Object.keys(c).length ? `${o.type}--${uuid5(NS, jcs(c))}` : null
}

const files = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === '.git') continue
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name.endsWith('.json')) files.push(p)
  }
})(CM)
console.log(`context_mem: ${files.length} json file(s)`)

// ---- pass 1: text substitution -------------------------------------------------------------------
const before = new Map()
let hits = 0
const touched = []
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8')
  before.set(f, text)
  let next = text
  for (const [from, to] of RENAMES) next = next.split(from).join(to)
  if (next !== text) {
    touched.push(f)
    hits += 1
  }
}
console.log(`files containing a joke string: ${touched.length}`)

// ---- pass 2: which SCO ids change? ---------------------------------------------------------------
// Recompute from the RENAMED objects, and pair each new id with the old one.
// ⚠️ Only ids that were DETERMINISTIC TO BEGIN WITH may be recomputed. The first version of this
// pass recomputed every SCO id and swapped any that differed — which proposed rewriting objects that
// have nothing to do with the joke names, because the curated fixtures carry hand-assigned sequential
// ids (`email-addr--7e5c0000-0000-4000-8000-000000000008`) that no formula will ever reproduce. One
// of those swaps pointed at `email-addr--4722424c-…`, an id that ALREADY EXISTS (naive@example.com) —
// it would have collided two objects into one. The dry run printed it, which is the only reason it
// was caught.
//
// The guard: compute the id from the object as it is NOW. If that does not equal its current id, the
// object was never deterministically identified and must be left alone. Only when the OLD object's
// computed id matches its stored id has the platform derived it, and only then does a rename oblige
// us to re-derive it.
const idSwaps = new Map()
for (const f of files) {
  const originalText = before.get(f)
  let parsedOld
  try {
    parsedOld = JSON.parse(originalText)
  } catch {
    continue
  }
  const visit = (node) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) return node.forEach(visit)
    const o = node.original && typeof node.original === 'object' ? node.original : node
    if (o.type && CONTRIB[o.type] && typeof o.id === 'string') {
      const derivedNow = scoId(o)
      if (derivedNow === o.id) {
        // deterministic today -> re-derive from the renamed object
        const renamed = JSON.parse(RENAMES.reduce((t, [from, to]) => t.split(from).join(to), JSON.stringify(o)))
        const derivedAfter = scoId(renamed)
        if (derivedAfter && derivedAfter !== o.id) idSwaps.set(o.id, derivedAfter)
      }
    }
    Object.values(node).forEach(visit)
  }
  visit(parsedOld)
}
console.log(`SCO ids whose contributing properties changed: ${idSwaps.size}`)
for (const [oldId, newId] of idSwaps) console.log(`   ${oldId}\n-> ${newId}`)

if (!APPLY) {
  console.log('\nRenames that would be applied:')
  for (const [from, to] of RENAMES) console.log(`   ${from.padEnd(24)} -> ${to}`)
  console.log('\n(report only — pass --apply)')
  process.exit(0)
}

// ---- write ---------------------------------------------------------------------------------------
let written = 0
for (const f of files) {
  let text = before.get(f)
  const original = text
  for (const [from, to] of RENAMES) text = text.split(from).join(to)
  for (const [oldId, newId] of idSwaps) text = text.split(oldId).join(newId)
  if (text !== original) {
    JSON.parse(text) // never write a file this pass has broken
    fs.writeFileSync(f, text)
    written++
  }
}
console.log(`\nwritten: ${written} file(s)`)

// ---- verify --------------------------------------------------------------------------------------
let jokeLeft = 0
let oldIdsLeft = 0
let unparsable = 0
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8')
  try {
    JSON.parse(text)
  } catch {
    unparsable++
    console.log(`   ❌ unparsable: ${path.relative(CM, f)}`)
  }
  for (const m of text.matchAll(/"(name|display_name|value|account_login)"\s*:\s*"([^"]*)"/g)) {
    if (JOKE.test(m[2])) {
      jokeLeft++
      console.log(`   ⚠️ joke string remains: ${m[1]}="${m[2]}" in ${path.relative(CM, f)}`)
    }
  }
  for (const oldId of idSwaps.keys()) if (text.includes(oldId)) oldIdsLeft++
}
console.log(`\nverification: joke strings left ${jokeLeft} · old ids left ${oldIdsLeft} · unparsable ${unparsable}`)
console.log(
  jokeLeft === 0 && oldIdsLeft === 0 && unparsable === 0
    ? '✅ clean. NEXT: run the Act 2/3/5 walks, then COMMIT IN THE SUBMODULE — reset-demo-data.mjs\n   restores from git, so the commit is the new restore point.'
    : '❌ not clean — do not commit; `git checkout .` in the submodule reverses everything.',
)
process.exit(jokeLeft === 0 && oldIdsLeft === 0 && unparsable === 0 ? 0 : 1)
