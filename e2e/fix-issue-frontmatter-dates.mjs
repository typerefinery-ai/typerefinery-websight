/**
 * Register hygiene — bring a stale front-matter `updated:` up to the file's newest dated section.
 *
 * The 2026-08-15 assessment §6 counted ~15 issue files whose header date is contradicted by their
 * own body, which is why the goal file has to tell every reader "trust the newest dated section, not
 * the front matter". `audit-issue-index-drift.mjs` already *detects* this (it is 0130's lesson
 * operationalised); this is the applier for the same rule, using the identical detection so the two
 * can never disagree:
 *
 *   front-matter  ^updated: YYYY-MM-DD
 *   body          newest YYYY-MM-DD appearing in any `##`/`###` heading
 *
 * Only ever moves the date FORWARD, and only to a date the file itself already claims. It does not
 * invent dates, touch statuses, or edit prose — a heading date is the file's own statement about
 * when it was last worked, so this is transcription, not judgement.
 *
 * ⚠️ The docs tree is not under version control (docs/issues/0092), so there is no undo. The applier
 * writes a timestamped backup of every file it changes before touching it.
 *
 *     node e2e/fix-issue-frontmatter-dates.mjs            # report
 *     node e2e/fix-issue-frontmatter-dates.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const ISSUES = path.join(WORKSPACE, 'docs/issues')
const APPLY = process.argv.includes('--apply')
const STAMP = new Date().toISOString().replace(/[:.]/g, '-')
const BACKUP = path.join(WORKSPACE, 'docs/.backup', `frontmatter-dates-${STAMP}`)

const files = fs.readdirSync(ISSUES).filter((f) => /^\d{4}-.*\.md$/.test(f)).sort()
const stale = []

for (const name of files) {
  const file = path.join(ISSUES, name)
  const text = fs.readFileSync(file, 'utf8')
  const fmUpdated = text.match(/^updated:\s*(\d{4}-\d{2}-\d{2})/m)?.[1]
  if (!fmUpdated) continue
  const headingDates = [...text.matchAll(/^#{2,3} [^\n]*?(\d{4}-\d{2}-\d{2})/gm)].map((m) => m[1])
  const newest = headingDates.sort().slice(-1)[0]
  if (newest && newest > fmUpdated) stale.push({ name, file, text, fmUpdated, newest })
}

console.log(`${files.length} issue file(s) read · ${stale.length} with a stale front-matter date\n`)
for (const s of stale) console.log(`  ${s.name.slice(0, 4)}  updated: ${s.fmUpdated} -> ${s.newest}`)

if (!stale.length) process.exit(0)
if (!APPLY) {
  console.log('\ndry run — re-run with --apply to write')
  process.exit(0)
}

fs.mkdirSync(BACKUP, { recursive: true })
let written = 0
for (const s of stale) {
  fs.writeFileSync(path.join(BACKUP, s.name), s.text)
  // Anchored to the front matter: `updated:` at the start of a line, replaced once.
  const next = s.text.replace(/^updated:\s*\d{4}-\d{2}-\d{2}/m, `updated: ${s.newest}`)
  if (next === s.text) {
    console.log(`  ⚠️ ${s.name} — no substitution made, left alone`)
    continue
  }
  fs.writeFileSync(s.file, next)
  written++
}
console.log(`\napplied to ${written} file(s) · backups in docs/.backup/frontmatter-dates-${STAMP}`)
