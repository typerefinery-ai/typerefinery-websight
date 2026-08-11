/**
 * decision 0033 (Decided 2026-08-12, Option 1) — add the `name_field` column to icon_registry.csv
 * and populate it for the types whose `post_field0` is not a human-facing value.
 *
 * `parse.py` now reads, in order: the object's own `name` -> the registry's `name_field` -> the
 * `post_field0` fallback (docs/issues/0039). A blank `name_field` therefore changes nothing, which is
 * why this can be added to all 168 rows safely and populated for only the handful that need it.
 *
 * ⚠️ The values below are NOT invented. Each is a real property of that type in the same `stixorm`
 * the algorithms import (verified against e2e/stix-properties.json), chosen as the one a person would
 * read as the object's name:
 *
 *   email-message   from_ref (a raw STIX id)      -> subject
 *   user-account    user_id  (a bare number)      -> display_name
 *   observed-data   first_observed (a timestamp)  -> (left blank - see below)
 *   sequence        sequence_type (`event`/`task`)-> step_type
 *   impact          availability_impact (99)      -> impact_category
 *
 * ⬜ `observed-data` and `anecdote` are deliberately left BLANK. Neither has a property that reads as
 * a name — observed-data has only timestamps, counts and refs; anecdote's usable text is `value`,
 * which is a paragraph ("I clicked on the link, and my laptop screen went weird"), not a label.
 * Choosing between "leave the timestamp", "use the paragraph" and "compose one" is a presentation
 * decision, so it is left for decision 0033's Option 2 rather than guessed at here.
 *
 *     node e2e/add-registry-name-field.mjs            # report only
 *     node e2e/add-registry-name-field.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CSV = path.resolve(
  __dirname,
  '../../typerefinery/services/fastapi/generated/os-triage/common_files/icon_registry.csv',
)
const APPLY = process.argv.includes('--apply')

/** icon-row -> the property that names one of these. Keyed by the registry's `icon` column. */
const NAME_FIELD = {
  'email-message': 'subject',
  'email-message-mime': 'subject',
  'user-account': 'display_name',
  'user-account-unix': 'display_name',
  'step-terminal': 'step_type',
  'step-single': 'step_type',
  'step-parallel': 'step_type',
  'step-xor': 'step_type',
  'impact-availability': 'impact_category',
  'impact-confidentiality': 'impact_category',
  'impact-external': 'impact_category',
  'impact-integrity': 'impact_category',
  'impact-monetary': 'impact_category',
  'impact-physical': 'impact_category',
  'impact-traceability': 'impact_category',
}

const raw = fs.readFileSync(CSV, 'utf8')
const eol = raw.includes('\r\n') ? '\r\n' : '\n'
const lines = raw.split(/\r?\n/)
const header = lines[0].split(',')

if (header.includes('name_field')) {
  console.log('name_field column already present — nothing to do')
  process.exit(0)
}

// Append the column at the END of the header. Appending rather than inserting matters: `parse.py`
// reads by header name (csv.DictReader), but anything that ever reads this file positionally would
// break on an insert, and `convert_n_and_e.py` references the registry too.
const outLines = [ [...header, 'name_field'].join(',') ]
const iconIdx = header.indexOf('icon')
if (iconIdx !== 0) {
  console.error(`FAIL - expected 'icon' to be the first column, found it at ${iconIdx}`)
  process.exit(1)
}

let populated = 0
let blank = 0
for (let i = 1; i < lines.length; i++) {
  const line = lines[i]
  if (!line.trim()) { outLines.push(line); continue }
  const icon = line.split(',')[0]
  const value = NAME_FIELD[icon] || ''
  if (value) { populated++; console.log(`  ${icon.padEnd(26)} name_field = ${value}`) } else blank++
  outLines.push(`${line},${value}`)
}

console.log(`\nrows: ${populated} populated, ${blank} left blank (blank = unchanged behaviour)`)
const unmatched = Object.keys(NAME_FIELD).filter((k) => !lines.some((l) => l.split(',')[0] === k))
if (unmatched.length) console.log(`⚠️ no registry row for: ${unmatched.join(', ')}`)

if (!APPLY) {
  console.log('\ndry run - nothing written. Re-run with --apply.')
  process.exit(0)
}
fs.writeFileSync(CSV, outLines.join(eol))
console.log(`\nwritten: ${CSV}`)
console.log('Restart is not needed — each algorithm run is a fresh subprocess.')
console.log('⚠️ Frozen wrappers do NOT recompute (docs/issues/0115): existing objects need a data pass.')
