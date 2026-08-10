/**
 * docs/issues/0065 — are Composer pane nodes inside their panel?
 *
 * P2-S2 asserts exactly this for the Overview; the Composer has no equivalent check, which is how
 * nodes at `y = -46.68` and `y = 386.6` went unnoticed while two fixes for the same *family* of fault
 * (0056, 0058) were landing next door.
 *
 * ⚠️ Uses the suite's stored auth state. A standalone run with `httpCredentials` lands on the React
 * login form instead of the page and every locator times out — which looks exactly like "the panes
 * are empty" and is not.
 *
 *     node e2e/probe-pane-node-bounds.mjs [runs]
 */
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const RUNS = Number(process.argv[2] || 3)
const CMS = 'https://cms.typerefinery.localhost:8101'
const COMPOSER = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html`

const STATE = ['.auth/cms.json', '.auth/state.json']
  .map((p) => path.join(process.cwd(), p))
  .find((p) => fs.existsSync(p))

if (!STATE) {
  console.error('no stored auth state found — run the suite once first so the setup project writes it')
  console.error('looked for: .auth/cms.json, .auth/state.json')
  process.exit(1)
}
console.log(`using auth state: ${path.relative(process.cwd(), STATE)}\n`)

const browser = await chromium.launch()
const context = await browser.newContext({ ignoreHTTPSErrors: true, storageState: STATE })

let totalOutside = 0
for (let run = 1; run <= RUNS; run++) {
  const page = await context.newPage()
  // 90 s, matching the specs. The 30 s default is not enough for this page — measured 2026-08-10:
  // run 1 reported cleanly and run 2 died on `page.goto: Timeout 30000ms exceeded`, which reads as
  // "the probe found something" when it is only the probe giving up. A repeat-measurement tool that
  // cannot complete its repeats is worse than useless.
  await page.goto(COMPOSER, { waitUntil: 'domcontentloaded', timeout: 90_000 })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(15_000)

  const widget = page.frameLocator('iframe[src*="widgetdevcomposer"], iframe[src*="4005"]').first()

  for (const pane of ['promo_svg', 'scratch_svg']) {
    const report = await widget
      .locator(`svg.${pane}`)
      .first()
      .evaluate((svg) => {
        const box = svg.getBoundingClientRect()
        const nodes = [...svg.querySelectorAll('image')]
        const placed = nodes.map((n) => ({
          id: (n.id || '').slice(0, 26),
          x: Number(n.getAttribute('x')),
          y: Number(n.getAttribute('y')),
          w: Number(n.getAttribute('width')) || 0,
          h: Number(n.getAttribute('height')) || 0,
        }))
        const finite = placed.filter((n) => Number.isFinite(n.x) && Number.isFinite(n.y))
        // Any part of the node past an edge — strict, and a few pixels of overhang trips it.
        const outside = finite.filter((n) => n.x < 0 || n.y < 0 || n.x + n.w > box.width || n.y + n.h > box.height)
        // The node's CENTRE past an edge. This is the one that matters: Playwright clicks the centre,
        // and so does a user. A node overhanging by a few pixels is still perfectly clickable.
        const centreOutside = finite.filter((n) => {
          const cx = n.x + n.w / 2
          const cy = n.y + n.h / 2
          return cx < 0 || cy < 0 || cx > box.width || cy > box.height
        })
        return { w: Math.round(box.width), h: Math.round(box.height), total: placed.length, outside, centreOutside }
      })
      .catch((e) => ({ error: String(e).split('\n')[0].slice(0, 80) }))

    if (report.error) {
      console.log(`run ${run}  ${pane.padEnd(11)} ERROR ${report.error}`)
      continue
    }
    totalOutside += report.centreOutside.length
    console.log(
      `run ${run}  ${pane.padEnd(11)} pane ${report.w}x${report.h}  nodes ${String(report.total).padStart(2)}  ` +
        `overhang ${String(report.outside.length).padStart(2)}  UNREACHABLE ${String(report.centreOutside.length).padStart(2)}` +
        (report.centreOutside.length
          ? `  e.g. ${report.centreOutside.slice(0, 3).map((n) => `${n.id}@(${Math.round(n.x)},${Math.round(n.y)})`).join(' ')}`
          : ''),
    )
  }
  await page.close()
}

console.log(`\ntotal nodes UNREACHABLE (centre outside the pane) across ${RUNS} run(s): ${totalOutside}`)
await browser.close()
process.exit(totalOutside === 0 ? 0 : 1)
