/**
 * Do the two runsheets still describe the same demo?
 *
 * 🔑 **Why this exists.** `mini-app-runsheet.md` (engineering) and `mini-app-runsheet-user.md`
 * (the copy a presenter actually holds) are the same walkthrough for two audiences, and **nothing
 * linked them**. `check-runsheet-sync.mjs` compares the engineering copy to `runsheet.ts`; no gate
 * compared it to the user copy.
 *
 * The cost was measured: [0188](../../docs/issues/0188-*.md) — *"the runsheet told the presenter to
 * skip a working Act"* — was fixed in the engineering copy on 2026-08-15, and the **user copy went on
 * saying "this act does not work yet … skip this act in a demo" for another day**, while Act 4 passed
 * 5/5 on twenty-two consecutive gates. The fix landed where engineers read and the presenter kept the
 * wrong one.
 *
 * **Deterministic and opinion-free**, the properties that made `audit-steering-todos.mjs` keepable
 * and killed `audit-stale-blockers.mjs`: it counts **step IDs**, which are exact, and it **reports**
 * rather than judging. A missing ID means *"look at this"*, not *"this is broken"* — measured on
 * 2026-08-16, the user copy covers Promote in prose while never citing `P3-S12`, which is a tagging
 * gap and not a coverage one. Only a human can tell those apart, so only a human should.
 *
 * ⚠️ It would have caught 0188: before the rewrite the user copy's Act 4 cited **no** step IDs at all
 * while the engineering copy had five.
 *
 *     node e2e/audit-runsheet-pair.mjs
 *     node e2e/audit-runsheet-pair.mjs --strict   # exit 1 if any Act's user coverage is 0
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DOCS = path.resolve(__dirname, '../../docs')
const STRICT = process.argv.includes('--strict')

const ENG = fs.readFileSync(path.join(DOCS, 'mini-app-runsheet.md'), 'utf8')
const USR = fs.readFileSync(path.join(DOCS, 'mini-app-runsheet-user.md'), 'utf8')

/** The engineering copy's own step rows are the authority for what a step IS. */
const engIds = new Set([...ENG.matchAll(/^\| (P\d-S\d+) \|/gm)].map((m) => m[1]))
const usrIds = new Set([...USR.matchAll(/\b(P\d-S\d+)\b/g)].map((m) => m[1]))

const acts = [...new Set([...engIds].map((id) => id[1]))].sort()
console.log('step-ID coverage, per Act:\n')
console.log('  Act   engineering   user copy   IDs the user copy does not cite')
let zeroActs = 0
for (const a of acts) {
  if (a === '0') continue // preflight is engineering-only by design
  const e = [...engIds].filter((id) => id[1] === a).sort()
  const u = e.filter((id) => usrIds.has(id))
  const missing = e.filter((id) => !usrIds.has(id))
  if (!u.length) zeroActs++
  console.log(
    `  ${a}     ${String(e.length).padStart(3)}          ${String(u.length).padStart(3)}       ` +
      (missing.length ? missing.join(' ') : '—'),
  )
}

/**
 * ⚠️ Preflight (P0-*) is deliberately excluded above: it is engineering-only, and flagging all
 * eleven of its steps every run would be the noise that trains a reader to ignore this.
 */
const usrOnly = [...usrIds].filter((id) => !engIds.has(id) && id[1] !== '0').sort()
if (usrOnly.length) console.log(`\n⚠️ cited by the user copy but not a step in the engineering copy: ${usrOnly.join(' ')}`)

console.log('\n⚠️ A missing ID is a prompt, not a defect — the user copy may cover the behaviour in')
console.log('   prose without citing the tag (measured: it describes Promote but never says P3-S12).')
console.log(`   An Act with ZERO user coverage is the 0188 signature and is worth opening.`)
if (zeroActs) console.log(`\n🔴 ${zeroActs} Act(s) have NO step IDs in the user copy.`)
process.exit(STRICT && zeroActs ? 1 : 0)
