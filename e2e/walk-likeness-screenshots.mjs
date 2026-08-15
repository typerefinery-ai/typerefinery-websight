/**
 * Likeness evidence pack — one real-browser screenshot per Act screen, for side-by-side review
 * against docs/mini-app-source/ mockups. Same instrument that settled 0179's stale title cell:
 * pane titles and widget chrome are drawn client-side, so grep cannot answer likeness
 * questions — screenshots can.
 *
 *     node e2e/walk-likeness-screenshots.mjs <outDir>
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = process.argv[2] || path.join(process.cwd(), 'likeness-screenshots')
fs.mkdirSync(outDir, { recursive: true })

const BASE = 'https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage'
const SHOTS = [
  // [name, url, ready-signal locator (frame-aware handled below), settle ms]
  ['act1-incidents', `${BASE}/pages/incidents.html`, { css: 'tbody tr' }, 3000],
  ['act2-overview', `${BASE}/forms/overview-local.html`, { frame: 'widgetdevoverview', css: 'svg g.node, svg image' }, 5000],
  ['act3-composer', `${BASE}/forms/composer-local.html`, { frame: 'widgetdevcomposer', css: 'svg.promo_svg image, svg.promo_svg g.node' }, 5000],
  ['act4-navigator', `${BASE}/pages/attack-navigator.html`, { frame: 'attack-navigator', css: '.matrix, matrix, td.technique-cell, .technique-cell' }, 8000],
  ['act5-identity-update', `${BASE}/forms/stixorm-forms/stix-forms/sdo-forms/identity-forms/identity-update.html`, { css: 'form' }, 4000],
  ['act0-landing', `${BASE}.html`, { css: 'body' }, 2000],
]

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  storageState: path.join(__dirname, '.auth', 'cms.json'),
  viewport: { width: 1600, height: 900 },
})

for (const [name, url, ready, settle] of SHOTS) {
  const page = await ctx.newPage()
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    const target = ready.frame ? page.frameLocator(`iframe[src*="${ready.frame}"]`) : page
    await target.locator(ready.css).first().waitFor({ timeout: 90_000 }).catch((e) => {
      console.log(`  ⚠️ ${name}: ready signal not seen (${e.message.split('\n')[0]}) — capturing anyway`)
    })
    await page.waitForTimeout(settle)
    await page.screenshot({ path: path.join(outDir, `${name}.png`) })
    console.log(`  📸 ${name}`)
  } catch (e) {
    console.log(`  🔴 ${name}: ${e.message.split('\n')[0]}`)
  } finally {
    await page.close()
  }
}
await browser.close()
console.log('pack written to', outDir)
