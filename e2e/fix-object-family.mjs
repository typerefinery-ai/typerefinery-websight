/**
 * docs/issues/0049 — left-select 404s for os-threat typed objects.
 *
 * Root cause (measured 2026-08-04): the form family recorded against these objects names a folder
 * that does not exist in the authored tree. It has been wrong in two different ways:
 *
 *   stored context_mem  -> "os-threat-forms"   (written by an older classifier)
 *   current classifier  -> "extension-forms"   (convert_n_and_e.py)
 *   authored forms are  -> "stix-forms"        (verified 200, with fields)
 *
 * `object_group` and `object_form` were already correct, so only the family is repaired here.
 *
 * `impact` is deliberately NOT remapped: it has no create or update form under any family, so
 * pointing it at stix-forms would swap one 404 for another and hide the one real content gap.
 *
 * ⚠️ Edits the file as TEXT rather than re-serialising it. A first attempt used
 * `JSON.stringify(data, null, 1)`, which reformatted every line of all 13 files and buried a
 * 19-line fix in a whole-file diff. These files are one property per line, so a line-level
 * substitution keeps the change reviewable.
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.argv[2]
const DRY = process.argv.includes('--dry')

/** Types whose forms are authored under stix-forms; impact is excluded on purpose. */
const REMAP = new Set(['event', 'sequence', 'task', 'anecdote'])

/** How far back to look for the `"type"` this object_family belongs to. */
const LOOKBACK = 12

let files = 0
let changed = 0
const skipped = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === '__pycache__') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name.endsWith('.json')) visit(full)
  }
}

function visit(file) {
  const raw = fs.readFileSync(file, 'utf8')
  if (!raw.includes('os-threat-forms')) return

  // ⚠️ Do NOT reason line-by-line. Some of these files are minified to a SINGLE line, so a
  // backwards line search finds the first "type" in the whole file and mis-attributes it — that
  // reported an anecdote as an email-addr on the first attempt.
  //
  // `object_form` / `object_group` / `object_family` are written together, so bind them in one
  // match. That is true in both the pretty-printed and the minified files.
  let hits = 0
  const updated = raw.replace(
    /"object_form"(\s*:\s*)"([a-z0-9-]+)"(\s*,\s*)"object_group"(\s*:\s*)"([a-z0-9-]+)"(\s*,\s*)"object_family"(\s*:\s*)"os-threat-forms"/g,
    (match, s1, type, s2, s3, group, s4, s5) => {
      if (!REMAP.has(type)) {
        skipped.push(`${path.basename(file)}: ${type} left as os-threat-forms (no form authored)`)
        return match
      }
      hits++
      return `"object_form"${s1}"${type}"${s2}"object_group"${s3}"${group}"${s4}"object_family"${s5}"stix-forms"`
    },
  )

  const leftovers = (updated.match(/"object_family"\s*:\s*"os-threat-forms"/g) || []).length
  if (leftovers && !skipped.some((s) => s.startsWith(path.basename(file)))) {
    skipped.push(`${path.basename(file)}: ${leftovers} occurrence(s) not matched by the pattern`)
  }

  if (hits) {
    files++
    changed += hits
    if (!DRY) fs.writeFileSync(file, updated)
  }
}

walk(ROOT)
console.log(`${DRY ? '[dry run] ' : ''}${changed} object_family values remapped across ${files} files`)
if (skipped.length) console.log('left alone:\n  ' + [...new Set(skipped)].join('\n  '))
