/**
 * Does `docs/issues/README.md`'s index agree with each issue file's own `status:` frontmatter?
 *
 * 🔑 **Why this and not a prose check.** The first attempt at catching stale docs scanned narrative
 * text for "a resolved issue described as a live problem". It was tuned twice and still produced
 * **28 candidates from 390 citations, most of them legitimate** — cautionary prose like *"33 routes
 * that answer 200 and save nothing are worse than 404s"* reads exactly like a stale claim to a regex.
 * A check that cries wolf is worse than no check, so that heuristic was abandoned rather than shipped.
 *
 * This asks a question with an exact answer instead: **two records of the same fact, compared.** The
 * index and the frontmatter must agree; when they do not, one of them is wrong and a human can see
 * which in seconds. No language model, no guessing, no false positives.
 *
 * ⚠️ Index drift is a real hazard here, not a theoretical one: CLAUDE.md requires the index be kept
 * in sync by hand on every issue change, and that is exactly the kind of duplicated bookkeeping that
 * rots quietly.
 *
 *     node e2e/audit-issue-index-drift.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ISSUES = path.resolve(__dirname, '../../docs/issues')

/** Collapse a status phrase to its state word, so wording differences are not reported as drift. */
const normalise = (s) => {
  const full = String(s || '').toLowerCase()
  /**
   * ⚠️ **Read the LEADING state word, not any state word.** First cut scanned the whole string in a
   * fixed order and mis-read 0084, whose status is *"Open — narrowed to the 2 missing forms; the
   * click strand is **CLOSED**"*: it matched `closed` from the explanatory tail and reported the file
   * as resolved. A status line here routinely narrates history after the state, so only the opening
   * clause is the state.
   */
  const lead = full.split(/[—\-–(]/)[0].replace(/[*`]/g, '').trim()
  const pick = (t) => {
    if (/reopen/.test(t)) return 'open' // "Reopened" is an open issue
    if (/partly|partial/.test(t)) return 'partly resolved'
    /**
     * ⚠️ Test `superseded` BEFORE `resolved`, and before the generic branches. A superseded issue is
     * not resolved — it was replaced — and the project writes it two ways: bare `Superseded` in
     * frontmatter, and `**Superseded by [0064](…)**` in the index. Both must land on one state or
     * every superseded issue reads as drift.
     */
    if (/supersed/.test(t)) return 'superseded'
    if (/duplicate/.test(t)) return 'superseded' // a duplicate is likewise replaced, not fixed
    if (/resolved|closed|fixed/.test(t)) return 'resolved'
    if (/blocked/.test(t)) return 'blocked'
    if (/in progress/.test(t)) return 'in progress'
    if (/open/.test(t)) return 'open'
    return null
  }
  /**
   * ⚠️ **Trim before the last-resort split.** Untrimmed, a leading space makes
   * `split(/[\s—-]/)[0]` return `''`, which falls through to `(none)` — so the SAME unhandled state
   * normalised to `superseded` from frontmatter (no leading space) and `(none)` from a table cell
   * (padded), and 0063 was reported as drift for years-shaped nothing. The state word must not
   * depend on whitespace that markdown tables add for free.
   */
  return pick(lead) || pick(full) || full.trim().split(/[\s—-]/)[0] || '(none)'
}

const frontmatterStatus = (file) => {
  const head = fs.readFileSync(file, 'utf8').slice(0, 1500)
  const m = /^status:\s*(.+)$/m.exec(head)
  return m ? m[1].split('#')[0].trim() : null
}

const indexText = fs.readFileSync(path.join(ISSUES, 'README.md'), 'utf8')

/**
 * Locate the Status column from the header rather than hardcoding it, so adding a column upstream
 * cannot silently make every comparison read the wrong cell — a failure that would look like
 * "no drift" and be trusted.
 */
const headerRow = indexText
  .split('\n')
  .find((l) => /^\|/.test(l) && /\bStatus\b/.test(l) && /\bSeverity\b/.test(l))
if (!headerRow) {
  console.error('FAIL - could not find the index table header; refusing to guess the Status column')
  process.exit(1)
}
const HEADER_CELLS = headerRow.split("|").length
const STATUS_COL = headerRow.split('|').findIndex((c) => c.trim().toLowerCase() === 'status')
console.log(`index Status column = ${STATUS_COL} (from the header row)\n`)

/**
 * The index rows for an issue.
 *
 * ⚠️ **Plural on purpose.** Measured: `0142` has **three** rows in the index, carrying *Open*,
 * *Resolved* and *Partially resolved*. A single-row lookup would compare against whichever came
 * first and silently ignore the contradiction — the exact "trusted a signal that could not see the
 * problem" failure this script was written to avoid. Duplicates are reported in their own right;
 * see docs/issues/0130 for how the index acquired them.
 */
const indexRowsFor = (id) =>
  indexText.split('\n').filter((l) => {
    if (!l.startsWith('|')) return false
    /**
     * ⚠️ **Match the ID CELL, not the line.** The first version tested the whole row and reported
     * `0142` as having three index rows and `0158` two — wrong. Those rows belong to *other* issues
     * whose narrative **links to** 0142/0158; the index rows are paragraphs full of cross-references.
     *
     * This is docs/issues/0048's own finding turned on its author: *"a locator whose match set is
     * wider than the thing under test"*. The ID column is the only cell that identifies the row.
     */
    const idCell = l.split('|')[1] ?? ''
    return new RegExp(`\\(\\./${id}-`).test(idCell)
  })

let checked = 0
let drift = 0
let missing = 0
let duplicated = 0
let malformed = 0
let collisions = 0

for (const name of fs.readdirSync(ISSUES).filter((f) => /^\d{4}-.*\.md$/.test(f)).sort()) {
  const id = name.slice(0, 4)
  const fmRaw = frontmatterStatus(path.join(ISSUES, name))
  if (!fmRaw) {
    console.log(`${id}  ⚠️ no status: in frontmatter`)
    continue
  }
  const rows = indexRowsFor(id)
  if (!rows.length) {
    missing++
    console.log(`${id}  ⚠️ NOT IN THE INDEX — ${fmRaw.slice(0, 50)}`)
    continue
  }
  if (rows.length > 1) {
    duplicated++
    const states = rows.map((r) => normalise(r.split('|')[STATUS_COL] ?? ''))
    console.log(`${id}  ⚠️ ${rows.length} INDEX ROWS — Status cells say: ${states.join(' / ')}`)
  }
  const row = rows[0]

  /**
   * ⚠️ **Compare the file the row LINKS TO — an ID does not identify a file here.**
   * `0078` and `0165` each have TWO files: a live one and a superseded duplicate that kept the
   * number. The outer loop walks *files*, so both looked up the same row and the superseded twin was
   * reported as status drift every run — a guaranteed false positive for every collision, and the
   * reason this audit claimed 4 disagreements when there were 1.
   *
   * The index row names its file explicitly, so use that and stop guessing. A file that shares the
   * ID but is not the one linked is an **ID COLLISION** — a real finding, and a different one from
   * drift. Reporting it as drift hides it behind a status mismatch nobody can act on.
   */
  const linked = (/\(\.\/(\d{4}-[^)]+\.md)\)/.exec(row.split('|')[1] ?? '') || [])[1]
  if (linked && linked !== name) {
    collisions++
    console.log(
      `${id}  ⚠️ ID COLLISION — "${name}" shares id ${id} but the index links "${linked}". ` +
      `Status not compared (this file's own status is "${fmRaw.slice(0, 40)}").`,
    )
    continue
  }
  checked++

  /**
   * ⚠️ **Compare the STATUS CELL, not "any cell that names a state".** The looser version reported
   * 0093 as drifting because its *Title* cell narrates *"…now resolved…"* — the rows here are
   * paragraphs, so state words appear all over them. The table's header is
   * `| ID | Title | Repository | Severity | Status | PR | GitHub |`, so the status is a known
   * column and there is no need to guess.
   */
  const cells = row.split('|')

  /**
   * ⚠️ **A row with the wrong cell count makes every column comparison meaningless — silently.**
   * Measured: `0081`'s "Status" cell reads `**High**`, which is a *Severity* value. The row is short
   * a cell, so everything after the gap is read one column to the left and the audit would report a
   * confident, wrong answer. Check the shape before trusting the contents.
   */
  if (cells.length !== HEADER_CELLS) {
    malformed++
    console.log(
      `${id}  ⚠️ MALFORMED ROW — ${cells.length - 2} cells, header has ${HEADER_CELLS - 2}; ` +
      `column comparison skipped (its "Status" cell reads "${(cells[STATUS_COL] ?? '').trim().slice(0, 24)}")`,
    )
    continue
  }

  const statusCell = cells[STATUS_COL]
  if (statusCell === undefined) continue

  const fm = normalise(fmRaw)
  const idx = normalise(statusCell)
  if (fm !== idx) {
    drift++
    console.log(`${id}  DRIFT — file says "${fm}", index Status column says "${idx}"`)
    console.log(`        frontmatter: ${fmRaw.slice(0, 80)}`)
  }
}

console.log(
  `\n${checked} issue(s) cross-checked · ${drift} status disagreement(s) · ` +
  `${duplicated} with duplicate index rows · ${collisions} id collision(s) · ` +
  `${malformed} malformed row(s) · ${missing} absent from the index.`,
)
if (!drift && !missing && !duplicated && !malformed && !collisions) {
  console.log('index and frontmatter agree throughout.')
}
