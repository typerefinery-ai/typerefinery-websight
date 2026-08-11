/**
 * docs/issues/0138 phase 1 — make the two curated incidents distinguishable on sight.
 *
 * Decision 0027 (Decided, Option 1) makes the tracked content the demo dataset. Today both tracked
 * incidents are named exactly `"potential phishing"`, differing only by UUID (run-log observation
 * 20), so Act 1's opening table shows the same string twice and a presenter cannot tell which one
 * the demo is on. 0138 records this as "zero-code, unblocks presenters immediately".
 *
 * The new names are constrained to things that are TRUE of the data, verified 2026-08-12:
 *   - both are the image5 Potential-Phishing-Email narrative (decision 0027's content spec):
 *     same email-addr, url, email-message, user-account and anecdote ids, both carrying an
 *     `event`/`task` named "Potential Phishing Email" and incident_types
 *     ["dissemination-phishing-emails"]
 *   - the victim identity is `Naive Smith` (`original.name`; the display wrapper says "Naive")
 *   - f853d6f8 was created 2026-02-08T00:51:43Z, 511d2ab7 about 20 minutes later at 01:11:57Z
 *   - 511d2ab7 is `current_incident` in context_map.json
 *
 * So the only invented text is the disambiguator, and it states a fact (which capture came first).
 * No claim is made about severity, status or outcome — none of that is stored (docs/issues/0116).
 *
 * ⚠️ Each stored object is a wrapper whose `name` is FROZEN at creation and never recomputed
 * (docs/issues/0115), so the name must be written in BOTH places or the table and the graph will
 * disagree: the wrapper's `name`, and `original.name` (the real STIX field).
 *
 *     node e2e/rename-curated-incidents.mjs            # report only
 *     node e2e/rename-curated-incidents.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CTX = path.resolve(__dirname, '../../typerefinery/services/fastapi/generated/os-triage/context_mem')
const APPLY = process.argv.includes('--apply')

const RENAMES = [
  {
    dir: 'incident--511d2ab7-c6a8-4ab9-bf11-2e027eee3eba',
    from: 'potential phishing',
    to: 'Potential phishing email - Naive Smith',
    why: 'the demo incident (current_incident), created 01:11:57Z',
  },
  {
    dir: 'incident--f853d6f8-a668-4272-b007-55eff8087ec6',
    from: 'potential phishing',
    to: 'Potential phishing email - Naive Smith (earlier capture)',
    why: 'created 00:51:43Z, ~20 minutes before the other',
  },
]

let changed = 0
for (const r of RENAMES) {
  const file = path.join(CTX, r.dir, 'incident.json')
  if (!fs.existsSync(file)) {
    console.error(`FAIL - ${file} not found`)
    process.exit(1)
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  // The store wraps the list under "0" in some files and is a bare array in others - handle both
  // rather than assuming, because guessing the shape is how a rename silently writes nothing.
  const list = Array.isArray(raw) ? raw : raw['0']
  if (!Array.isArray(list) || !list.length) {
    console.error(`FAIL - unexpected shape in ${file}`)
    process.exit(1)
  }
  const w = list[0]
  console.log(`${r.dir}`)
  console.log(`  reason        : ${r.why}`)
  console.log(`  wrapper.name  : ${JSON.stringify(w.name)}`)
  console.log(`  original.name : ${JSON.stringify(w.original?.name)}`)

  if (w.name === r.to && w.original?.name === r.to) {
    console.log('  already applied\n')
    continue
  }
  if (w.name !== r.from || w.original?.name !== r.from) {
    console.error(`  FAIL - expected both names to be ${JSON.stringify(r.from)}; refusing to clobber a later edit\n`)
    process.exit(1)
  }
  console.log(`  ${APPLY ? '->' : 'would ->'} ${JSON.stringify(r.to)} (both places)\n`)
  if (APPLY) {
    w.name = r.to
    w.original.name = r.to
    fs.writeFileSync(file, JSON.stringify(raw, null, 1))
    changed++
  }
}

if (!APPLY) {
  console.log('dry run - nothing written. Re-run with --apply.')
} else {
  console.log(`wrote ${changed} incident.json file(s).`)
  console.log('Verify: curl http://localhost:8111/viz-data/table-all-incidents-shaped')
  console.log('Then commit in the stix2-demo-context submodule and bump the parent pointer.')
}
