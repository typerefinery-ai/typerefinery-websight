/**
 * Act 3 right-click gestures in **headed** Chrome — P3-S6 (Create SRO) and P3-S7 (Create Connection).
 *
 * These are the Act's product story: the widget raises an event, the host maps
 * `<componentAction>:<topic>` to a Flow API, the API writes, the pane re-reads. They were the last
 * headline gestures never driven by hand.
 *
 * ⚠️ Headed Playwright, not the Claude-in-Chrome bridge — docs/issues/0161's outage covers clicks
 * and keystrokes, so the bridge cannot pass the CMS login.
 *
 *     node e2e/walk-act3-rightclick.mjs <outdir>
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const OUT = process.argv[2] || '.'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html'

const results = []
const record = (s, v, n) => { results.push({ s, v, n }); console.log(`${v.padEnd(7)} ${s.padEnd(7)} ${n}`) }
const step = async (name, fn) => {
  try { await fn() } catch (e) { record(name, 'FAIL', 'threw: ' + String(e.message).split('\n')[0].slice(0, 86)) }
}

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

// ⚠️ 0148's toast shield is fixed at source (43c944f). Watch for its signature rather than assume.
let toastBlocks = 0
page.on('console', (m) => { if (/intercepts pointer events/.test(m.text())) toastBlocks++ })

await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(22_000)

const w = page.frameLocator('iframe[src*="widgetdevcomposer"]').first()
const promo = w.locator('svg.promo_svg image, svg.promo_svg g.node')
const scratch = w.locator('svg.scratch_svg image, svg.scratch_svg g.node')
const nPromo = await promo.count().catch(() => 0)
const nScratch = await scratch.count().catch(() => 0)
console.log(`panes: promo ${nPromo}, scratch ${nScratch}`)

const menuItems = async () =>
  (await w.locator('.contextmenu, [class*="context"], .menu').allInnerTexts().catch(() => []))
    .join(' ').replace(/\s+/g, ' ').trim().slice(0, 120)

// ---- P3-S6: select one node in each pane, right-click → Create SRO
await step('P3-S6', async () => {
  if (!nPromo || !nScratch) { record('P3-S6', 'FAIL', 'a pane is empty; cannot pair objects'); return }
  await promo.first().click()
  await page.waitForTimeout(1_500)
  await scratch.first().click()
  await page.waitForTimeout(1_500)
  await scratch.first().click({ button: 'right' })
  await page.waitForTimeout(2_500)

  const sroVisible = await w.getByText(/create sro/i).count().catch(() => 0)
  if (!sroVisible) { record('P3-S6', 'FAIL', `context menu did not offer Create SRO — menu: "${await menuItems()}"`); return }
  await w.getByText(/create sro/i).first().click()
  await page.waitForTimeout(8_000)
  const modal = page.frames().map((f) => f.url()).filter((u) => /modal-forms/.test(u))
  record('P3-S6', modal.length ? 'PASS' : 'FAIL',
    modal.length ? `SRO modal mounted → ${modal[0].split('/').pop()}` : 'menu clicked but no modal mounted')
  await page.screenshot({ path: path.join(OUT, 'act3-p3s6-sro.png') })
})

await page.keyboard.press('Escape').catch(() => {})
await page.waitForTimeout(2_000)

// ---- P3-S7: right-click → Create Connection
await step('P3-S7', async () => {
  await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(22_000)
  const w2 = page.frameLocator('iframe[src*="widgetdevcomposer"]').first()
  const p2 = w2.locator('svg.promo_svg image, svg.promo_svg g.node')
  await p2.first().click()
  await page.waitForTimeout(1_500)
  await p2.nth(1).click()
  await page.waitForTimeout(1_500)
  await p2.nth(1).click({ button: 'right' })
  await page.waitForTimeout(2_500)

  const connVisible = await w2.getByText(/create connection/i).count().catch(() => 0)
  if (!connVisible) { record('P3-S7', 'FAIL', 'context menu did not offer Create Connection'); return }
  await w2.getByText(/create connection/i).first().click()
  await page.waitForTimeout(8_000)
  const modal = page.frames().map((f) => f.url()).filter((u) => /modal-forms|foreign-key/.test(u))
  record('P3-S7', modal.length ? 'PASS' : 'FAIL',
    modal.length ? `Connection modal mounted → ${modal[0].split('/').pop()}` : 'menu clicked but no modal mounted')
  await page.screenshot({ path: path.join(OUT, 'act3-p3s7-connection.png') })
})

console.log(`\ntoast interceptions observed: ${toastBlocks}  (0148's signature — 0 expected after 43c944f)`)
console.log(`=== ${results.filter((r) => r.v === 'PASS').length}/${results.length} right-click gestures PASS`)
await browser.close()
