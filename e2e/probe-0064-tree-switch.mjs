/**
 * docs/issues/0064 — does the `tree-*` route speed-up show up where a presenter feels it?
 *
 * Five `tree-*` routes went 0.75 s → 0.11 s, and **page settle did not move** (measured: unchanged
 * inside ±0.6 s variance). So those fetches are not on the first-load critical path.
 *
 * The interaction they DO serve is the Treeview radio (P3-S2, *"Treeview radio switches the data
 * set"*): the page is already warm, the analyst picks a different source, and one `tree-*` route is
 * fetched on demand. That is where a 0.64 s saving should be visible.
 *
 * ⚠️ Measures the redraw, not the request: from click to the tree pane's markup actually changing,
 * which is what a presenter sees. A request that returns fast into a pane that redraws slowly is not
 * a faster gesture.
 *
 *     node e2e/probe-0064-tree-switch.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const PAGE = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html`
const STATE = path.join(__dirname, '.auth', 'cms.json')

if (!fs.existsSync(STATE)) {
  console.error(`no auth state at ${STATE} — run: ./node_modules/.bin/playwright test --project=setup`)
  process.exit(2)
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ storageState: STATE, ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()

// Record every tree-* fetch the page makes, so the request cost and the felt cost can be compared.
const fetches = []
page.on('response', (r) => {
  const u = r.url()
  if (/\/viz-data\/tree-/.test(u)) fetches.push({ url: u.split('/').pop(), status: r.status(), at: Date.now() })
})

await page.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 60_000 })
const frame = () => page.frames().find((f) => /widgetdevcomposer|4005/.test(f.url()))
for (let i = 0; i < 80 && !(frame() && (await frame().locator('svg.tree_svg image, svg.tree_svg text').count().catch(() => 0)) > 0); i++) {
  await page.waitForTimeout(250)
}
const f = frame()
if (!f) { console.error('composer frame never appeared'); await browser.close(); process.exit(1) }

const radios = f.locator('input[type="radio"]')
const n = await radios.count()
console.log(`radios: ${n} · tree fetches during load: ${fetches.length}`)
if (n < 2) { console.error('not enough radios to switch'); await browser.close(); process.exit(1) }

const results = []
// Switch through several sources; each is a different tree-* route.
for (const idx of [3, 5, 6, 1]) {
  if (idx >= n) continue
  const before = await f.locator('svg.tree_svg').innerHTML().catch(() => '')
  const t0 = Date.now()
  await radios.nth(idx).click({ force: true }).catch(() => {})
  let redrew = null
  while (Date.now() - t0 < 20_000) {
    const now = await f.locator('svg.tree_svg').innerHTML().catch(() => '')
    if (now && now !== before) { redrew = Date.now() - t0; break }
    await page.waitForTimeout(50)
  }
  const route = fetches.length ? fetches[fetches.length - 1].url : '(none seen)'
  results.push({ idx, redrew, route })
  console.log(`  radio ${idx}: ${redrew === null ? 'NO redraw within 20 s' : `${redrew} ms to redraw`}  (last tree fetch: ${route})`)
  await page.waitForTimeout(600)
}

fs.writeFileSync(path.join(__dirname, 'probe-0064-tree-switch.json'), JSON.stringify({ fetches, results }, null, 2))

const timed = results.filter((r) => r.redrew !== null).map((r) => r.redrew)
console.log(`\ntree fetches total: ${fetches.length}`)
if (!timed.length) { console.log('🚩 no switch produced a redraw — nothing measured'); process.exitCode = 1 }
else {
  console.log(`redraw after a radio switch: ${Math.min(...timed)}–${Math.max(...timed)} ms across ${timed.length} switch(es)`)
  console.log('⚠️ One run, warm page. Indicative, not a benchmark.')
}
await browser.close()
