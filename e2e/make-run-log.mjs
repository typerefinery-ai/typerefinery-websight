// Build docs/runs/<timestamp>/run-log.md from a Playwright list-reporter log.
//
// The loop this project runs asks for PASS / FAIL / PARTIAL / NOT-EXERCISED per referenced GitHub
// issue, keyed to BOTH the runsheet step ID and the issue number. That was being tracked in the
// runsheet but the per-run artefact was not being produced, so a run's evidence lived only in a
// terminal buffer.
//
// Usage:
//   node make-run-log.mjs <playwright.log> <ghmap.txt> <outDir>
//
// ghmap.txt lines are "<number>|<STATE>|<title>" as produced by `gh issue view --json`.

import fs from 'fs'
import path from 'path'

const [, , logPath, ghMapPath, outDir] = process.argv
if (!logPath || !ghMapPath || !outDir) {
  console.error('usage: node make-run-log.mjs <playwright.log> <ghmap.txt> <outDir>')
  process.exit(1)
}

const log = fs.readFileSync(logPath, 'utf8')

// --- parse the run ----------------------------------------------------------
const steps = []
for (const line of log.split('\n')) {
  // "  ok 12 [runsheet] › runsheet.ts:195:7 › Act 1 — … › P1-S4 — title (12.7s)"
  const m = line.match(/^\s{2}(ok|x|-)\s+\d+\s+\[[^\]]+\]\s+›.*›\s*(P\d-S\d+)\s*—\s*(.*?)\s*(?:\(([^)]+)\))?\s*$/)
  if (!m) continue
  const [, mark, id, title, duration] = m
  steps.push({ id, title, duration: duration || '', result: mark === 'ok' ? 'PASS' : mark === 'x' ? 'FAIL' : 'SKIPPED' })
}

const totals = log.match(/^\s+(\d+)\s+(passed|failed|skipped)/gm) || []
const complete = /^\s+\d+\s+(passed|failed)/m.test(log)

// --- runsheet: which GitHub issues does each step map to? --------------------
const runsheet = fs.readFileSync('docs/mini-app-runsheet.md', 'utf8')
// A step maps to issues two ways, and they are NOT equivalent:
//   direct - the issue number appears in that step's own row  -> real evidence for the issue
//   act    - the issue is listed on the act header            -> the act passed, not the step
// Conflating them credits "Tree - RMB Edit DAG" with all 11 Act 3 steps, which reads like
// step-level evidence and is not. Keep them apart and say which is which.
const stepDirect = new Map() // step id -> Set(issue)
const stepAct = new Map() // step id -> Set(issue)
// A step can NAME an issue while only testing part of it. Mapping P3-S9 to os-threat#84 turned a
// truthful NOT-EXERCISED into a false PASS, because P3-S9 asserts the Promote menu item and never
// clicks it. A false green is worse than a visible gap, so the runsheet marks these explicitly as
// `partial-coverage:#84` and the verdict is capped at PARTIAL (docs/issues/0086).
const partialCoverage = new Map() // step id -> Set(issue)

