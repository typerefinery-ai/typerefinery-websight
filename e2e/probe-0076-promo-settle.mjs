/**
 * alpha-launch 0076 — does the Promo force simulation ever settle at 53 nodes?
 *
 * P3-S9 fails on `locator.click … waiting for element to be visible, enabled and stable`. That is
 * Playwright's actionability check, and "stable" means the element's box is unchanged across two
 * consecutive animation frames. A force graph that never cools never satisfies it.
 *
 * P3-S1's containment invariant passes at this node count, so the node is NOT outside the pane —
 * which rules out 0065's cause and leaves motion as the candidate. This measures it directly:
 * sample the first Promo node's position repeatedly and report when (if) it stops moving.
 */
import { chromium } from '@playwright/test'
import path from 'path'

const CMS = 'https://cms.typerefinery.localhost:8101'
const COMPOSER = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html`

const b = await chromium.launch()
const ctx = await b.newContext({ ignoreHTTPSErrors: true, storageState: path.resolve('.auth/cms.json') })
const page = await ctx.newPage()

await page.goto(COMPOSER, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(12_000)

const widget = page.frameLocator('iframe[src*="widgetdevcomposer"], iframe[src*="4005"]').first()
const promo = widget.locator('svg.promo_svg').locator('image')

const count = await promo.count()
console.log(`promo node images: ${count}`)

const sample = async () => {
  const boxes = await promo.evaluateAll((els) =>
    els.slice(0, 5).map((e) => {
      const r = e.getBoundingClientRect()
      return `${Math.round(r.x)},${Math.round(r.y)}`
    }),
  )
  return boxes.join(' | ')
}

let prev = await sample()
let stableFor = 0
const started = Date.now()
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(1000)
  const now = await sample()
  const moved = now !== prev
  stableFor = moved ? 0 : stableFor + 1
  console.log(
    `t+${String(Math.round((Date.now() - started) / 1000)).padStart(2)}s  ${moved ? 'MOVING' : 'still '}  ${now.slice(0, 70)}`,
  )
  prev = now
  if (stableFor >= 5) {
    console.log(`\n=> settled after ~${Math.round((Date.now() - started) / 1000)}s`)
    break
  }
}
if (stableFor < 5) console.log('\n=> NEVER SETTLED within 40s - Playwright can never click these nodes')

await b.close()
