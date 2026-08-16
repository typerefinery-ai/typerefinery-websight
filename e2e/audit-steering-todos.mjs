/**
 * docs/issues/0190 — do the STRUCTURED steering tables still point work at Resolved issues?
 *
 * 0190's class reached six sites in one day, and the two worst were the goal file's **priority
 * table** — the instruction that selects each tick's work. Its P1 row named four Act 1 items of
 * which **three were already Resolved**; its P2 row said "0164 first", also Resolved. A tick that
 * trusted the table would have opened three closed issues before finding anything real.
 *
 * 🔑 **Why this one is deterministic where the abandoned checker was not.**
 * `audit-stale-blockers.mjs` (built and dropped the same day — see 0190) tried to read *prose* and
 * decide whether a sentence asserted a live blocker. Every tuning step opened a silent blind spot,
 * and it reproduced the documented false positive that got an earlier prose checker abandoned.
 *
 * This asks a question with an exact answer instead, and only of **named, structured tables**:
 *
 *     Which issues does this table cite, and which of them are Resolved?
 *
 * ⚠️ **It does not claim anything is wrong.** A steering table legitimately cites closed issues as
 * evidence ("the boot-fragility P0 is CLOSED — 0174, 0175"). Deciding which citations are evidence
 * and which are stale instructions is a judgement, and this tool deliberately does not make it — it
 * prints the handful of facts a reader needs to make it in ten seconds. That is why it has no false
 * positives to tune: it has no opinion.
 *
 * Exit code is 0 unless --strict is passed, so it reports without failing a routine gate run.
 *
 *     node e2e/audit-steering-todos.mjs
 *     node e2e/audit-steering-todos.mjs --strict     # exit 1 if anything is listed
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const DOCS = path.join(ROOT, 'docs')
const ISSUES = path.join(DOCS, 'issues')
const STRICT = process.argv.includes('--strict')

const statusById = new Map()
for (const name of fs.readdirSync(ISSUES).filter((n) => /^\d{4}-.*\.md$/.test(n))) {
  const head = fs.readFileSync(path.join(ISSUES, name), 'utf8').slice(0, 2000)
  const m = /^status:\s*(.+)$/m.exec(head)
  if (m) statusById.set(name.slice(0, 4), m[1].trim())
}

const isResolved = (status) => {
  const lead = String(status || '').toLowerCase().split(/[—\-–(]/)[0].replace(/[*`]/g, '').trim()
  if (/reopen/.test(lead)) return false
  if (/partly|partial/.test(lead)) return false
  return /^(resolved|closed|fixed|superseded|duplicate)/.test(lead)
}

const cited = (text) => [...new Set([...text.matchAll(/issues\/(\d{4})-/g)].map((m) => m[1]))]

let listed = 0

/**
 * 1) The goal file's priority table — rows `| **P0** | … |` through `| Then | … |`.
 * This is the table that decides what gets worked on, so a Resolved id here is the highest-cost
 * staleness in the workspace.
 */
{
  const p = path.join(DOCS, 'demo-acts-goal.md')
  const rows = fs.readFileSync(p, 'utf8').split('\n').filter((l) => /^\|\s*(\*\*P\d\*\*|Then)\s*\|/.test(l))
  console.log(`— demo-acts-goal.md priority table: ${rows.length} row(s)\n`)
  for (const row of rows) {
    const label = (row.split('|')[1] || '').trim()
    const resolved = cited(row).filter((id) => isResolved(statusById.get(id)))
    if (!resolved.length) continue
    listed += resolved.length
    console.log(`  ${label} cites ${resolved.length} Resolved issue(s):`)
    for (const id of resolved) console.log(`      ${id} — ${statusById.get(id).slice(0, 88)}`)
    console.log('      → evidence, or work that no longer exists? (this tool does not decide)\n')
  }
}

/**
 * 2) The runsheet's task-rollup rows — `| <act> | <n> | <task> | … | <status> |`.
 * Here the check IS sharp, because the row carries its own status glyph: a rollup still marked ⬜
 * or ❌ while every issue it blames is Resolved is a contradiction inside one row, needing no
 * outside knowledge. That is exactly how site 3 of 0190 was found.
 */
{
  const p = path.join(DOCS, 'mini-app-runsheet.md')
  const rows = fs.readFileSync(p, 'utf8').split('\n').filter((l) => /^\|\s*\d\s*\|\s*\d+\s*\|/.test(l))
  console.log(`— mini-app-runsheet.md task rollups: ${rows.length} row(s)\n`)
  let flagged = 0
  for (const row of rows) {
    const ids = cited(row)
    if (!ids.length) continue
    const known = ids.filter((id) => statusById.has(id))
    if (!known.length) continue
    const allResolved = known.every((id) => isResolved(statusById.get(id)))
    /**
     * ⚠️ **The LEAD of the status cell, not the row.** First cut tested the whole row for ⬜/❌ and
     * flagged the Act 4 rollup that had just been corrected — because the correction *quotes* the
     * glyph it replaced (*this cell read "⬜ blocked …"*). Identical to the retraction that tripped
     * the CRITICAL check in `audit-issue-index-drift.mjs`: a record of what a cell used to say is
     * the fix working, not the fault. What states the row's condition is the first glyph of its
     * status cell.
     */
    const statusCell = (row.split('|')[7] ?? '').trim()
    const looksOpen = /^[*_`\s]*[⬜❌]/.test(statusCell)
    if (!(allResolved && looksOpen)) continue
    flagged++
    listed++
    const cells = row.split('|')
    console.log(`  Act ${(cells[1] || '').trim()} task ${(cells[2] || '').trim()} — ${(cells[3] || '').trim().slice(0, 60)}`)
    console.log(`      row is marked ⬜/❌ but every issue it cites is Resolved: ${known.join(', ')}\n`)
  }
  if (!flagged) console.log('  no rollup is marked ⬜/❌ while every issue it cites is Resolved.\n')
}

console.log(listed ? `${listed} citation(s) listed for review.` : 'nothing to review.')
process.exit(STRICT && listed ? 1 : 0)
