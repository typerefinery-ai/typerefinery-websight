/**
 * decision 0036 Option 2 — capture the Composer with the authored image5 incident current.
 *
 * Uses Playwright because the Chrome bridge's click AND keystroke delivery were both out
 * (docs/issues/0161), so the CMS login could not be re-established by hand this tick.
 *
 *     node e2e/probe-0036-image5-composer.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html'
const OUT = process.argv[2] || 'act3-composer-image5.png'

const browser = await chromium.launch({ channel: 'chrome' })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1500, height: 1000 },
  })
).newPage()

await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(20_000)

const widget = page.frameLocator('iframe[src*="widgetdevcomposer"], iframe[src*="4005"]').first()
const count = async (pane) => await widget.locator(`${pane} image, ${pane} g.node`).count()
const labels = async (pane) =>
  (await widget.locator(`${pane} text`).allInnerTexts()).map((t) => t.trim()).filter(Boolean)

const promo = await count('svg.promo_svg').catch(() => -1)
const scratch = await count('svg.scratch_svg').catch(() => -1)
console.log(`rendered nodes -> promo: ${promo}, scratch: ${scratch}`)
console.log(`promo labels  : ${(await labels('svg.promo_svg').catch(() => [])).join(' · ')}`)
console.log(`scratch labels: ${(await labels('svg.scratch_svg').catch(() => [])).join(' · ')}`)

await page.screenshot({ path: OUT, fullPage: false })
console.log(`\nscreenshot -> ${OUT}`)
await browser.close()
