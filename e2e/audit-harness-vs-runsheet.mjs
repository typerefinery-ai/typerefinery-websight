/**
 * Does the HARNESS keep up with what the RUNSHEET has learned?
 *
 * alpha-launch docs/issues/0048. There is already `audit-runsheet-vs-gate.mjs`, which checks the
 * runsheet does not UNDERSTATE what the gate proved. Nothing checked the other direction, and that is
 * where the damage was:
 *
 *   P2-S4's runsheet row recorded on 2026-08-13 that headed Playwright's `mouse.wheel` drives d3.zoom
 *   through the cross-origin embed (`scale(1.000)` -> `scale(9.849)`). `runsheet.ts` kept
 *   `baseline: 'manual'` and the note "CDP scroll gestures time out against the cross-origin embed",
 *   and the spec body stayed seventeen lines of comment with no assertions. Anything not 'pass' is
 *   non-strict, so a total zoom regression would have reported as *skipped* while the runsheet said
 *   the row was verified. That survived three days.
 *
 * Two passes, both REPORTING rather than judging where judgement is not mechanical:
 *
 *   1. 🚩 A step whose runsheet Status claims UNQUALIFIED success while its harness baseline is
 *      non-strict. This is the P2-S4 shape and it is a real contradiction: the register says proven,
 *      the harness cannot fail. Exits non-zero.
 *
 *      ⚠️ A row that qualifies itself is NOT flagged. P0-S6 leads ✅ and then carries a ◐ about
 *      incident creation switching the default — a 'partial' baseline is the honest match for that,
 *      and flagging it would be the noise that gets a check ignored (the muted-guard failure this
 *      suite has already paid for once).
 *
 *   2. Harness `note:` text asserting a limitation ("cannot", "times out", "manual only", ...) listed
 *      beside its runsheet row, for review. A limitation note is exactly the thing that goes stale
 *      when someone disproves it in the runsheet, and no regex can tell a live constraint from a dead
 *      one. Listed, never failed.
 *
 * Usage: node audit-harness-vs-runsheet.mjs [--verbose]
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const verbose = process.argv.includes('--verbose')
// Overridable so the check can be pointed at reconstructed inputs and PROVEN TO FIRE. A green audit
// that has never failed is not evidence — this suite has shipped three of those.
const HARNESS = process.env.HARNESS_FILE || path.join(__dirname, 'runsheet.ts')
const RUNSHEET = process.env.RUNSHEET_FILE || path.join(__dirname, '..', '..', 'docs', 'mini-app-runsheet.md')

for (const f of [HARNESS, RUNSHEET]) {
  if (!fs.existsSync(f)) {
    console.error(`missing ${f} — this audit cannot run, and a skipped audit must never read as a pass`)
    process.exit(2)
  }
}

// --- the harness side -------------------------------------------------------
const harnessText = fs.readFileSync(HARNESS, 'utf8')
const steps = new Map()
for (const m of harnessText.matchAll(/'(P\d-S\d+)':\s*\{([^}]*)\}/g)) {
  const body = m[2]
  const baseline = (body.match(/baseline:\s*'([^']+)'/) || [])[1] || '(none)'
  const note = (body.match(/note:\s*'((?:[^'\\]|\\.)*)'/) || [])[1] || ''
  steps.set(m[1], { baseline, note })
}
if (!steps.size) {
  console.error('parsed 0 steps out of runsheet.ts — the shape changed and this audit is blind. Failing rather than reporting green.')
  process.exit(2)
}

// --- the runsheet side ------------------------------------------------------
// Row shape: | P2-S4 | gesture | expected | status… |   -> split('|') index 4 is Status.
const runsheetText = fs.readFileSync(RUNSHEET, 'utf8')
const rows = new Map()
for (const line of runsheetText.split(/\r?\n/)) {
  const m = line.match(/^\|\s*\*{0,2}(P\d-S\d+)\*{0,2}\s*\|/)
  if (!m) continue
  const cells = line.split('|')
  if (cells.length < 5) continue
  if (!rows.has(m[1])) rows.set(m[1], cells[4].trim())
}

/**
 * The CURRENT claim only — Status cells carry their own history after an `Earlier:` / `Previously:`
 * marker, and that history is where superseded qualifications live.
 *
 * ⚠️ Learned from this check's own control run. A first version tested the whole cell, and P2-S4 —
 * the exact case this audit exists for — was excused because two `Earlier: ◐ …` entries mentioned a
 * qualification that the current entry had already closed. Matching historical or quoted text is the
 * same false-positive/negative shape that has now caught out four checks in this suite; here it
 * silenced the one finding that mattered.
 */
