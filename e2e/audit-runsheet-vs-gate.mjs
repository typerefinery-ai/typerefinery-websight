/**
 * docs/issues/0188 — does the runsheet still say a step is unproven that the latest gate just passed?
 *
 * 0188: the Act 4 **section** read *"Still cut from the demo run … do not open the tab"* while the same
 * file's rollup read *"green — in the demo run"*, and P4-S1…S5 had passed 5/5 in four consecutive
 * headed gates. A presenter reads the section, so a working Act would simply not have been shown.
 *
 * That is the mirror of [0048](../../docs/issues/0048-runsheet-claims-exceed-test-assertions.md) — the
 * doc **understating** the build — and it is worse-behaved, because nothing on stage reveals it. This
 * is the cheap guard: the gate's own walk log names every step it passed; anything the runsheet does
 * not mark ✅ is a candidate.
 *
 * Deliberately ONE-DIRECTIONAL. It flags understatement only. Overstatement (runsheet ✅, gate silent)
 * is not a finding here: most steps are not covered by the four headed walks at all, so flagging those
 * would bury the signal — that direction is 0048's, and it needs assertion review, not log matching.
 *
 *     node e2e/audit-runsheet-vs-gate.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
// RUNSHEET_PATH lets a negative control point this at a doctored copy — a detector that has never
// fired is not evidence it can (the lesson of 0100's controls C1/C2).
const RUNSHEET = process.env.RUNSHEET_PATH || path.join(WORKSPACE, 'docs/mini-app-runsheet.md')
const RUNS = path.join(WORKSPACE, 'docs/runs')

// The newest gate: prefer what LAST-CHROME-ACTS points at, fall back to the newest *-chrome-acts dir.
let runDir = null
const stampFile = path.join(RUNS, 'LAST-CHROME-ACTS.txt')
if (fs.existsSync(stampFile)) {
  const m = fs.readFileSync(stampFile, 'utf8').match(/runs:\s*docs\/runs\/([^\s/]+)/)
  if (m && fs.existsSync(path.join(RUNS, m[1]))) runDir = path.join(RUNS, m[1])
}
if (!runDir) {
  const dirs = fs
    .readdirSync(RUNS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /chrome-acts$/.test(d.name))
    .map((d) => d.name)
    .sort()
  if (dirs.length) runDir = path.join(RUNS, dirs[dirs.length - 1])
}
if (!runDir) {
  console.log('no gate run directory found under docs/runs — nothing to compare')
  process.exit(0)
}

const logFile = path.join(runDir, 'walk-log.txt')
if (!fs.existsSync(logFile)) {
  console.log(`gate run ${path.basename(runDir)} has no walk-log.txt — cannot compare`)
  process.exit(0)
}
const log = fs.readFileSync(logFile, 'utf8')

// "PASS  P4-S1   matrix renders …" / "PASS    P3-S6 …"
const passed = new Map()
for (const m of log.matchAll(/^PASS\s+(P\d-S\d+)\s+(.*)$/gm)) passed.set(m[1], m[2].trim().slice(0, 90))
console.log(`gate: ${path.basename(runDir)} · steps recorded PASS: ${passed.size}`)

// Runsheet step rows: id -> the Status cell's leading glyph.
const rows = new Map()
for (const line of fs.readFileSync(RUNSHEET, 'utf8').split('\n')) {
  const m = line.match(/^\| (P\d-S\d+) \|/)
  if (!m) continue
  const cells = line.split('|')
  if (cells.length !== 6) continue
  if (!rows.has(m[1])) rows.set(m[1], cells[4].trim())
}

/**
 * A non-✅ row is NOT understatement when it cites an OPEN issue as the reason.
 *
 * ⚠️ Added 2026-08-16 after this check fired on a row that was telling the truth. The gate's per-step
 * evidence can be NARROWER than the row's claim: for P3-S6 the gate proves "SRO modal mounted", while
 * the row claims the modal opens pre-filled AND the analyst picks a relationship type AND the
 * relationship is created. The type field turned out to offer nothing selectable
 * (docs/issues/0193) — so the row is ◐ and the gate is green, and **both are correct**. Forcing ✅
 * there would have put a false claim in front of a presenter, which is the very thing 0188 is about,
 * pointing the other way.
 *
 * That is docs/issues/0048's partial-claim class appearing inside an auditor: a check whose evidence
 * covers less than the claim it is policing.
 *
 * The exception is deliberately narrow, or it becomes a loophole any row could use: the cited issue
 * must EXIST and must still be Open / In Progress / Partially resolved. A row citing a Resolved issue
 * is understatement again, and is still flagged.
 */
const ISSUE_DIR = path.join(path.dirname(RUNSHEET), 'issues')

/**
 * ⚠️ CURRENT claim only. Status cells append their history behind an `Earlier:` marker, and those
 * entries cite plenty of issues — several of them still open. A first version searched the whole
 * cell, and the control caught it immediately: with P3-S6's own citation deliberately removed, the
 * row still excused itself on an unrelated `0075` link buried in its history. Any sufficiently long
 * row would have been permanently exempt.
 *
 * Sixth occurrence of this shape in the suite — a check matching text that is HISTORICAL or QUOTED
 * rather than asserted.
 */
const currentClaim = (status) => status.split(/\bEarlier:|\bPreviously:|\bPrior entry:/)[0]

const openIssueCited = (status) => {
  for (const m of currentClaim(status).matchAll(/issues\/(\d{4})-[a-z0-9-]+\.md/gi)) {
    const file = fs.existsSync(ISSUE_DIR)
      ? fs.readdirSync(ISSUE_DIR).find((n) => n.startsWith(`${m[1]}-`))
      : null
    if (!file) continue
    const fm = fs.readFileSync(path.join(ISSUE_DIR, file), 'utf8').match(/^status:\s*(.*)$/m)
    if (fm && /^\**\s*(open|in progress|partially)/i.test(fm[1].replace(/^["']/, ''))) return m[1]
  }
  return null
}

const understated = []
const qualified = []
for (const [id, detail] of passed) {
  const status = rows.get(id)
  if (status === undefined) {
    understated.push({ id, why: 'no row in the runsheet', detail })
    continue
  }
  if (status.startsWith('✅')) continue
  const cited = openIssueCited(status)
  if (cited) qualified.push({ id, cited, status })
  else understated.push({ id, why: `runsheet leads with "${status.slice(0, 40)}"`, detail })
}

for (const q of qualified) {
  console.log(`  ok  ${q.id}  not ✅, but cites OPEN issue ${q.cited} — the gate's evidence is narrower than the row's claim`)
}

if (!understated.length) {
  console.log('\nevery step the gate passed is marked ✅, or explains itself with an open issue')
  process.exit(0)
}
console.log(`\n⚠️ ${understated.length} step(s) the gate PASSED but the runsheet does not mark ✅:\n`)
for (const u of understated) {
  console.log(`  ${u.id}  ${u.why}`)
  console.log(`         gate said: ${u.detail}`)
}
console.log('\nThis is docs/issues/0188\'s class: the doc understating the build. A presenter reads the')
console.log('Act section, so a step left ⬜/◐ here can quietly cost a working capability its stage time.')
process.exit(1)
