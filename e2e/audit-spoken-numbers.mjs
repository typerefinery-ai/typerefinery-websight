/**
 * Verify the numbers a PRESENTER SAYS OUT LOUD.
 *
 * Three drifted in a single day (2026-08-16), each true when written:
 *
 *   "fifteen fixes" in the deploy queue   -> actually 3
 *   "35 form pages" in Act 5              -> actually 37
 *   "29/29 coverage" in Act 2             -> actually 28/28
 *
 * 🔑 The runsheet's **Status column** is checked by four auditors. Its **prose** is checked by none —
 * and the prose is what gets spoken to an investor. A wrong Status costs a re-run; a wrong spoken
 * number is said to the audience.
 *
 * This gates the claims we have chosen to measure, and — just as importantly — **lists the numeric
 * claims it does NOT cover**, so the uncovered set is visible rather than implied. A registry that
 * silently covers three of ten claims while reporting "all good" would be the same failure one level
 * up.
 *
 * Needs Flow + the CMS, so it is deliberately NOT in `audit-all.mjs`'s offline set.
 *
 *     node e2e/audit-spoken-numbers.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const FLOW = process.env.FLOW_BASE || 'https://flow.typerefinery.localhost:8101'
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// Overridable so the check can be pointed at a doctored copy and PROVEN TO FIRE. A green auditor
// that has never failed is not evidence — this suite has shipped three of those.
const USER = process.env.RUNSHEET_USER || path.join(WORKSPACE, 'docs/mini-app-runsheet-user.md')
const ENG = path.join(WORKSPACE, 'docs/mini-app-runsheet.md')
const RUNS = path.join(WORKSPACE, 'docs/runs')

const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '')
const userText = read(USER)
const engText = read(ENG)
if (!userText) { console.error(`missing ${USER} — failing rather than reporting green`); process.exit(2) }

/**
 * The most recent gate's log for a given walk.
 *
 * Some numbers only a browser can produce (Act 4's cell count), and some are only true in a state the
 * walk sets up (Act 3's pane count, after the drill-in). Both are read from the gate rather than
 * re-derived, so the check compares the runsheet against what the demo actually did.
 */
const latestGate = (file) => {
  if (!fs.existsSync(RUNS)) return null
  const dirs = fs.readdirSync(RUNS).filter((d) => /chrome-acts$/.test(d)).sort()
  for (const d of dirs.reverse()) {
    const f = path.join(RUNS, d, file)
    if (fs.existsSync(f)) return { dir: d, text: fs.readFileSync(f, 'utf8') }
  }
  return null
}
const latestGateAct4 = () => latestGate('walk-act4.txt')
const latestGateWalk = () => latestGate('walk-acts.txt')

