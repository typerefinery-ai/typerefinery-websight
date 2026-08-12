/**
 * docs/issues/0138 phase 2 — the "renames", which its own inventory calls the largest single lever.
 *
 * 🔑 **This invents no names.** Every new name is read from the object's own `original` using the
 * rule `icon_registry.csv` already declares for that type in its `name_field` column:
 *
 *     email-message  -> subject           user-account -> display_name       impact -> impact_category
 *
 * Those rules exist and are live in `parse.py`, but the stored objects were frozen **before** they
 * did — and a display wrapper is written once at creation and never recomputed (docs/issues/0115's
 * lesson: "every shaper fix needs a matching data pass"). This is that pass.
 *
 * Deliberately NOT touched:
 *   - `observed-data` and `anecdote`, whose names are ISO timestamps. The registry gives them **no**
 *     `name_field`, so they legitimately fall back to `post_field0` (`first_observed` /
 *     `report_date`). image5 calls one of them "Observation 1", but changing that is a **registry /
 *     design decision**, not a data repair, and inventing a name here is exactly what 0091 warned
 *     against. Reported, not changed.
 *   - `heading` and `description`. Only `name` is derived from `name_field`; widening the blast
 *     radius to fields with their own rules would make this pass unreviewable.
 *
 * ⚠️ Edits the `stix2-demo-context` submodule's working copy. Everything it touches is git-tracked,
 * so `git checkout` reverts it — which also means the change does NOT survive
 * `reset-demo-data.mjs --apply` until it is committed in that submodule.
 *
 *     node e2e/rename-frozen-display-names-from-registry.mjs            # report only
 *     node e2e/rename-frozen-display-names-from-registry.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const CONTEXT = path.join(WORKSPACE, 'typerefinery/services/fastapi/generated/os-triage/context_mem')
const REGISTRY = path.join(
  WORKSPACE,
  'typerefinery/services/fastapi/generated/os-triage/common_files/icon_registry.csv',
)
const APPLY = process.argv.includes('--apply')

/** Read `stix_type -> name_field` straight from the registry, so this cannot drift from parse.py. */
const nameFieldByType = () => {
  const lines = fs.readFileSync(REGISTRY, 'utf8').split(/\r?\n/).filter(Boolean)
  const hdr = lines[0].split(',')
  const iType = hdr.indexOf('stix_type')
  const iName = hdr.lastIndexOf('name_field')
  if (iType < 0 || iName < 0) throw new Error('icon_registry.csv is missing stix_type / name_field')
  const map = {}
  for (const line of lines.slice(1)) {
    const c = line.split(',')
    const type = c[iType]
    const field = (c[iName] || '').trim()
    if (!type || !field) continue
    // ⚠️ A type can appear on several rows (one per `head` variant). They agree on name_field in the
    // current data; if they ever disagree, say so rather than silently picking one.
    if (map[type] && map[type] !== field) {
      console.warn(`  ! ${type} has conflicting name_field values (${map[type]} vs ${field}) — skipping`)
      map[type] = null
    } else if (map[type] === undefined) {
      map[type] = field
    }
  }
  return map
}

/**
 * Types whose declared `name_field` is followed by the shaper but does **not** produce a name worth
 * showing. Excluded deliberately, with the evidence, rather than silently.
 *
 * `sequence` → `step_type` yields `single_step` / `start_step`. Applied and viewed in a real browser,
 * that is **worse** than the `event` / `task` it replaced: both are jargon, but the old values at
 * least named the thing an analyst recognises. This pass exists to make the demo legible, so a rename
 * that reduces legibility is not one it should make — even though the registry technically declares
 * it and a freshly-created object would get it.
 *
 * ⚠️ That inconsistency is real and is the point: the `sequence` row's `name_field` is itself the
 * thing to revisit (same bucket as `observed-data` / `anecdote`, whose names are ISO timestamps by
 * the registry's own fallback). Fixing it belongs in the registry, not in a data pass.
 */
const EXCLUDED = { sequence: 'step_type yields single_step/start_step — less legible than the event/task it replaces' }

const RULES = nameFieldByType()
for (const [type, why] of Object.entries(EXCLUDED)) {
  if (RULES[type]) {
    console.log(`  (excluded) ${type.padEnd(16)} -> ${RULES[type]}   ${why}`)
    delete RULES[type]
  }
}
console.log('name_field rules read from icon_registry.csv:')
for (const [t, f] of Object.entries(RULES).filter(([, f]) => f)) console.log(`  ${t.padEnd(18)} -> ${f}`)

const planned = []
const skippedNoSource = []
const files = []

for (const dir of fs.readdirSync(CONTEXT).filter((d) => d.startsWith('incident--'))) {
  for (const file of fs.readdirSync(path.join(CONTEXT, dir)).filter((f) => f.endsWith('.json'))) {
    const full = path.join(CONTEXT, dir, file)
    let json
    try {
      json = JSON.parse(fs.readFileSync(full, 'utf8'))
    } catch {
      continue
    }
    const list = Array.isArray(json) ? json : json.objects || (json.id ? [json] : [])
    let touched = false
    for (const obj of list) {
      if (!obj || !obj.id || !obj.type) continue
      const field = RULES[obj.type]
      if (!field) continue
      const want = (obj.original || {})[field]
      if (want === undefined || want === null || String(want).trim() === '') {
        skippedNoSource.push(`${obj.type} ${String(obj.id).slice(0, 30)} has no ${field}`)
        continue
      }
      if (String(obj.name) === String(want)) continue
      planned.push({ file: `${dir.slice(0, 18)}/${file}`, type: obj.type, from: String(obj.name), to: String(want) })
      if (APPLY) {
        obj.name = String(want)
        touched = true
      }
    }
    if (touched) files.push({ full, json })
  }
}

console.log(`\n${planned.length} object(s) would be renamed:`)
for (const p of planned) {
  console.log(`  ${p.type.padEnd(15)} ${JSON.stringify(p.from).padEnd(48)} -> ${JSON.stringify(p.to)}`)
}
if (skippedNoSource.length) {
  console.log(`\n${skippedNoSource.length} skipped — the source field is absent (left alone, not guessed):`)
  for (const s of skippedNoSource.slice(0, 10)) console.log(`  ${s}`)
}

if (!APPLY) {
  console.log('\ndry run - nothing written. Re-run with --apply.')
  process.exit(0)
}

for (const f of files) fs.writeFileSync(f.full, JSON.stringify(f.json, null, 2))
console.log(`\nwritten: ${files.length} file(s)`)
console.log('⚠️ These files are git-tracked in the stix2-demo-context submodule. Until the change is')
console.log('   committed there, `reset-demo-data.mjs --apply` will revert it.')
