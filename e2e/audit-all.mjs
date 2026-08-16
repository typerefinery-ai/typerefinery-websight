/**
 * Run every OFFLINE standing gate, in one command, and fail if any of them fails.
 *
 * alpha-launch docs/issues/0192. There were twenty-nine `audit-*` / `check-*` scripts here and
 * **nothing that ran them as a set** — the "standing gate set" existed only as prose in an assessment
 * file and as one agent's habit of remembering which ones to type. That is the same fault 0192
 * recorded one level down: the detector existed and was green all day; only its cadence was wrong.
 * A check nobody runs is indistinguishable from a check that passes.
 *
 * Two rules are enforced structurally here rather than left to discipline:
 *
 *   1. **Unpiped exit codes.** `node audit.mjs | tail` reports *tail's* status, so a failing gate
 *      reads as a passing one — that misread a real failure on 2026-08-16. Each gate runs with its
 *      output captured and its own status inspected.
 *   2. **A skipped gate is never a pass.** A missing script, a crash, or a non-zero exit are all
 *      reported distinctly, and any of them fails the run.
 *
 * Scope is deliberately OFFLINE + FAST: gates that need the stack up, the network, or live content
 * are listed under `situational` and NOT run, because a set that sometimes fails for environmental
 * reasons is a set people learn to ignore.
 *
 * Usage:
 *   node audit-all.mjs              run the standing set
 *   node audit-all.mjs --list       show what is in the set, and what is deliberately outside it
 *   node audit-all.mjs --verbose    print each gate's full output
 */
import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const verbose = process.argv.includes('--verbose')

/** The standing set — offline, fast, and safe to run at any time. */
const STANDING = [
  { script: 'audit-doc-integrity.mjs', args: ['../../docs'], why: 'control bytes + dangling tombstones (0088, 0130, 0192)' },
  { script: 'audit-doc-links.mjs', args: [], why: 'every relative link in docs/ resolves' },
  { script: 'audit-issue-index-drift.mjs', args: [], why: 'issue front-matter agrees with the index' },
  { script: 'audit-runsheet-vs-gate.mjs', args: [], why: 'the runsheet does not understate what the gate proved' },
  { script: 'audit-harness-vs-runsheet.mjs', args: [], why: 'the harness keeps up with what the runsheet learned (0048)' },
  { script: 'audit-runsheet-pair.mjs', args: [], why: 'step-ID coverage matches between the two runsheets (0188)' },
  { script: 'audit-steering-todos.mjs', args: [], why: 'steering docs do not assert resolved blockers (0190)' },
  { script: 'audit-astral-regex.mjs', args: [], why: 'no emoji character class silently broken by a missing /u' },
  { script: 'check-runsheet-sync.mjs', args: [], why: 'runsheet and register stay in step' },
]

/**
 * Deliberately OUTSIDE the standing set, with the reason. Listing them matters as much as running
 * the others: an unexplained omission reads as an oversight and gets "fixed" by someone adding a
 * network call to a gate that must stay fast.
 */
const SITUATIONAL = [
  ['check-walk-auth.mjs', 'before a Chrome gate — needs the CMS up, and refreshes auth state'],
  ['audit-package-vs-live-content.mjs', 'after ANY live authoring — needs the CMS up'],
  ['audit-cited-urls.mjs', 'network: fetches every URL the open issues cite'],
  ['audit-content-divergence.mjs', 'needs the CMS up'],
  ['audit-flow-provisioning-drift.mjs', 'needs Flow up'],
  ['audit-provisioning-equivalence.mjs', 'needs Flow up'],
  ['audit-form-coverage.mjs', 'needs the CMS up'],
  ['audit-form-save-legs.mjs', 'needs Flow up'],
  ['audit-save-legs-in-flows.mjs', 'needs Flow up'],
  ['audit-flow-error-paths.mjs', 'needs Flow up'],
  ['audit-object-family.mjs', 'needs the CMS up'],
  ['audit-sco-invalid-properties.mjs', 'needs the CMS up'],
  ['audit-secrets-shape.mjs', 'run before any commit that touches config'],
  ['check-create-forms.mjs', 'needs the CMS up'],
  ['check-template-pane-overflow.mjs', 'needs a browser'],
  ['check-unattached-node-shape.mjs', 'needs Flow up'],
  ['audit-0057-label-residue.mjs', 'issue-specific residue check'],
  ['audit-0127-chip-headings.mjs', 'issue-specific residue check'],
  ['audit-0127-snake-case-labels.mjs', 'issue-specific residue check'],
  ['audit-0162-widget-generations.mjs', 'issue-specific, network'],
]

if (process.argv.includes('--list')) {
  console.log(`standing set (${STANDING.length}) — offline, run every tick:`)
  for (const g of STANDING) console.log(`  ${g.script.padEnd(34)} ${g.why}`)
  console.log(`\ndeliberately outside it (${SITUATIONAL.length}):`)
  for (const [s, why] of SITUATIONAL) console.log(`  ${s.padEnd(34)} ${why}`)
  process.exit(0)
}

const results = []
for (const gate of STANDING) {
  const p = path.join(__dirname, gate.script)
  if (!fs.existsSync(p)) {
    results.push({ ...gate, state: 'MISSING', code: null })
    continue
  }
  const t0 = process.hrtime.bigint()
  const r = spawnSync(process.execPath, [p, ...gate.args], { cwd: __dirname, encoding: 'utf8' })
  const ms = Number((process.hrtime.bigint() - t0) / 1000000n)
  const state = r.error ? 'CRASH' : r.status === 0 ? 'pass' : 'FAIL'
  results.push({ ...gate, state, code: r.status, ms, out: (r.stdout || '') + (r.stderr || '') })
}

const width = Math.max(...STANDING.map((g) => g.script.length))
for (const r of results) {
  const mark = r.state === 'pass' ? 'pass' : `🚩 ${r.state}`
  console.log(`  ${mark.padEnd(9)} ${r.script.padEnd(width)}  ${r.ms !== undefined ? `${r.ms}ms` : ''}`)
  if (verbose && r.out) console.log(r.out.split('\n').map((l) => `        ${l}`).join('\n'))
}

const bad = results.filter((r) => r.state !== 'pass')
console.log(`\n${results.length - bad.length}/${results.length} standing gate(s) pass`)

if (!bad.length) {
  console.log('every offline standing gate is green')
  process.exit(0)
}

for (const b of bad) {
  console.log(`\n🚩 ${b.script} — ${b.state}${b.code !== null && b.code !== undefined ? ` (exit ${b.code})` : ''}`)
  console.log(`   ${b.why}`)
  if (b.out) console.log(b.out.split('\n').slice(-25).map((l) => `   ${l}`).join('\n'))
}
process.exitCode = 1
