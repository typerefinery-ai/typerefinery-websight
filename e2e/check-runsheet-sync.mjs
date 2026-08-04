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

console.log(`runsheet in sync: ${mdIds.size} steps in both mini-app-runsheet.md and runsheet.ts`)
