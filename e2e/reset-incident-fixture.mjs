/**
 * alpha-launch 0076 — restore an incident's context to its committed baseline.
 *
 * The suite drifts its own fixture in both directions: Scratch drains (now seeded, see
 * e2e/fixtures.ts) and Promotable grows without bound because every act creates objects and nothing
 * removes them. Selective deletion is a guess — only 6 of 56 objects carry a suite-recognisable name,
 * and guessing at demo data is what produced docs/issues/0074.
 *
 * There is a better primitive: the context store is a git submodule, so the fixture HAS a baseline.
 *
 *     tracked    unattached_objs.json, incident.json, *_refs.json   -> restore with git checkout
 *     untracked  unattached_relation.json, *_edges.json             -> runtime artifacts, remove
 *
 * DRY RUN BY DEFAULT. Pass --apply to actually change anything.
 *
 * ⚠️ This discards test-created relationships and any object added since the last commit. That is
 * the point, but it also means anything worth keeping must be committed first.
 */
import { execFileSync } from 'node:child_process'
import fs from 'fs'
import path from 'path'

const CTX = 'typerefinery/services/fastapi/generated/os-triage/context_mem'
const apply = process.argv.includes('--apply')
const incident = process.argv.find((a) => a.startsWith('incident--')) || 'incident--511d2ab7-c6a8-4ab9-bf11-2e027eee3eba'

const git = (...args) => execFileSync('git', args, { cwd: CTX, encoding: 'utf8' }).trim()
// ⚠️ Porcelain status lines start with a SPACE for unstaged changes (' M path'), and trimming the
// whole output eats it — shifting every offset by one and silently corrupting the first path.
const gitRaw = (...args) => execFileSync('git', args, { cwd: CTX, encoding: 'utf8' })

const dir = path.join(CTX, incident)
if (!fs.existsSync(dir)) {
  console.log(`no such incident context: ${incident}`)
  process.exit(1)
}

const status = gitRaw('status', '--porcelain', '--', incident)
  .split('\n')
  .filter(Boolean)
  .map((l) => {
    const m = /^(..) (.*)$/.exec(l)
    return m ? { code: m[1].trim(), file: m[2] } : null
  })
  .filter(Boolean)

const modified = status.filter((s) => s.code === 'M')
const untracked = status.filter((s) => s.code === '??')

const count = (f) => {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(CTX, f), 'utf8'))
    return Array.isArray(j) ? j.length : '-'
  } catch {
    return '-'
  }
}

console.log(`incident: ${incident}`)
console.log(`mode:     ${apply ? 'APPLY' : 'dry run (pass --apply to change anything)'}`)
console.log()

console.log(`modified tracked files (${modified.length}) — would be restored to the committed baseline:`)
for (const m of modified) {
  let committed = '-'
  try {
    const blob = git('show', `HEAD:${m.file}`)
    const j = JSON.parse(blob)
    committed = Array.isArray(j) ? j.length : '-'
  } catch {}
  console.log(`   ${m.file}`)
  console.log(`      working ${count(m.file)} entries  ->  committed ${committed}`)
}

console.log()
console.log(`untracked runtime files (${untracked.length}) — would be removed:`)
for (const u of untracked) console.log(`   ${u.file}  (${count(u.file)} entries)`)

if (!apply) {
  console.log('\nnothing changed. Re-run with --apply to restore.')
  process.exit(0)
}

for (const m of modified) git('checkout', '--', m.file)
for (const u of untracked) fs.rmSync(path.join(CTX, u.file), { force: true })
console.log(`\nrestored ${modified.length} tracked file(s), removed ${untracked.length} runtime file(s).`)
console.log('Re-check the panes:  /viz-data/unattached-split')
