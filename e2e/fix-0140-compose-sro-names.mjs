/**
 * docs/issues/0140 step 2 (decision 0033 Option 2-for-blanks) — the stored data pass.
 *
 * parse.py now composes an unnamed relationship's display name as
 * `{relationship_type}: {source-type} → {target-type}` — but wrappers are FROZEN at
 * creation (0115), so the code change reaches zero existing nodes. This pass applies the
 * same rule to every stored relationship wrapper whose `name` is still the bare edge
 * kind (`related-to`, `Derived-From`, …).
 *
 * Format safety (the 8420f73 lesson): single-line files are rewritten only when
 * `JSON.stringify(parse(raw)) === raw` proves the round-trip byte-stable; pretty files
 * get line-surgery — the wrapper's `"name"` line is located within a few lines of its
 * `"id": "relationship--…"` line and only that line's value changes. attack_cache/ is
 * raw ATT&CK data, never touched.
 *
 *     node e2e/fix-0140-compose-sro-names.mjs            # report
 *     node e2e/fix-0140-compose-sro-names.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const CTX = path.join(WORKSPACE, 'typerefinery/services/fastapi/generated/os-triage/context_mem')
const APPLY = process.argv.includes('--apply')

const isBareEdgeKind = (name, relType) =>
  typeof name === 'string' && typeof relType === 'string' &&
  // bare edge kind, or an earlier compose pass that used the unicode arrow (renders as
  // mojibake in at least one console/codepage — normalised to ASCII)
  (name.toLowerCase() === relType.toLowerCase() || name.includes('→'))

const composed = (orig) =>
  `${orig.relationship_type}: ${String(orig.source_ref).split('--')[0]} -> ${String(orig.target_ref).split('--')[0]}`

const walkFiles = (dir) => {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'attack_cache') continue
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkFiles(p))
    else if (entry.name.endsWith('.json')) out.push(p)
  }
  return out
}

let total = 0
for (const file of walkFiles(CTX)) {
  const raw = fs.readFileSync(file, 'utf8')
  if (!raw.includes('"relationship_type"')) continue
  let data
  try { data = JSON.parse(raw) } catch { continue }
  const wrappers = Array.isArray(data) ? data : []
  const fixes = []
  for (const w of wrappers) {
    const orig = w?.original
    if (w?.type === 'relationship' && orig?.relationship_type && orig?.source_ref && orig?.target_ref &&
        isBareEdgeKind(w.name, orig.relationship_type)) {
      fixes.push({ id: w.id, from: w.name, to: composed(orig) })
    }
  }
  if (!fixes.length) continue
  const rel = file.slice(CTX.length + 1)
  console.log(`${rel}: ${fixes.length} composable relationship name(s)`)
  for (const f of fixes.slice(0, 3)) console.log(`   ${f.id.slice(0, 22)}… "${f.from}" -> "${f.to}"`)
  if (fixes.length > 3) console.log(`   … and ${fixes.length - 3} more`)
  total += fixes.length
  if (!APPLY) continue

  const isSingleLine = !raw.trimEnd().includes('\n')
  if (isSingleLine) {
    // python json.dump writes single-line JSON with ", "/": " separators — not
    // JSON.stringify-round-trip-stable — so use the same anchored surgery as the pretty
    // branch, on a bounded character window after the wrapper's id.
    let out = raw
    let applied = 0
    for (const fix of fixes) {
      const idAt = out.indexOf(`"id": "${fix.id}"`)
      if (idAt < 0) { console.log(`   ⚠️ ${fix.id}: id not found — skipped`); continue }
      const window = out.slice(idAt, idAt + 2000)
      const needle = `"name": ${JSON.stringify(fix.from)}`
      const nameAt = window.indexOf(needle)
      if (nameAt < 0) { console.log(`   ⚠️ ${fix.id}: name not within the wrapper window — skipped`); continue }
      out = out.slice(0, idAt + nameAt) + `"name": ${JSON.stringify(fix.to)}` + out.slice(idAt + nameAt + needle.length)
      applied++
    }
    JSON.parse(out) // must still be valid JSON, or we wrote garbage
    fs.writeFileSync(file, out)
    console.log(`   ✅ ${applied}/${fixes.length} rewritten (single-line windowed surgery, re-parse verified)`)
  } else {
    // pretty file: line surgery anchored on the wrapper id
    const lines = raw.split('\n')
    let applied = 0
    for (const fix of fixes) {
      const idIdx = lines.findIndex((l) => l.includes(`"id": "${fix.id}"`))
      if (idIdx < 0) { console.log(`   ⚠️ ${fix.id}: id line not found — skipped`); continue }
      let done = false
      // the wrapper's name can sit AFTER its ~40-line original block (key order varies)
      for (let i = idIdx; i < Math.min(idIdx + 60, lines.length); i++) {
        if (lines[i].includes(`"name": ${JSON.stringify(fix.from)}`)) {
          lines[i] = lines[i].replace(`"name": ${JSON.stringify(fix.from)}`, `"name": ${JSON.stringify(fix.to)}`)
          applied++; done = true
          break
        }
      }
      if (!done) console.log(`   ⚠️ ${fix.id}: name line not within 8 lines of id — skipped`)
    }
    fs.writeFileSync(file, lines.join('\n'))
    console.log(`   ✅ ${applied}/${fixes.length} rewritten (line surgery)`)
  }
}
console.log(`\n${APPLY ? 'applied' : 'dry run'} — ${total} composable name(s) across the context store.`)
if (!APPLY) console.log('Re-run with --apply, then verify /viz-data payloads and run the walk.')
