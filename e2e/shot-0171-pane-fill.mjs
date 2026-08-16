/**
 * docs/issues/0171 — capture what the Composer panes actually look like, on the staged incident.
 *
 * The issue has argued about pane fill since 2026-08-13 with no surviving image: its evidence link
 * points at `runs/2026-08-13T13-30-00Z-act3-screen/act3-pane-fill.png`, which was never saved (the
 * only broken link left in the docs tree). A likeness claim deserves a picture, so this takes one —
 * of the CURRENT state, in today's run directory, rather than pretending to reconstruct the old one.
 *
 *     node e2e/shot-0171-pane-fill.mjs <outdir>
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const P = '/content/typerefinery-showcase/pages/os-triage'
const STATE = path.join(__dirname, '.auth', 'cms.json')
const OUT = process.argv[2] || '.'
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1280, height: 800 },
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()

// The runsheet's Act 3 incident, via the same gesture the walks use (docs/issues/0189).
await page.goto(`${CMS}${P}/pages/incidents.html`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('tbody tr', { timeout: 40_000 }).catch(() => {})
await page.waitForTimeout(2_500)
const row = page.locator('tbody tr', { hasText: 'image5 walkthrough' }).first()
if (await row.count()) {
  await row.locator('td').nth(1).click()
  await page.waitForTimeout(8_000)
} else {
  console.log('⚠️ staged incident row not found — shooting whatever is current')
}

await page.goto(`${CMS}${P}/forms/composer-local.html`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(22_000)

const full = path.join(OUT, 'act3-composer.png')
await page.screenshot({ path: full })
console.log(`written: ${full}`)

// And the Promotable pane alone, which is what 0171 is actually about.
const frameEl = await page.locator('iframe[src*="widgetdevcomposer"]').first().elementHandle()
if (frameEl) {
  const shot = path.join(OUT, 'act3-pane-fill.png')
  await frameEl.screenshot({ path: shot })
  console.log(`written: ${shot}`)
}

await browser.close()
