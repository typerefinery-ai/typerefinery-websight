/**
 * docs/issues/0140 option 3 + docs/issues/0138 phase 2 — repair display names that disagree with the
 * object's own STIX `name`, in the stored (frozen) wrappers.
 *
 * WHY A SECOND CHANGE IS NEEDED. The root cause is fixed in `parse.py`
 * (`wrap["name"]` now prefers `stix_dict["name"]` over `post_field0`), but every stored object is a
 * wrapper frozen at creation and never recomputed (docs/issues/0115), so the source fix changes
 * nothing that already exists — including the entire demo dataset. This script applies the *same
 * rule* to the stored data.
 *
 * THE RULE IS NOT AN INVENTION. It rewrites `wrapper.name` to `wrapper.original.name` and ONLY when
 * the original has a non-empty `name` that differs. It never invents a name for an object that has
 * none — those (67 of 110 in the demo incident: `sequence`, `observed-data`, `email-message`,
 * `user-account`, `impact`, `anecdote`, `relationship`) need an explicit registry display-name
 * column, which is alpha-launch decision 0033, and are deliberately left alone here.
 *
 * Measured on incident--511d2ab7 before writing: 110 objects with an `original`, 43 with a STIX
 * name, **6 disagreeing** — identities showing `"Naive"` instead of `"Naive Smith"` (post_field0 is
 * `...first_name`) and `"Me"` instead of `"Trusty Jones"`. `Naive Smith` is on the image5 demo path.
 *
 *     node e2e/fix-frozen-display-names.mjs            # report only
 *     node e2e/fix-frozen-display-names.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CTX = path.resolve(__dirname, '../../typerefinery/services/fastapi/generated/os-triage/context_mem')
const APPLY = process.argv.includes('--apply')

// Only the tracked (curated) incidents — decision 0027 makes those the dataset. Touching untracked
// junk would be work thrown away by the next reset-demo-data.mjs run.
const TRACKED = [
  'incident--511d2ab7-c6a8-4ab9-bf11-2e027eee3eba',
  'incident--f853d6f8-a668-4272-b007-55eff8087ec6',
]

let scanned = 0
let fixed = 0
const skipped = new Map()

for (const inc of TRACKED) {
  const dir = path.join(CTX, inc)
  if (!fs.existsSync(dir)) {
    console.error(`FAIL - ${dir} not found`)
    process.exit(1)
  }
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.json'))) {
    const file = path.join(dir, f)
    let raw
    try {
      raw = JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch {
      continue
    }
    const list = Array.isArray(raw) ? raw : raw['0']
    if (!Array.isArray(list)) continue

    let touched = false
    for (const w of list) {
      if (!w || typeof w !== 'object' || !w.original) continue
      scanned++
      const stixName = w.original.name
      if (stixName === undefined || stixName === null || !String(stixName).trim()) {
        // No STIX name — out of scope on purpose. Count by type so the report shows what is left.
        const t = String(w.id || '--').split('--')[0]
        skipped.set(t, (skipped.get(t) || 0) + 1)
        continue
      }
      if (String(w.name) === String(stixName)) continue
      console.log(`${inc.slice(0, 20)}… ${f}`)
      console.log(`  ${String(w.id).split('--')[0].padEnd(14)} ${JSON.stringify(w.name)} -> ${JSON.stringify(stixName)}`)
      fixed++
      if (APPLY) {
        w.name = stixName
        touched = true
      }
    }
    if (APPLY && touched) fs.writeFileSync(file, JSON.stringify(raw, null, 1))
  }
}

console.log('')
console.log(`objects scanned          : ${scanned}`)
console.log(`names ${APPLY ? 'corrected' : 'that would change'} : ${fixed}`)
console.log(`left alone (no STIX name): ${[...skipped.values()].reduce((a, b) => a + b, 0)}`)
for (const [t, n] of [...skipped.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${t.padEnd(16)} ${n}`)
}
console.log('\nThose need an explicit registry display-name column — decision 0033, not this script.')
if (!APPLY) console.log('\ndry run - nothing written. Re-run with --apply.')
