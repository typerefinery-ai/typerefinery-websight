/**
 * Restore `current_incident` by driving the UI, the way a user would.
 *
 * ⚠️ Why the UI and not an API call. FastAPI (:8000) owns NO incident endpoint — it is a platform
 * layer and staying data-agnostic is deliberate (CLAUDE.md "Data-Agnostic Repositories"), so there
 * is no `/os-triage/set-current-incident` to POST to and inventing one would put domain knowledge in
 * the wrong repo. The incident switch belongs to a Flow, and the gesture that triggers it is P1-S7's
 * row drill-in. So this restores state by performing that gesture.
 *
 * This matters because P1-S7 is itself a validation step: every walk that exercises it CHANGES which
 * incident is current, which is why walk counts (27 nodes vs 28, panes 26/3 vs 59/6) differ between
 * passes. Restoring afterwards keeps the demo's canonical state stable.
 *
 *     node e2e/set-current-incident-by-ui.mjs <incident-uuid-stem>
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
// ⚠️ Note the second `/pages/` — the Incidents table lives at .../os-triage/pages/incidents.html,
// not .../os-triage/incidents.html. The shorter path loads a page with no table, which looks
// exactly like "the incident table is empty" and is worth zero panic.
const PAGE = '/content/typerefinery-showcase/pages/os-triage/pages/incidents.html'
const MAP = path.join(
  __dirname, '..', '..', 'typerefinery', 'services', 'fastapi', 'generated', 'os-triage',
  'context_mem', 'context_map.json',
)
const want = process.argv[2] || '511d2ab7'

const current = () => JSON.parse(fs.readFileSync(MAP, 'utf8')).current_incident
console.log(`current_incident before: ${current()}`)
if (current().includes(want)) { console.log('already current — nothing to do'); process.exit(0) }

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded' })
// ⚠️ WAIT for rows, do not guess a fixed delay. A first version used a flat 18 s and found 0 rows,
// which reads as "the table is empty" when it only means "not yet" — the table flow plus 0170's
// ~3 s per-page clientlib floor regularly needs longer. walk-acts-gestures.mjs waits 40 s and sees
// 3 rows on the same page.
await page.waitForSelector('tbody tr', { timeout: 40_000 })
await page.waitForTimeout(4_000)

let row = page.locator('tr', { hasText: want }).first()
if (!(await row.count())) {
  // The ID column may render a shortened or differently-formatted id, so say what IS on screen
  // rather than just failing — a silent "not found" hides whether the table loaded at all.
  const rows = await page.locator('tr').allInnerTexts()
  console.log(`no row mentions "${want}". Table has ${rows.length} row(s):`)
  rows.slice(0, 8).forEach((r, i) => console.log(`  ${i}: ${r.replace(/\s+/g, ' | ').slice(0, 160)}`))

  // Fall back to matching the incident NAME from context_map, which is what the table shows.
  const map = JSON.parse(fs.readFileSync(MAP, 'utf8'))
  const full = (map.incident_list || []).find((x) => String(x).includes(want))
  console.log(`\nfull id from context_map: ${full || '(not in incident_list)'}`)
  if (full) {
    const short = String(full).replace('incident--', '').slice(0, 8)
    row = page.locator('tr', { hasText: short }).first()
    console.log(`retrying with short id "${short}": ${(await row.count()) ? 'matched' : 'no match'}`)
  }
  if (!(await row.count())) { await browser.close(); process.exit(1) }
}
await row.click()
await page.waitForTimeout(12_000)
console.log(`landed on: ${page.url().split('/').pop()}`)
console.log(`current_incident after : ${current()}`)
console.log(current().includes(want) ? 'RESTORED' : 'NOT RESTORED — the drill-in did not switch it')
await browser.close()
