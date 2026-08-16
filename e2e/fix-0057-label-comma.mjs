/**
 * docs/issues/0057 — rewrite the authored labels that carry a trailing comma.
 *
 * `object_marking_refs,` renders verbatim on the form panel that is on screen in Acts 2, 3 and 5.
 * Measured by `audit-0057-label-residue.mjs`: **30 authored label nodes**, one distinct string —
 * not the "14 forms" 0057 has recorded since 2026-08-05.
 *
 * 🔑 **Why 0127's sweep of 598 labels missed every one of them.** Its rule is anchored at both ends:
 *
 *     isSnake = /^[a-z0-9]+(_[a-z0-9]+)+$/
 *
 * so a trailing comma disqualifies the string, and the fixer reported success while the auditor —
 * which trims the RENDERED text — kept counting it. Two checks of the same thing, normalising
 * differently. That is the same defect class as 0100/0108/0150/0163 and as 0127's own trailing-SPACE
 * miss, which is why the residue now has its own audit rather than a widened regex.
 *
 * The rewrite follows 0127's convention mechanically — strip surrounding punctuation, split on `_`,
 * capitalise each word — so `object_marking_refs,` becomes **Object Marking Refs**. ⚠️ Deliberately
 * NOT "Object Marking References": expanding `refs` would be invented vocabulary, and the STIX names
 * belong to the domain owner.
 *
 * ⚠️ **Labels only.** The field `name` attribute is docs/issues/0144's concern; this never writes
 * `name`, so it cannot change a payload. 0057's Finding 2 (the comma in the `name`) is separate and
 * already fixed — this is the label half that survived.
 *
 *     node e2e/fix-0057-label-comma.mjs            # report
 *     node e2e/fix-0057-label-comma.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
const ROOT = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms'
const PKG = path.resolve(
  __dirname,
  '../tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms',
)
const APPLY = process.argv.includes('--apply')

const pages = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (!e.isDirectory()) continue
    if (/-(create|update)$/.test(e.name)) pages.push(path.relative(PKG, path.join(d, e.name)).replace(/\\/g, '/'))
    else walk(path.join(d, e.name))
  }
})(PKG)

const core = (s) => String(s).trim().replace(/^[^a-z0-9]+/i, '').replace(/[^a-z0-9]+$/i, '')
/** Needs fixing only when stripping punctuation reveals snake_case AND the raw string is not already clean. */
const needsFix = (s) =>
  typeof s === 'string' && /^[a-z0-9]+(_[a-z0-9]+)+$/.test(core(s)) && core(s) !== s.trim()
const titleCase = (s) =>
  core(s)
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

const findLabels = async (base) => {
  const found = []
  const seen = new Set()
  const walkNode = async (p, depth) => {
    if (depth > 20 || seen.has(p)) return
    seen.add(p)
    const r = await fetch(`${CMS}${p}.1.json`, { headers: { Authorization: auth } })
    if (!r.ok) return
    const j = await r.json()
    if (needsFix(j.label)) found.push({ path: p, label: j.label })
    for (const [k, v] of Object.entries(j)) {
      if (v && typeof v === 'object') await walkNode(`${p}/${k}`, depth + 1)
    }
  }
  await walkNode(base, 0)
  return found
}

let found = 0
let written = 0
const failures = []
for (const rel of pages) {
  const labels = await findLabels(`${ROOT}/${rel}/jcr:content`)
  if (!labels.length) continue
  found += labels.length
  if (!APPLY) {
    console.log(`~ ${rel}: ${labels.map((l) => `${JSON.stringify(l.label)} -> ${JSON.stringify(titleCase(l.label))}`).join(', ')}`)
    continue
  }
  let ok = 0
  for (const l of labels) {
    const value = titleCase(l.label)
    const res = await fetch(PROP_SERVLET, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ path: l.path, name: 'label', value }),
    })
    // ⚠️ A 200 from this servlet is NOT evidence the property landed — 0057 is the issue that
    // established that. Read it back every time.
    const back = await (await fetch(`${CMS}${l.path}.json`, { headers: { Authorization: auth } })).json().catch(() => ({}))
    if (back.label === value) ok++
    else failures.push(`${rel} ${JSON.stringify(l.label)} -> http ${res.status}, reads back ${JSON.stringify(back.label)}`)
  }
  written += ok
  console.log(`✓ ${rel}: ${ok}/${labels.length} written`)
}

console.log(`\n${APPLY ? `written ${written}/${found}` : `would rewrite ${found}`} label(s)`)
if (failures.length) {
  console.log(`\n⚠️ ${failures.length} did not land:`)
  for (const f of failures.slice(0, 20)) console.log(`   ${f}`)
  process.exit(1)
}
if (!APPLY) console.log('(report only — pass --apply)')