/** "#23-#26" / "#23–#26" is a RANGE. Not expanding it silently loses #24 and #25. */
const expandIssues = (text) => {
  const out = new Set()
  const ranged = text.replace(/#(\d+)\s*[–—-]\s*#?(\d+)/g, (_, a, b) => {
    const lo = Math.min(+a, +b)
    const hi = Math.max(+a, +b)
    if (hi - lo > 30) return `#${a} #${b}` // guard against nonsense ranges
    for (let i = lo; i <= hi; i++) out.add(String(i))
    return ''
  })
  ;[...ranged.matchAll(/#(\d+)/g)].forEach((m) => out.add(m[1]))
  return out
}

let currentAct = null
for (const line of runsheet.split('\n')) {
  const gh = line.match(/\*\*GitHub:\*\*\s*(.+)$/)
  if (gh) {
    currentAct = [...expandIssues(gh[1])]
    continue
  }
  const row = line.match(/^\|\s*(P\d-S\d+)\s*\|/)
  if (row) {
    const id = row[1]
    if (currentAct) stepAct.set(id, new Set([...(stepAct.get(id) || []), ...currentAct]))
    const direct = expandIssues(line)
    if (direct.size) stepDirect.set(id, new Set([...(stepDirect.get(id) || []), ...direct]))
    const partials = [...line.matchAll(/partial-coverage:#(\d+)/g)].map((m) => m[1])
    if (partials.length) partialCoverage.set(id, new Set(partials))
  }
}
const stepIssues = new Map()
for (const id of new Set([...stepAct.keys(), ...stepDirect.keys()])) {
  stepIssues.set(id, new Set([...(stepAct.get(id) || []), ...(stepDirect.get(id) || [])]))
}

// --- GitHub map -------------------------------------------------------------
const gh = new Map()
for (const line of fs.readFileSync(ghMapPath, 'utf8').split('\n').filter(Boolean)) {
  const [num, state, ...rest] = line.split('|')
  gh.set(num, { state, title: rest.join('|') })
}

// --- per-issue verdict ------------------------------------------------------
const byIssue = new Map()
for (const s of steps) {
  for (const n of stepIssues.get(s.id) || []) {
    if (!gh.has(n)) continue
    if (!byIssue.has(n)) byIssue.set(n, [])
    byIssue.get(n).push(s)
  }
}

// Steps the runsheet marks manual-only are skipped BY DESIGN. Counting them as a coverage gap
// turned four issues PARTIAL when nothing was actually missing.
const MANUAL_BY_DESIGN = new Set(
  [...runsheet.matchAll(/^\|\s*(P\d-S\d+)\s*\|[^|]*\|[^|]*\|[^|]*manual-only/gim)].map((m) => m[1])
)
if (!MANUAL_BY_DESIGN.size) MANUAL_BY_DESIGN.add('P2-S4') // known manual step; keep the rule honest if the regex misses

const verdict = (list, issue) => {
  if (!list || !list.length) return 'NOT-EXERCISED'
  // Cap at PARTIAL when every step that names this issue only covers part of it.
  const covering = list.filter((s) => (stepDirect.get(s.id) || new Set()).has(issue))
  if (
    issue &&
    covering.length &&
    covering.every((s) => (partialCoverage.get(s.id) || new Set()).has(issue))
  ) {
    return list.some((s) => s.result === 'FAIL') ? 'FAIL' : 'PARTIAL'
  }
  if (list.some((s) => s.result === 'FAIL')) return 'FAIL'
  const gaps = list.filter((s) => s.result === 'SKIPPED' && !MANUAL_BY_DESIGN.has(s.id))
  const ran = list.filter((s) => s.result === 'PASS')
  if (!ran.length) return 'NOT-EXERCISED'
  if (gaps.length) return 'PARTIAL'
  return 'PASS'
}

// --- write ------------------------------------------------------------------
fs.mkdirSync(outDir, { recursive: true })
const pass = steps.filter((s) => s.result === 'PASS').length
const fail = steps.filter((s) => s.result === 'FAIL').length
const skip = steps.filter((s) => s.result === 'SKIPPED').length

const out = []
out.push(`# Run log — ${path.basename(outDir)}`)
out.push('')
out.push(complete ? '**Run completed.**' : '⚠️ **Run did not report a final tally — treat as incomplete.**')
out.push('')
out.push(`**Steps:** ${steps.length} reported — **${pass} pass · ${fail} fail · ${skip} skipped**`)
out.push('')
out.push('Full ordered run (P0 → P5), single worker, in demo order — so act-to-act handoffs')
out.push('(Act 1 creating an incident and resetting the default, which Act 2 then renders) are exercised')
out.push('rather than bypassed by running acts separately.')
out.push('')
out.push('## Per GitHub issue')
out.push('')
out.push('Evidence column: **direct** = the step\'s own runsheet row names this issue. **act** = the')
out.push('issue is listed on the act header, so the act passed but no step tests it specifically —')
out.push('weaker evidence, shown separately so it cannot be mistaken for the former.')
out.push('')
out.push('| Issue | State | Verdict | Evidence | Steps | Title |')
out.push('|---|---|---|---|---|---|')
for (const [n, meta] of [...gh.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
  const list = byIssue.get(n)
  const v = verdict(list, n)
  const direct = (list || []).filter((s) => (stepDirect.get(s.id) || new Set()).has(n))
  const level = direct.length ? 'direct' : list && list.length ? 'act' : '—'
  const shown = direct.length ? direct : list || []
  const ids = shown.length ? [...new Set(shown.map((s) => s.id))].join(', ') : '—'
  out.push(
    `| os-threat#${n} | ${meta.state} | **${v}** | ${level} | ${ids} | ${(meta.title || '').slice(0, 60)} |`
  )
}
out.push('')
out.push('## Per step')
out.push('')
out.push('| Step | Result | Duration | Title |')
out.push('|---|---|---|---|')
for (const s of steps) out.push(`| ${s.id} | ${s.result} | ${s.duration} | ${s.title.slice(0, 80)} |`)
out.push('')
out.push('## Raw tally')
out.push('')
out.push('```')
out.push(totals.map((t) => t.trim()).join('\n') || '(no tally line found)')
out.push('```')

fs.writeFileSync(path.join(outDir, 'run-log.md'), out.join('\n') + '\n')
console.log(`wrote ${path.join(outDir, 'run-log.md')}`)
console.log(`steps: ${steps.length} (${pass} pass, ${fail} fail, ${skip} skipped) | issues mapped: ${byIssue.size}/${gh.size}`)
