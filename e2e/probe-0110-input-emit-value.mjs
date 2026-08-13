/**
 * docs/issues/0110 — the toolbar Search is wired but does not filter. WHY?
 *
 * The authored wiring is present and correct (read live from the CMS):
 *   input_1/field  _events_/0 = {type: emit,   action: INPUT_CHANGE, topic: incidents-table-filter}
 *   table          _events_/0 = {type: FILTER, action: FILTER,       topic: incidents-table-filter}
 *
 * and the input clientlib DOES attach a `change` listener for INPUT_CHANGE in its emit branch. Yet
 * committing a term filters nothing.
 *
 * Suspected cause, from reading `forms/fields/input/clientlibs/functions.js`:
 *
 *     const value = $input.attr('value');
 *
 * `.attr('value')` reads the HTML ATTRIBUTE, not the live DOM property. For a text box the user has
 * typed into, the attribute still holds whatever was authored (usually nothing) while `.val()` holds
 * the typed text. The emit would then carry `value: undefined`, and `eventOnFilter` bails with
 * "no term in event, ignoring" — filtering nothing, silently.
 *
 * ⚠️ This probe does NOT assume that. It captures the browser console UNFILTERED around the commit,
 * so the actual emitted payload and the handler's own words decide it. A previous probe filtered
 * console lines to /registerEvents|eventOnFilter|emitEvent/ and so could not see the change
 * listener attaching or the handler's bail-out message — narrow capture hid the evidence.
 *
 *     node e2e/probe-0110-input-emit-value.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PAGE = 'https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage/pages/incidents.html'
const STORAGE = path.join(__dirname, '.auth', 'cms.json')

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: fs.existsSync(STORAGE) ? STORAGE : undefined,
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

const lines = []
page.on('console', (m) => lines.push(m.text().replace(/\s+/g, ' ').slice(0, 200)))

await page.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 120_000 })
await page.locator('table:has(tbody tr) tbody tr').first().waitFor({ timeout: 120_000 })
await page.waitForTimeout(4_000)

const rowsBefore = await page.locator('table tbody tr').count()
const box = page.locator('input[name="case"], input[placeholder="Incident 1"]').first()
const found = await box.count()
console.log(`rows before: ${rowsBefore}   toolbar box found: ${found > 0}`)
if (!found) { console.log('no toolbar box — cannot probe'); await browser.close(); process.exit(1) }

// Read both the attribute and the property BEFORE and AFTER typing, which is the whole question.
const readBoth = async (label) => {
  const r = await box.evaluate((el) => ({ attr: el.getAttribute('value'), prop: el.value }))
  console.log(`  ${label.padEnd(18)} getAttribute('value')=${JSON.stringify(r.attr)}   .value=${JSON.stringify(r.prop)}`)
  return r
}
await readBoth('before typing')

const mark = lines.length
await box.click()
await box.fill('Naive')
await readBoth('after typing')
// COMMIT — the input emits on `change`, so typing alone proves nothing.
await box.press('Enter')
await page.waitForTimeout(1_500)
await box.blur().catch(() => {})
await page.waitForTimeout(4_000)
await readBoth('after commit')

const rowsAfter = await page.locator('table tbody tr').count()
console.log(`\nrows after commit: ${rowsAfter}  (before ${rowsBefore}) → ${rowsAfter < rowsBefore ? 'FILTERED ✅' : 'NOT FILTERED ❌'}`)

console.log('\nconsole around the commit:')
lines.slice(mark).filter((l) =>
  /change|emit|filter|INPUT_CHANGE|no term|handleEventAction|topic/i.test(l),
).slice(0, 22).forEach((l) => console.log('  ' + l))

await browser.close()
