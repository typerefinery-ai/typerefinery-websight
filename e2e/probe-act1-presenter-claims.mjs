/**
 * Act 1's presenter claims, checked against the rendered page.
 *
 * The runsheet's "What you should see" column is the last unverified part of the demo document:
 * URLs, commands, ports and service states are gated now, but *"you will see these columns"* is a
 * claim about a screen. docs/issues/0196 showed what an unverified instruction costs, and Act 1 is
 * the first screen an investor sees — CLAUDE.md rates a gap there above a deeper bug later.
 *
 * Checks step 1's column list, step 1a's two named demo rows, and step 3's button label, exactly as
 * the runsheet words them.
 *
 *     node e2e/probe-act1-presenter-claims.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const PAGE = `${CMS}/content/typerefinery-showcase/pages/os-triage/pages/incidents.html`
const STATE = path.join(__dirname, '.auth', 'cms.json')

/** Exactly as the presenter runsheet words them. */
const CLAIMS = {
  // ⚠️ Corrected 2026-08-17. The runsheet omitted **Tags** — see docs/issues/0197. Tags is one of the
  // docx design's own columns, so the document was under-selling its own first screen.
  columns: ['ID', 'Name', 'Tags', 'Status', 'Observed', 'Created', 'Tasks', 'Action'],
  rows: ['Potential phishing email - Naive Smith', '(earlier capture)'],
  button: 'New Incident',
}

if (!fs.existsSync(STATE)) {
  console.error(`no auth state at ${STATE} — run: ./node_modules/.bin/playwright test --project=setup`)
  process.exit(2)
}
const browser = await chromium.launch()
const ctx = await browser.newContext({ storageState: STATE, ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()
await page.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 60_000 })
for (let i = 0; i < 60 && (await page.locator('table tbody tr').count()) === 0; i++) await page.waitForTimeout(250)

const headers = (await page.locator('table thead th').allInnerTexts()).map((h) => h.trim()).filter(Boolean)
const rowText = (await page.locator('table tbody tr').allInnerTexts()).map((r) => r.replace(/\s+/g, ' ').trim())
const searchBoxes = await page.locator('input[type="search"], input[placeholder*="earch"]').count()
const rowButtons = await page.locator('table tbody tr button, table tbody tr a.btn').count()
const bodyText = await page.locator('body').innerText()

let bad = 0
const say = (ok, label, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok ' : '🚩 '} ${label}${detail ? ` — ${detail}` : ''}`) }

console.log(`rendered columns (${headers.length}): ${headers.join(' · ')}\n`)

// ⚠️ Compare as an ORDERED list. "the columns are present" and "the columns read like this" are
// different claims, and the runsheet makes the second — it prints them in order, separated by ·.
const shown = headers.filter((h) => h)
say(JSON.stringify(shown) === JSON.stringify(CLAIMS.columns),
  'step 1: the column list matches the runsheet, in order',
  `runsheet says ${CLAIMS.columns.join(' · ')}`)

say(searchBoxes > 0, 'step 1: a search box', `${searchBoxes} found`)
say(rowButtons > 0, 'step 1: per-row buttons', `${rowButtons} found`)

for (const r of CLAIMS.rows) {
  say(rowText.some((t) => t.includes(r)), `step 1a: a row reads "${r}"`,
    rowText.some((t) => t.includes(r)) ? '' : `${rowText.length} row(s) on screen`)
}

say(bodyText.includes(CLAIMS.button), `step 3: a "${CLAIMS.button}" button`,
  bodyText.includes('+ Create') ? 'note: "+ Create" also present' : '')

await page.screenshot({ path: path.join(__dirname, 'probe-act1-presenter-claims.png'), fullPage: false })
fs.writeFileSync(path.join(__dirname, 'probe-act1-presenter-claims.json'),
  JSON.stringify({ headers, rows: rowText.slice(0, 10), searchBoxes, rowButtons }, null, 2))

console.log(bad ? `\n🚩 ${bad} presenter claim(s) do not match the screen.` : '\n✅ every Act 1 presenter claim matches the screen')
if (bad) process.exitCode = 1
await browser.close()
