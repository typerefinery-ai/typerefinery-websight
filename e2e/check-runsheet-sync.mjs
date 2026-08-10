/**
 * Guard: the runsheet markdown and the Playwright STEPS catalogue must describe the same run.
 *
 * They drift silently otherwise — a step added to one and not the other still produces a green
 * suite, just a smaller one, and the run log then reports on a runsheet nobody is executing.
 * Titles are deliberately NOT compared: the markdown says what the operator *does*
 * ("Open the Incidents page") while the catalogue states the criterion being asserted
 * ("Incidents table renders above the fold, one row per incident").
 *
 *   node check-runsheet-sync.mjs        # exits non-zero on drift
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const mdPath = path.resolve(here, '..', '..', 'docs', 'mini-app-runsheet.md')
const tsPath = path.join(here, 'runsheet.ts')

const md = fs.readFileSync(mdPath, 'utf8')
const ts = fs.readFileSync(tsPath, 'utf8')

// Step rows start a markdown table row: "| P1-S3 | ...". The same ID may also appear in the
// Blockers/rollup tables, so collapse to a set.
const mdIds = new Set([...md.matchAll(/^\|\s*(P\d-S\d+)\s*\|/gm)].map((m) => m[1]))
const tsIds = new Set([...ts.matchAll(/^\s*'(P\d-S\d+)':/gm)].map((m) => m[1]))

const missingFromTs = [...mdIds].filter((id) => !tsIds.has(id)).sort()
const missingFromMd = [...tsIds].filter((id) => !mdIds.has(id)).sort()

if (missingFromTs.length || missingFromMd.length) {
  console.error('runsheet drift detected:\n')
  if (missingFromTs.length) {
    console.error(`  in ${path.basename(mdPath)} but not in runsheet.ts (no test asserts these):`)
    console.error(`    ${missingFromTs.join(', ')}\n`)
  }
  if (missingFromMd.length) {
    console.error(`  in runsheet.ts but not in ${path.basename(mdPath)} (tested but undocumented):`)
    console.error(`    ${missingFromMd.join(', ')}\n`)
  }
  process.exit(1)
}

/**
 * Structural check on the step tables themselves.
 *
 * ⚠️ The ID comparison above passed happily for several ticks while two rows were MALFORMED — an
 * edit had eaten a column delimiter, merging a status note into the Expected cell, and another row
 * carried a fifth column in a four-column table. Neither showed up, because counting IDs says
 * nothing about the shape of the row the ID sits in.
 *
 * Step tables are the ones headed "| ID | Action | Expected result | Status |". Rows inside them
 * must have exactly four cells and a status glyph in the last one. Rows elsewhere (Blockers, the
 * rollup, per-act notes) legitimately have other shapes and are left alone.
 */
const STATUS = ['\u2705', '\u25d0', '\u274c', '\u2b1c'] // pass / partial / fail / never exercised
const lines = md.split('\n')
const problems = []
let inStepTable = false

lines.forEach((line, i) => {
  if (/^\|\s*ID\s*\|\s*Action\s*\|\s*Expected result\s*\|\s*Status\s*\|/.test(line)) {
    inStepTable = true
    return
  }
  if (inStepTable && !line.trim().startsWith('|')) {
    inStepTable = false
    return
  }
  if (!inStepTable) return
  if (/^\|[-\s|]+\|$/.test(line)) return // separator row

  const m = /^\|\s*(P\d-S\d+)\s*\|/.exec(line)
  if (!m) return
  const cells = line.split('|')
  // "| a | b | c | d |" splits to ['', a, b, c, d, ''] — six parts for four cells.
  if (cells.length !== 6) {
    problems.push(`line ${i + 1}: ${m[1]} has ${cells.length - 2} cells, expected 4 (a delimiter was lost or added)`)
    return
  }
  const status = cells[4].trim()
  if (!STATUS.some((g) => status.startsWith(g))) {
    problems.push(`line ${i + 1}: ${m[1]} has no status glyph — starts "${status.slice(0, 40)}"`)
  }
})

if (problems.length) {
  console.error('runsheet step table is malformed:\n')
  problems.forEach((p) => console.error(`  ${p}`))
  console.error('')
  process.exit(1)
}

console.log(`runsheet in sync and well-formed: ${mdIds.size} steps in both mini-app-runsheet.md and runsheet.ts`)
