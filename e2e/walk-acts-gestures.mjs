/**
 * Gesture walk in **headed** Chrome — executes the Acts' headline interactions and reports
 * PASS / FAIL per step, so a validation run is not appearance-only.
 *
 * ⚠️ Driven by Playwright (`headless: false`) because docs/issues/0161's bridge outage now covers
 * clicks AND keystrokes, so the Claude-in-Chrome bridge cannot reach past the CMS login.
 *
 *     node e2e/walk-acts-gestures.mjs <outdir>
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const OUT = process.argv[2] || '.'
const P = '/content/typerefinery-showcase/pages/os-triage'

const results = []
const record = (step, verdict, note) => {
  results.push({ step, verdict, note })
  console.log(`${verdict.padEnd(5)} ${step.padEnd(7)} ${note}`)
}

/**
 * Run one gesture in isolation. ⚠️ A walk must report EVERY step: the first version let a timeout
 * throw and abort the run after P1-S3, so Acts 2 and 3 went unreported and the walk looked like it
 * had simply stopped rather than found something.
 */
const step = async (name, fn) => {
  try {
    await fn()
  } catch (e) {
    record(name, 'FAIL', 'threw: ' + String(e.message).split('\n')[0].slice(0, 88))
  }
}

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

// ---------- Act 1 ----------
await page.goto(`${CMS}${P}/pages/incidents.html`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('tbody tr', { timeout: 40_000 })
await page.waitForTimeout(3_000)

const rows = await page.locator('tbody tr').count()
record('P1-S1', rows > 0 ? 'PASS' : 'FAIL', `table renders ${rows} incident row(s)`)

// P1-S3 — the Create dropdown
await page.getByRole('button', { name: /\+?\s*create/i }).first().click()
await page.waitForTimeout(1_200)
const items = await page.locator('.dropdown-menu.show .dropdown-item').allInnerTexts().catch(() => [])
record('P1-S3', items.length >= 4 ? 'PASS' : 'FAIL', `dropdown: ${items.map((t) => t.trim()).join(' / ') || 'did not open'}`)

// P1-S4 — choosing Incident opens the modal
await step("P1-S4", async () => {
  await page.locator(".dropdown-menu.show .dropdown-item").filter({ hasText: /Incident/ }).first().click({ timeout: 15000 })
  await page.waitForTimeout(6_000)
  const modalUp = await page.locator(".modal.show").count()
  const modalSrc = await page.locator(".modal.show iframe").first().getAttribute("src").catch(() => null)
  record("P1-S4", modalUp > 0 ? "PASS" : "FAIL", "modal " + (modalUp ? "opened -> " + String(modalSrc).split("/").pop() : "did not open"))
})
await page.keyboard.press('Escape').catch(() => {})
await page.waitForTimeout(1_500)

// P1-S7 — row click drill-in (decision 0037 Option 1)
await page.goto(`${CMS}${P}/pages/incidents.html`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('tbody tr', { timeout: 40_000 })
await page.waitForTimeout(2_500)
const before = page.url()
await page.locator('tbody tr').first().locator('td').nth(1).click()
await page.waitForTimeout(8_000)
const after = page.url()
record('P1-S7', after !== before ? 'PASS' : 'FAIL',
  `row click → ${after !== before ? after.split('/').pop() : 'no navigation'}`)

// ---------- Act 2 ----------
await page.goto(`${CMS}${P}/forms/overview-local.html`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(18_000)
const viz = page.frameLocator('iframe[src*="widgetdevoverview"]').first()
const gnodes = await viz.locator('image, g.node').count().catch(() => 0)
record('P2-S1', gnodes > 1 ? 'PASS' : 'FAIL', `force graph renders ${gnodes} nodes`)

const formSrcNow = async () =>
  await page.locator('iframe[src*="stixorm-forms"]').first().getAttribute('src').catch(() => null)
const beforeForm = await formSrcNow()
await viz.locator('image, g.node').first().click()
let opened = null
for (let i = 0; i < 90; i++) {
  const s = await formSrcNow()
  if (s && s !== beforeForm) { opened = s; break }
  await page.waitForTimeout(300)
}
record('P2-S5', opened ? 'PASS' : 'FAIL',
  `left-select → ${opened ? opened.split('stixorm-forms/')[1] : 'form did not change'}`)
await page.screenshot({ path: path.join(OUT, 'gesture-act2-after-select.png') })

// ---------- Act 3 ----------
await page.goto(`${CMS}${P}/forms/composer-local.html`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(20_000)
const comp = page.frameLocator('iframe[src*="widgetdevcomposer"]').first()
const promo = await comp.locator('svg.promo_svg image, svg.promo_svg g.node').count().catch(() => 0)
const scratch = await comp.locator('svg.scratch_svg image, svg.scratch_svg g.node').count().catch(() => 0)
record('P3-S1', promo > 0 ? 'PASS' : 'FAIL', `panes render — Promotable ${promo}, Scratch ${scratch}`)

const beforeC = await formSrcNow()
await comp.locator('svg.promo_svg image, svg.promo_svg g.node').first().click()
let openedC = null
for (let i = 0; i < 90; i++) {
  const s = await formSrcNow()
  if (s && s !== beforeC) { openedC = s; break }
  await page.waitForTimeout(300)
}
record('P3-S5', openedC ? 'PASS' : 'FAIL',
  `left-select → ${openedC ? openedC.split('stixorm-forms/')[1] : 'form did not change'}`)
await page.screenshot({ path: path.join(OUT, 'gesture-act3-after-select.png') })

console.log(`\n=== ${results.filter((r) => r.verdict === 'PASS').length}/${results.length} gestures PASS`)
await browser.close()