const currentClaim = (status) => status.split(/\bEarlier:|\bPreviously:|\bPrior entry:/)[0]

/**
 * Does this Status cell's CURRENT claim qualify itself — a partial, blocked or failing marker?
 *
 * ⚠️ The `u` flag is LOAD-BEARING, not tidiness. `🚫` is outside the BMP, and in a non-unicode regex
 * a character class containing it is split into surrogate halves — so the class matches a lone
 * leading surrogate, and therefore ANY emoji that shares it. Without `u` this matched the `📋` in
 * "📋 Observation, not a defect claim" and excused P2-S4, the exact row the audit exists to catch.
 * Caught by the control run, not by reading the code.
 */
const qualified = (status) => /[◐⬜❌🚫]|partial|blocked|manual|not automated/iu.test(currentClaim(status))
const leadsGreen = (status) => /^\**\s*✅/.test(status.trim())

const STRICT = 'pass'
const contradictions = []
const reported = []

for (const [id, { baseline, note }] of [...steps].sort()) {
  const status = rows.get(id)
  if (baseline === STRICT) continue
  if (status === undefined) {
    reported.push({ id, baseline, note, status: '(no runsheet row)', verdict: 'no row to compare' })
    continue
  }
  if (leadsGreen(status) && !qualified(status)) contradictions.push({ id, baseline, note, status })
  else reported.push({ id, baseline, note, status, verdict: qualified(status) ? 'row qualifies itself — consistent' : 'row does not claim success' })
}

console.log(`${steps.size} harness step(s) · ${rows.size} runsheet row(s)`)
const nonStrict = [...steps].filter(([, s]) => s.baseline !== STRICT)
console.log(`${nonStrict.length} non-strict baseline(s): ${nonStrict.map(([k, s]) => `${k}=${s.baseline}`).join(', ') || '(none)'}`)

for (const r of reported) {
  console.log(`  ok  ${r.id}  baseline=${r.baseline}  — ${r.verdict}`)
  if (verbose && r.status) console.log(`        runsheet: ${r.status.slice(0, 160)}`)
}

// --- pass 2: limitation notes, listed for review ----------------------------
const LIMITATION = /\b(cannot|can't|times? out|impossible|not possible|manual[- ]only|unreliable|does not work|blocked)\b/i
const limitationNotes = [...steps].filter(([, s]) => s.note && LIMITATION.test(s.note))
console.log(`\n${limitationNotes.length} harness note(s) asserting a limitation — review against the runsheet row:`)
for (const [id, s] of limitationNotes) {
  console.log(`  ${id}  baseline=${s.baseline}`)
  console.log(`     note:     ${s.note.slice(0, 150)}`)
  const st = rows.get(id)
  console.log(`     runsheet: ${st ? st.slice(0, 150) : '(no row)'}`)
}
console.log('  ⚠️ A limitation note is what goes stale when someone disproves it in the runsheet — that is')
console.log('     how P2-S4 kept a dead blocker for three days. No regex can tell a live constraint from a')
console.log('     dead one, so these are listed, never failed.')

if (!contradictions.length) {
  console.log('\nno step claims unqualified success in the runsheet while its harness baseline cannot fail')
  process.exit(0)
}

console.log(`\n🚩 ${contradictions.length} step(s) the runsheet marks ✅ while the harness cannot fail them:`)
for (const c of contradictions) {
  console.log(`  ${c.id}  baseline=${c.baseline}  (non-strict — a regression here reports as SKIPPED)`)
  console.log(`     runsheet: ${c.status.slice(0, 200)}`)
  if (c.note) console.log(`     note:     ${c.note.slice(0, 150)}`)
}
console.log('\nEither the harness owes an assertion, or the runsheet is overclaiming. See docs/issues/0048.')
process.exitCode = 1
