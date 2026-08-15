/**
 * P4-S1 — does the Attack Navigator actually render the matrix?
 *
 * 0176's history demands more than a 200: the toolbar drew while the matrix spun forever.
 * Assert tactic columns and technique cells exist, and capture console errors.
 *
 *     node e2e/probe-p4s1-matrix.mjs [outdir]
 */
import { chromium } from '@playwright/test'

const NAV = 'https://attack-navigator.typerefinery.localhost:8101/'
const OUT = process.argv[2]

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 } })).newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })

await page.goto(NAV, { waitUntil: 'domcontentloaded' })
// the app loads the collection index, then a "create new layer" flow may be needed —
// try the default landing first, then open a new enterprise layer if the matrix is absent
await page.waitForTimeout(8_000)

const openLayer = async () => {
  const create = page.locator('text=Create New Layer').first()
  if (await create.count()) {
    await create.click()
    await page.waitForTimeout(1_500)
    const enterprise = page.locator('text=Enterprise').first()
    if (await enterprise.count()) await enterprise.click()
    await page.waitForTimeout(12_000)
  }
}

let tactics = await page.locator('.tactic.name, th.tactic, .matrix .tactic').count()
if (!tactics) { await openLayer(); tactics = await page.locator('.tactic.name, th.tactic, .matrix .tactic').count() }
const techniques = await page.locator('.technique-cell, .technique').count()

console.log(`tactic headers: ${tactics}`)
console.log(`technique cells: ${techniques}`)
console.log(`console errors: ${errors.length}`)
for (const e of errors.slice(0, 5)) console.log(`  ${e}`)
if (OUT) await page.screenshot({ path: `${OUT}/p4s1-matrix.png`, fullPage: false })
console.log(tactics >= 10 && techniques > 100 ? '✅ P4-S1 PASS — matrix renders' : '🔴 P4-S1 FAIL — matrix absent or partial')
await browser.close()
process.exit(tactics >= 10 && techniques > 100 ? 0 : 1)
