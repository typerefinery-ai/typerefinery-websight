/**
 * docs/issues/0085 — the three data steps, in the file's own mandated order:
 *
 *  1. DEDUPE the icon_registry.csv header (cols 27-29 and 30-32 zero-indexed both read
 *     post_field5|prior_string6|post_field6; DictReader last-wins so the SECOND triplet
 *     shadows the first) and REALIGN the split rows. Surveyed before writing:
 *       - first-triplet (currently SHADOWED, real data): attack-action
 *         (asset_refs|Effects ->|effect_refs), step-terminal/-xor/-parallel/-single
 *         (next_step_refs — sequence-step edge data invisible to every reader today)
 *       - second-triplet: attack-software (same effect data — already effective, kept);
 *         tool/url/oca-tool-hvt-ext/oca-user-account carry MISALIGNED next_step_refs
 *         (a url has no next steps — dropped as the 0085 worklist's "misaligned" call)
 *     Merge rule: per row, surviving triplet = first if non-empty else second (no row
 *     has both non-empty — verified). Consumed fields (name_field, post_field0,
 *     form_family) are asserted byte-identical before/after.
 *
 *  2. Correct 7 form_family rows to authored reality (0133 Option 1 step 1):
 *     anecdote, event, task, step-terminal/-single/-parallel/-xor: os-threat-forms →
 *     stix-forms. The 7 impact-* rows STAY os-threat-forms (authored there, truthful).
 *
 *  3. Correct the 2 self-conflicting stored wrappers in
 *     context_mem/incident--511d2ab7…/unattached_objs.json:
 *     anecdote--e1298bc0… and event--00926155… os-threat-forms → stix-forms
 *     (matching their own copies in other_object_refs.json / event_refs.json).
 *
 * Gate (run after --apply): audit-object-family.mjs → 0 conflicts;
 * audit-form-coverage.mjs on both payloads → 0 404s.
 *
 *     node e2e/fix-0085-registry-and-wrappers.mjs            # report
 *     node e2e/fix-0085-registry-and-wrappers.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const CSV = path.join(WORKSPACE, 'typerefinery/services/fastapi/generated/os-triage/common_files/icon_registry.csv')
const WRAPPERS = path.join(
  WORKSPACE,
  'typerefinery/services/fastapi/generated/os-triage/context_mem/incident--511d2ab7-c6a8-4ab9-bf11-2e027eee3eba/unattached_objs.json'
)
const APPLY = process.argv.includes('--apply')

// ---- step 1: header dedupe + row realignment -------------------------------------------
const raw = fs.readFileSync(CSV, 'utf8')
const eol = raw.includes('\r\n') ? '\r\n' : '\n'
const lines = raw.split(/\r?\n/)
const header = lines[0].split(',')
if (!(header[27] === 'post_field5' && header[30] === 'post_field5' && header[33] === 'name_field')) {
  if (header.length === 31 && header[27] === 'post_field5' && header[30] === 'name_field') {
    console.log('step 1: header already deduped (31 columns) — skipping')
  } else {
    throw new Error(`unexpected header layout (${header.length} cols) — re-survey before editing`)
  }
}

const dedupeNeeded = header.length === 34
const FORM_FAMILY_COL = header.indexOf('form_family')
const dictReaderView = (cols) => ({
  // what csv.DictReader sees today (last occurrence wins)
  name_field: cols[33] ?? cols[30],
  post_field0: cols[header.indexOf('post_field0')],
  form_family: cols[FORM_FAMILY_COL],
  icon: cols[0],
})

const before = lines.slice(1).filter(Boolean).map((l) => dictReaderView(l.split(',')))

let outLines = lines
if (dedupeNeeded) {
  outLines = lines.filter(Boolean).map((line, i) => {
    const c = line.split(',')
    if (i === 0) {
      return [...c.slice(0, 30), c[33]].join(',') // drop the duplicate triplet from the header
    }
    const first = c.slice(27, 30)
    const second = c.slice(30, 33)
    const firstHas = first.some((v) => v.trim() !== '')
    const secondHas = second.some((v) => v.trim() !== '')
    if (firstHas && secondHas) throw new Error(`row ${c[0]} has BOTH triplets populated — needs a human`)
    // Misaligned second-triplet values: next_step_refs on non-step rows is junk from a
    // past row shift (the 0085 worklist's "url carrying misaligned next_step_refs").
    const isStepRow = c[0].startsWith('step-')
    const surviving = firstHas ? first : (secondHas && !isStepRow && second[0] === 'next_step_refs') ? ['', '', ''] : second
    if (secondHas && !firstHas && surviving[0] === '') {
      console.log(`  [realign] ${c[0]}: dropped misaligned second-triplet [${second.join('|')}]`)
    } else if (firstHas) {
      console.log(`  [realign] ${c[0]}: surfaced shadowed first-triplet [${first.join('|')}]`)
    }
    return [...c.slice(0, 27), ...surviving, c[33]].join(',')
  })
  console.log(`step 1: header 34 -> 31 columns; ${outLines.length - 1} data rows realigned`)
}

// ---- step 2: the 7 form_family corrections ---------------------------------------------
const FAMILY_FIX = new Set(['anecdote', 'event', 'task', 'step-terminal', 'step-single', 'step-parallel', 'step-xor'])
let familyFixed = 0
outLines = outLines.map((line, i) => {
  if (i === 0 || !line) return line
  const c = line.split(',')
  if (FAMILY_FIX.has(c[0]) && c[FORM_FAMILY_COL] === 'os-threat-forms') {
    c[FORM_FAMILY_COL] = 'stix-forms'
    familyFixed++
    console.log(`  [family]  ${c[0]}: os-threat-forms -> stix-forms`)
  }
  return c.join(',')
})
console.log(`step 2: ${familyFixed} form_family rows corrected (impact-* untouched by design)`)

// verify consumed fields survived steps 1+2 (form_family changes only where intended)
const after = outLines.slice(1).filter(Boolean).map((l) => {
  const c = l.split(',')
  return { name_field: c[30], post_field0: c[header.indexOf('post_field0')], form_family: c[FORM_FAMILY_COL], icon: c[0] }
})
let drift = 0
for (let i = 0; i < before.length; i++) {
  const b = before[i], a = after[i]
  if (b.icon !== a.icon || b.name_field !== a.name_field || b.post_field0 !== a.post_field0) {
    console.log(`  🔴 consumed-field drift on ${b.icon}: name_field ${b.name_field}->${a.name_field} post_field0 ${b.post_field0}->${a.post_field0}`)
    drift++
  }
  if (b.form_family !== a.form_family && !FAMILY_FIX.has(b.icon)) {
    console.log(`  🔴 unintended form_family change on ${b.icon}`)
    drift++
  }
}
console.log(`consumed-field verification: ${drift === 0 ? 'clean' : drift + ' DRIFTS — do not apply'}`)
if (drift) process.exit(1)

// ---- step 3: the 2 stored wrapper corrections ------------------------------------------
// ⚠️ SURGICAL STRING EDIT, not parse/re-stringify: the file is pretty-printed and a
// stringify round-trip flattened its 1446 lines into one (fixed in stix2-demo-context
// 8420f73 — the 0083-class reformat this workspace explicitly avoids).
const wrapperRaw = fs.readFileSync(WRAPPERS, 'utf8')
const wrapperHits = (wrapperRaw.match(/"object_family": "os-threat-forms"/g) || []).length
console.log(`step 3: ${wrapperHits} stored os-threat-forms wrapper value(s) in unattached_objs.json ${APPLY ? '(will correct)' : '(pending)'}`)
if (wrapperHits > 2) {
  console.log('  🔴 more than the 2 known conflicting wrappers — survey before applying')
  process.exit(1)
}

if (!APPLY) {
  console.log('\ndry run — nothing written. Re-run with --apply, then run the audit pair.')
  process.exit(0)
}

fs.writeFileSync(CSV, outLines.join(eol) + (raw.endsWith('\n') || raw.endsWith('\r\n') ? eol : ''))
if (wrapperHits > 0) {
  fs.writeFileSync(WRAPPERS, wrapperRaw.replaceAll('"object_family": "os-threat-forms"', '"object_family": "stix-forms"'))
}
console.log('\nwritten. Gate: node e2e/audit-object-family.mjs (0 conflicts) + audit-form-coverage on both payloads (0 404s).')
