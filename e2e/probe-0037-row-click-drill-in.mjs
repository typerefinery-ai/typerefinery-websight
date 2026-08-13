/**
 * alpha-launch **decision 0037 (Option 1)** — does clicking the ROW drill in, as the docx specifies?
 *
 * Driven with Playwright rather than the Chrome bridge because docs/issues/0161's click-delivery
 * outage was active when this landed; Playwright reaches Chrome over CDP through a different path.
 *
 * ⚠️ Clicks the row of the incident that is **already current**, so the gesture is exercised without
 * switching the demo's default incident. The handler POSTs then navigates regardless, so navigation
 * is still the pass signal.
 *
 *     node e2e/probe-0037-row-click-drill-in.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/pages/incidents.html'

const browser = await chromium.launch({ channel: 'chrome' })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

const logs = []
page.on('console', (m) => logs.push(m.text()))
const posts = []
const responses = []
page.on('request', (r) => {
  if (r.method() === 'POST' && /set-current/.test(r.url())) posts.push(r.url())
})
// ⚠️ The handler only navigates when the POST is response.ok — so the STATUS is the whole story
// when the marker logs but the URL never changes.
page.on('response', async (r) => {
  if (!/set-current/.test(r.url())) return
  const body = await r.text().catch(() => '(unreadable)')
  responses.push(`${r.status()} ${r.ok() ? 'ok' : 'NOT-OK'} :: ${body.slice(0, 160)}`)
})

await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('tbody tr', { timeout: 30_000 })
await page.waitForTimeout(2_500)

const rows = await page.locator('tbody tr').count()
console.log(`rows: ${rows}`)

// Target the row that is already current, and click a plain CELL - never a button.
const target = page.locator('tbody tr').filter({ hasText: '511d2ab7' }).first()
const cell = target.locator('td').nth(1) // the Name cell: plain text, no controls
console.log(`clicking the Name cell of the already-current incident (no button involved)`)

const before = page.url()
await cell.click()
await page.waitForTimeout(6_000)
const after = page.url()

console.log(`\nurl before : ${before.split('/').pop()}`)
console.log(`url after  : ${after.split('/').pop()}`)
console.log(`set-current POSTs observed: ${posts.length}`)
responses.forEach(r=>console.log(`   response: ${r}`))
console.log(`console errors: ${logs.filter(l=>/failed with HTTP|not navigating/.test(l)).join(" | ") || "(none)"}`)

const marker = logs.filter((l) => /row-click navigation/.test(l))
console.log(`clientlib markers (${marker.length}):`)
marker.forEach((l) => console.log(`   ${l}`))

const navigated = after !== before
console.log(
  navigated
    ? '\n✅ PASS - clicking the row drilled in (decision 0037 Option 1 works)'
    : '\n🔴 the row click did not navigate',
)

await browser.close()
process.exit(navigated ? 0 : 1)
