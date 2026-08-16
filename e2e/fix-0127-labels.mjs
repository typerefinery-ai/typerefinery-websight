/**
 * docs/issues/0127 — make the form field labels human-readable.
 *
 * Measured 2026-08-16 (`audit-0127-snake-case-labels.mjs`): **458 of 902 distinct rendered labels —
 * 51% — are raw snake_case**, across 95 distinct strings and all 30 form panels. 0127 recorded
 * "7 of 36", which was a narrower slice; the panel a viewer actually reads is half plumbing.
 *
 * It matters more than it sounds: this panel is on screen in Acts 2, 3 AND 5, so the gap is paid
 * three times per demo, and `spec_version` sits directly beside a correctly-labelled
 * "External References" on the same form — which is what makes it read as unfinished rather than as
 * a house style.
 *
 * The convention is therefore already set by the build itself: **Title Case with spaces**. This
 * follows it mechanically — split on `_`, capitalise each word — rather than inventing wording.
 *
 * ⚠️ Strictly mechanical, deliberately. `created_by_ref` becomes "Created By Ref", not
 * "Created By Reference": expanding abbreviations (`ref`/`refs`/`id`) or uppercasing acronyms would be
 * invented vocabulary, and the STIX names are the domain owner's. If nicer wording is wanted, that is
 * a follow-up with the owner, not a regex.
 *
 * ⚠️ Labels only. The field `name` attribute is a different concern and belongs to docs/issues/0144
 * (does the name match the STIX class) — this never touches `name`, so it cannot change a payload.
 *
 *     node e2e/fix-0127-labels.mjs identity-update            # report one form
 *     node e2e/fix-0127-labels.mjs identity-update --apply
 *     node e2e/fix-0127-labels.mjs --all                      # report every form
 *     node e2e/fix-0127-labels.mjs --all --apply
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
const ALL = process.argv.includes('--all')
const ONE = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null

const pages = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (!e.isDirectory()) continue
    if (/-(create|update)$/.test(e.name)) pages.push(path.relative(PKG, path.join(d, e.name)).replace(/\\/g, '/'))
    else walk(path.join(d, e.name))
  }
})(PKG)

const targets = ONE ? pages.filter((p) => p.endsWith('/' + ONE) || p === ONE) : ALL ? pages : []
if (!targets.length) {
  console.log(`specify a form or --all. known form panels: ${pages.length}`)
  process.exit(1)
}

// ⚠️ TRIM before testing. The first sweep did not, and three labels authored with a trailing space
// (`label="display_name "`, `"content_disposition "`, `"source_ref "`) failed the regex and were
// skipped — while `audit-0127-snake-case-labels.mjs`, which trims the RENDERED text, counted them.
// The two measurements disagreed by exactly those 6 rendered labels, and the gap got written up as
// "they are not `label` nodes in the page tree", which was wrong. Same class as every other miss
// today: two checks of the same thing that normalise differently.
const isSnake = (s) => typeof s === 'string' && /^[a-z0-9]+(_[a-z0-9]+)+$/.test(s.trim())
const titleCase = (s) =>
  s
    .trim()
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
    if (isSnake(j.label)) found.push({ path: p, label: j.label })
    for (const [k, v] of Object.entries(j)) {
      if (v && typeof v === 'object') await walkNode(`${p}/${k}`, depth + 1)
    }
  }
  await walkNode(base, 0)
  return found
}

let totalFound = 0
let totalWritten = 0
const failures = []
for (const rel of targets) {
  const labels = await findLabels(`${ROOT}/${rel}/jcr:content`)
  totalFound += labels.length
  if (!APPLY) {
    console.log(`~ ${rel}: ${labels.length} snake_case label(s)` + (labels.length ? ` — e.g. ${labels.slice(0, 4).map((l) => `${l.label} -> ${titleCase(l.label)}`).join(', ')}` : ''))
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
    // A 200 from the servlet is not evidence the property landed (docs/issues/0057) — read it back.
    const back = await (await fetch(`${CMS}${l.path}.json`, { headers: { Authorization: auth } })).json().catch(() => ({}))
    if (back.label === value) ok++
    else failures.push(`${rel} ${l.label} -> http ${res.status}, reads back ${JSON.stringify(back.label)}`)
  }
  totalWritten += ok
  console.log(`✓ ${rel}: ${ok}/${labels.length} written`)
}

console.log(`\n${APPLY ? `written ${totalWritten}/${totalFound}` : `would rewrite ${totalFound}`} label(s) across ${targets.length} form(s)`)
if (failures.length) {
  console.log(`\n⚠️ ${failures.length} did not land:`)
  for (const f of failures.slice(0, 20)) console.log(`   ${f}`)
  process.exit(1)
}
if (!APPLY) console.log('(report only — pass --apply)')
