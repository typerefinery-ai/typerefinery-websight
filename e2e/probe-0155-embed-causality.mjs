/**
 * docs/issues/0155 — did the embed change (a3430b04) cause P2-S2's overlap failure?
 *
 * 0155 records the causality as OPEN with a "four-minute revert test" as the decisive experiment.
 * This is cheaper and just as decisive: **P2-S2 never clicks anything** — it loads the Overview and
 * measures the graph. The modified path (`ns.navigateFrame`, reached only from `updateDataSource`)
 * runs on a `DATA_SOURCE` event. If that path never executes during a plain load, it cannot have
 * moved a single node.
 *
 * Reports, for a load with no interaction:
 *   - whether `updateDataSource` / `navigateFrame` ran at all
 *   - the viz iframe's rect (fitToPanel reads the panel size, so a size change WOULD matter)
 *   - the same fit metrics P2-S2 asserts, so the overlap can be seen without the suite
 *
 *     node e2e/probe-0155-embed-causality.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const PAGE = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html`
const STATE = path.join(__dirname, '.auth', 'cms.json')

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()

const marks = { updateDataSource: 0, navigateFrame: 0, unavailable: 0, probed: 0 }
page.on('console', (m) => {
  const t = m.text()
  if (/updateDataSource/.test(t)) marks.updateDataSource++
  if (/updating iframe source to/.test(t)) marks.navigateFrame++
  if (/embed source does not resolve/.test(t)) marks.unavailable++
  if (/embed source could not be probed/.test(t)) marks.probed++
})

// A HEAD request is the observable signature of the new guard. If none is issued on a plain load,
// the guard did not run - independent of console capture.
let heads = 0
page.on('request', (r) => {
  if (r.method() === 'HEAD') heads++
})

console.log('\n--- load Overview, NO interaction (what P2-S2 does) ---')
await page.goto(PAGE)
const graph = page.frameLocator('iframe[src*="widgetdevoverview"], iframe[src*="4008"]').first()
await graph.locator('svg image.node-image, svg image, svg g.node').first().waitFor({ state: 'visible', timeout: 60_000 })
await page.waitForTimeout(8000)

console.log(`  updateDataSource calls : ${marks.updateDataSource}`)
console.log(`  frame navigations      : ${marks.navigateFrame}`)
console.log(`  HEAD requests issued   : ${heads}   <- the new guard's signature`)
console.log(`  "does not resolve"     : ${marks.unavailable}`)
console.log(`  "could not be probed"  : ${marks.probed}`)

const rects = await page.evaluate(() =>
  [...document.querySelectorAll('iframe')].map((f) => {
    const b = f.getBoundingClientRect()
    return { src: (f.src || '').slice(0, 55), w: Math.round(b.width), h: Math.round(b.height), shown: f.style.display !== 'none' }
  }),
)
console.log(`  iframe rects           : ${JSON.stringify(rects)}`)

const unavailable = await page.locator('.embed-unavailable').count()
console.log(`  .embed-unavailable els : ${unavailable}`)

console.log(
  `\n  VERDICT: the modified path ${heads === 0 && marks.navigateFrame === 0 ? 'DID NOT RUN' : 'RAN'} on a plain load.`,
)

await browser.close()