const CLAIMS = [
  {
    what: 'Act 5 — form pages across the stixorm families',
    phrase: /\*\*(\d+) form pages\*\*/,
    where: userText,
    measure: async () => {
      const base = path.join(WORKSPACE, 'typerefinery-websight/tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms')
      let n = 0
      ;(function walk(d) {
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
          if (e.isDirectory()) walk(path.join(d, e.name))
          else if (e.name === '.content.xml' && /-(create|update)$/.test(path.basename(d))) n++
        }
      })(base)
      return { value: n, note: 'create/update pages in the content package (== live since 0194)' }
    },
  },
  {
    what: 'Act 2 — every node opens',
    phrase: /\*\*(\d+)\/\d+\*\*/,
    where: userText,
    measure: async () => {
      const p = await fetch(`${FLOW}/viz-data/overview-default-incident`).then((r) => r.json()).catch(() => null)
      if (!p) return { value: null, note: 'overview-default-incident unreadable' }
      const nodes = p.nodes || []
      const cache = new Map()
      let opens = 0
      for (const n of nodes) {
        const fp = n.form_path || n.formPath || n.form
        if (!fp) continue
        if (!cache.has(fp)) {
          const res = await fetch(`${CMS}/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/${fp}-update.html`, { headers: { Authorization: auth } }).catch(() => null)
          const html = res ? await res.text() : ''
          cache.set(fp, !!res && res.status === 200 && (html.match(/<input/g) || []).length >= 5)
        }
        if (cache.get(fp)) opens++
      }
      return { value: opens, note: `${opens} of ${nodes.length} node(s) open a populated form` }
    },
  },
  {
    what: 'Act 3 — objects on the demo incident',
    phrase: /\*\*(\d+) objects\*\*/,
    where: userText,
    /**
     * ⚠️ The claim is about the **image5 walkthrough incident**, which the runsheet's drill-in step
     * selects — not whatever incident is current. A first version measured `unattached-split` after a
     * demo-data reset, got **59**, and reported the runsheet wrong. The runsheet was right; the
     * measurement was taken on the other incident — the trap this project has hit repeatedly.
     *
     * Reading the gate's own walk log fixes it properly: the walk drills in first, so its number is
     * taken in the state the claim describes.
     */
    measure: async () => {
      // Read it from the GATE, which measures after the drill-in and therefore in the state the claim
      // is about. The live endpoint cannot be used: it reports whichever incident is current, and
      // after a demo-data reset that is Act 1's 59-object incident, not the walkthrough's.
      const g = latestGateWalk()
      if (!g) return { value: null, note: 'no gate log found' }
      const m = /Promotable (\d+), Scratch \d+/.exec(g.text)
      return { value: m ? Number(m[1]) : null, note: `from the ${g.dir} gate, measured after the drill-in` }
    },
  },
  {
    what: 'Act 4 — technique cells in the matrix',
    phrase: /\*\*(\d+) technique cells\*\*/,
    where: userText,
    measure: async () => {
      const g = latestGateAct4()
      if (!g) return { value: null, note: 'no gate log found' }
      const m = /matrix renders (\d+) technique cells/.exec(g.text)
      return { value: m ? Number(m[1]) : null, note: `from the ${g.dir} gate (browser-only measurement)` }
    },
  },
]

let bad = 0
const covered = []
for (const c of CLAIMS) {
  const m = c.phrase.exec(c.where)
  if (!m) { console.log(`  ?   ${c.what}: the phrase is no longer in the runsheet — registry out of date`); bad++; continue }
  covered.push(m[0])
  const said = Number(m[1])
  const { value, note } = await c.measure()
  if (value === null) {
    console.log(`  ${c.stateDependent ? ' - ' : ' ? '} ${c.what}: not measured — ${note}`)
    if (!c.stateDependent) bad++
    continue
  }
  const ok = said === value
  if (!ok) bad++
  console.log(`  ${ok ? 'ok ' : '🚩 '} ${c.what}: runsheet says ${said}, measured ${value} — ${note}`)
}

// What is NOT covered. A registry that gates 4 of N claims while printing "all good" is the same
// failure this check exists to catch.
const numeric = [...userText.matchAll(/\*\*[\d,]+(?:\/\d+)?[^*]{0,40}\*\*/g)].map((x) => x[0])
const uncovered = [...new Set(numeric)].filter((n) => !covered.includes(n))
console.log(`\n${covered.length} claim(s) gated · ${uncovered.length} numeric phrase(s) NOT gated:`)
for (const u of uncovered.slice(0, 20)) console.log(`     ${u.slice(0, 90)}`)
if (uncovered.length > 20) console.log(`     …and ${uncovered.length - 20} more`)
console.log('  (not all of these are claims — many are durations, versions or step counts.')
console.log('   Listed so the gap is visible; add one to CLAIMS when it becomes something said aloud.)')

if (bad) { console.log(`\n🚩 ${bad} spoken number(s) wrong or unmeasurable.`); process.exitCode = 1 }
else console.log('\n✅ every gated spoken number matches what the system reports')
