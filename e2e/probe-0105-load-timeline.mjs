/**
 * docs/issues/0105 — where do the ~25-30 seconds of blank screen actually go?
 *
 * 0105 records "the data call returns 200 sub-second, so ~29s is client-side" and leaves the cause
 * unattributed between bundle / icon fetches / simulation. This attributes it, by recording every
 * request the page makes with its duration and origin, plus DOM milestones.
 *
 * Prime suspect worth separating: docs/issues/0106 - every node icon is fetched from
 * raw.githubusercontent.com AT RUNTIME. 28 nodes of remote SVG over the public internet is a very
 * different problem from a slow bundle or a slow simulation, and needs a different fix.
 *
 *     node e2e/probe-0105-load-timeline.mjs
 *     node e2e/probe-0105-load-timeline.mjs --composer
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const COMPOSER = process.argv.includes('--composer')
const PAGE = COMPOSER ? 'composer-local' : 'overview-local'
const WIDGET = COMPOSER ? 'widgetdevcomposer' : 'widgetdevoverview'
const URL = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/${PAGE}.html`

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1400, height: 950 },
  ignoreHTTPSErrors: true,
  storageState: path.join(__dirname, '.auth', 'cms.json'),
})
const page = await context.newPage()

const t0 = Date.now()
const reqs = new Map()
const done = []
page.on('request', (r) => reqs.set(r, Date.now()))
page.on('requestfinished', (r) => {
  const s = reqs.get(r)
  if (s == null) return
  done.push({ url: r.url(), started: s - t0, ms: Date.now() - s, type: r.resourceType() })
})
page.on('requestfailed', (r) => {
  const s = reqs.get(r)
  if (s == null) return
  done.push({ url: r.url(), started: s - t0, ms: Date.now() - s, type: r.resourceType(), failed: true })
})

await page.goto(URL, { waitUntil: 'domcontentloaded' })
console.log(`domcontentloaded at +${Date.now() - t0}ms`)

// Poll for the first painted node, so "when does the user see a graph" is measured, not guessed.
//
// ⚠️ The two widgets do NOT share a node selector. Overview draws `svg image.node-image`; the
// Composer draws into three panes (tree_svg / promo_svg / scratch_svg) with classes `pnodes` /
// `snodes`. Using the Overview's selector on the Composer reports "never painted" after 60s, which
// is a selector mismatch masquerading as a catastrophic load time - it nearly went in the report.
let firstNodeAt = null
for (let i = 0; i < 120; i++) {
  const h = await page.locator(`iframe[src*="${WIDGET}"]`).elementHandle().catch(() => null)
  const f = h ? await h.contentFrame() : null
  if (f) {
    const n = await f
      .evaluate(() => document.querySelectorAll('svg image.node-image, svg image.pnodes, svg image.snodes').length)
      .catch(() => 0)
    if (n > 0) { firstNodeAt = Date.now() - t0; break }
  }
  await page.waitForTimeout(500)
}
console.log(`first node painted at +${firstNodeAt ?? 'never'}ms`)
await page.waitForTimeout(4000)

const origin = (u) => { try { return new URL(u).host } catch { return '?' } }
const byHost = {}
for (const d of done) {
  const h = origin(d.url)
  byHost[h] = byHost[h] || { n: 0, totalMs: 0, maxMs: 0, failed: 0 }
  byHost[h].n++
  byHost[h].totalMs += d.ms
  byHost[h].maxMs = Math.max(byHost[h].maxMs, d.ms)
  if (d.failed) byHost[h].failed++
}

console.log(`\n--- requests by host (${done.length} total) ---`)
Object.entries(byHost)
  .sort((a, b) => b[1].totalMs - a[1].totalMs)
  .forEach(([h, v]) =>
    console.log(`  ${h.padEnd(40)} n=${String(v.n).padStart(3)}  sum=${String(v.totalMs).padStart(6)}ms  slowest=${String(v.maxMs).padStart(5)}ms${v.failed ? `  FAILED=${v.failed}` : ''}`),
  )

console.log(`\n--- 12 slowest individual requests ---`)
done.sort((a, b) => b.ms - a.ms).slice(0, 12).forEach((d) =>
  console.log(`  ${String(d.ms).padStart(6)}ms  start+${String(d.started).padStart(6)}ms  ${d.type.padEnd(10)} ${d.url.slice(0, 96)}`),
)

const icons = done.filter((d) => /githubusercontent|\/images?\//i.test(d.url) && /\.svg|\.png/i.test(d.url))
const iconSum = icons.reduce((a, b) => a + b.ms, 0)
console.log(`\n--- icon fetches (docs/issues/0106) ---`)
console.log(`  count=${icons.length}  sum=${iconSum}ms  slowest=${icons.length ? Math.max(...icons.map((i) => i.ms)) : 0}ms`)
if (icons.length) console.log(`  sample: ${icons[0].url.slice(0, 110)}`)

console.log(`\n=== READING ===`)
console.log(`time to first painted node: ${firstNodeAt ?? 'never'}ms`)
console.log(`remote-icon time (sum):     ${iconSum}ms across ${icons.length} requests`)

await browser.close()
