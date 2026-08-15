/**
 * docs/issues/0179 — settle the pane-title question with the only honest instrument: a
 * real-browser screenshot of composer-local, plus the page's visible text for the record.
 *
 *     node e2e/walk-composer-screenshot.mjs <outDir>
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const outDir = process.argv[2] || path.join(process.cwd(), 'composer-screenshot')
fs.mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  storageState: new URL('./.auth/cms.json', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
  viewport: { width: 1600, height: 900 },
})
const page = await ctx.newPage()
await page.goto(
  'https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html',
  { waitUntil: 'domcontentloaded', timeout: 60_000 },
)
// wait for the composer iframe's panes (same signal the gesture walk uses)
const comp = page.frameLocator('iframe[src*="widgetdevcomposer"]')
await comp.locator('svg.promo_svg image, svg.promo_svg g.node').first().waitFor({ timeout: 90_000 })
await page.waitForTimeout(4000) // let labels/titles paint

await page.screenshot({ path: path.join(outDir, 'composer-local.png'), fullPage: false })

// visible text of the host page and the widget frame, for the record
const hostText = (await page.locator('body').innerText().catch(() => '')).slice(0, 1500)
let frameText = ''
try {
  frameText = (await comp.locator('body').innerText({ timeout: 10_000 })).slice(0, 1500)
} catch {}
fs.writeFileSync(path.join(outDir, 'visible-text.txt'),
  '=== host page visible text ===\n' + hostText + '\n\n=== composer widget frame visible text ===\n' + frameText + '\n')
console.log('screenshot + visible text written to', outDir)
await browser.close()
