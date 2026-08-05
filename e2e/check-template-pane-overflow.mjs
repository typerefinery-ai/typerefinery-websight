/**
 * docs/issues/0059 — does the TEMPLATE widget (widget-graph-viz, :4001) suffer the stale-SVG-size
 * fault that 0056 and 0058 were fixed for?
 *
 * Nothing in the demo suite exercises this widget — no CMS page embeds it (only
 * `widgetdevcomposer` and `widgetdevoverview` appear in authored content), so the runsheet cannot
 * verify a fix here. Its dev server can: load it, measure each pane's SVG against its pane, then
 * **resize the viewport** and measure again. A widget that never re-syncs will show overflow after
 * the resize even if it looked fine at first paint.
 *
 *     node e2e/check-template-pane-overflow.mjs
 */
import { chromium } from '@playwright/test'

const TEMPLATE = 'http://localhost:4001/'
const PANES = ['promo_panel', 'scratch_panel']

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage()
await page.goto(TEMPLATE, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(8000)

const measure = async (label) => {
  const rows = await page.evaluate((panes) => {
    return panes.map((id) => {
      const pane = document.getElementById(id)
      const svg = pane && pane.querySelector('svg')
      if (!pane || !svg) return { pane: id, missing: true }
      const p = pane.getBoundingClientRect()
      const s = svg.getBoundingClientRect()
      return {
        pane: id,
        paneBox: `${Math.round(p.width)}x${Math.round(p.height)}`,
        svgBox: `${Math.round(s.width)}x${Math.round(s.height)}`,
        overflowX: Math.round(Math.max(0, s.right - p.right, p.left - s.left)),
        overflowY: Math.round(Math.max(0, s.bottom - p.bottom, p.top - s.top)),
      }
    })
  }, PANES)
  console.log(`\n${label}`)
  for (const r of rows) {
    if (r.missing) {
      console.log(`   ${r.pane}: no svg`)
      continue
    }
    const flag = r.overflowX > 8 || r.overflowY > 8 ? '⚠️ ' : '   '
    console.log(`${flag}${r.pane}: pane ${r.paneBox} · svg ${r.svgBox} · overflow ${r.overflowX}x${r.overflowY}`)
  }
  return rows
}

await measure('at first paint (1600x1000)')

// Shrink hard: a widget that re-syncs follows its pane, one that does not keeps the old box and
// spills over its neighbour — which is exactly how 0058 swallowed clicks in the composer.
await page.setViewportSize({ width: 900, height: 700 })
await page.waitForTimeout(4000)
const after = await measure('after resizing the viewport to 900x700')

const bad = after.filter((r) => !r.missing && (r.overflowX > 8 || r.overflowY > 8))
console.log(`\npanes overflowing after resize: ${bad.length}`)
await browser.close()
process.exitCode = bad.length ? 1 : 0
