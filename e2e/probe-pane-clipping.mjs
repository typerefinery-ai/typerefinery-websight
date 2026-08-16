/**
 * Does anything in the Composer panes fall OUTSIDE its pane?
 *
 * Why this exists: on 2026-08-16 a layout change took the Promotable pane from 23% to 76% fill. Every
 * signal said it was good — Acts 1-3 walk 11/11, Act 3 right-click 2/2, the full gate 22/22, and
 * `probe-0078-node-occlusion.mjs` reported 0 of 15 nodes unclickable. A screenshot showed
 * "Microsoft Exchange" CLIPPED at the pane's bottom edge and an edge label running off the right.
 *
 * The occlusion probe could not have caught it: it measures nodes overlapping EACH OTHER, not content
 * crossing the pane BOUNDARY. Those are different failures and only one of them was instrumented.
 *
 * This measures the other one: every node icon and every label, against its own pane's box.
 *
 *     node e2e/probe-pane-clipping.mjs
 *
 * Exits 1 when anything is clipped, so it can gate a layout change.
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const P = '/content/typerefinery-showcase/pages/os-triage'
const STATE = path.join(__dirname, '.auth', 'cms.json')
// A label may legitimately sit a hair over the edge before it is visibly cut; 2px absorbs
// sub-pixel rounding without excusing a real clip.
const TOLERANCE = Number(process.env.CLIP_TOLERANCE || 2)

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: Number(process.env.VW || 1280), height: Number(process.env.VH || 800) },
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()

// Stage the incident the runsheet uses (docs/issues/0189), as the walks do.
await page.goto(`${CMS}${P}/pages/incidents.html`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('tbody tr', { timeout: 40_000 }).catch(() => {})
await page.waitForTimeout(2_500)
const row = page.locator('tbody tr', { hasText: 'image5 walkthrough' }).first()
if (await row.count()) {
  await row.locator('td').nth(1).click()
  await page.waitForTimeout(8_000)
}
await page.goto(`${CMS}${P}/forms/composer-local.html`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(22_000)

const frame = page.frames().find((f) => /widgetdevcomposer/.test(f.url()))
if (!frame) {
  console.log('composer frame not found')
  await browser.close()
  process.exit(2)
}

const report = await frame.evaluate((tol) => {
  const out = []
  for (const svg of document.querySelectorAll('svg')) {
    const cls = (svg.getAttribute('class') || '').trim()
    if (!/promo|scratch|tree/.test(cls)) continue
    const pane = svg.getBoundingClientRect()
    if (!pane.width || !pane.height) continue
    const clipped = []
    let checked = 0
    // Icons and their labels are separate elements; both can leave the pane, and the label is the
    // one that usually does, because it is wider than the icon it sits under.
    for (const el of svg.querySelectorAll('image, g.node, text')) {
      const b = el.getBoundingClientRect()
      if (!b.width && !b.height) continue
      checked++
      const over = {
        left: Math.round(pane.left - b.left),
        right: Math.round(b.right - pane.right),
        top: Math.round(pane.top - b.top),
        bottom: Math.round(b.bottom - pane.bottom),
      }
      const worst = Math.max(over.left, over.right, over.top, over.bottom)
      if (worst > tol) {
        clipped.push({
          tag: el.tagName,
          text: (el.textContent || '').trim().slice(0, 32),
          over: Object.fromEntries(Object.entries(over).filter(([, v]) => v > tol)),
          px: worst,
        })
      }
    }
    out.push({ pane: cls, paneSize: `${Math.round(pane.width)}×${Math.round(pane.height)}`, checked, clipped })
  }
  return out
}, TOLERANCE)

let total = 0
for (const p of report) {
  total += p.clipped.length
  console.log(`${p.pane.padEnd(14)} ${p.paneSize.padEnd(10)} ${p.checked} element(s) checked · ${p.clipped.length} clipped`)
  for (const c of p.clipped) {
    console.log(`    ${c.tag.padEnd(6)} ${JSON.stringify(c.text).padEnd(34)} over ${JSON.stringify(c.over)} (${c.px}px)`)
  }
}

console.log(`\n--- verdict (tolerance ${TOLERANCE}px) ---`)
console.log(
  total === 0
    ? '  ✅ nothing crosses a pane boundary'
    : `  ❌ ${total} element(s) clipped — a layout that fills the pane by pushing content off it is not a fix.`,
)

fs.writeFileSync(path.join(__dirname, 'probe-pane-clipping.json'), JSON.stringify(report, null, 2))
console.log('  written: e2e/probe-pane-clipping.json')
await browser.close()
process.exit(total === 0 ? 0 : 1)

console.log('\n\u26a0 this staged the image5 walkthrough incident and did NOT restore it.')
console.log('  restore the baseline with: node e2e/set-current-incident-by-ui.mjs 511d2ab7')
