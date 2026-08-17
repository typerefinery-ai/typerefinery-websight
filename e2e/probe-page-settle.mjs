/**
 * How long does a presenter actually wait for each Act's page to be usable?
 *
 * The runsheet tells them: Act 2 *"roughly ten seconds warm before it looks right"*, Act 3
 * *"allow ~12 seconds warm for all three panes to fill"*. Those were written before
 * docs/issues/0064 Option 2a cut three `/viz-data/*` routes by ~5× (Act 1 0.66→0.16 s, Act 2
 * 0.92→0.15 s, Act 3 0.68→0.12 s), so the guidance is now likely pessimistic.
 *
 * ⚠️ Measures SETTLE, not first paint: the moment the content a presenter is talking about is on
 * screen — rows in the table, nodes in the graph, all three Composer panes populated. A page that has
 * painted its chrome is not a page that is ready to demo.
 *
 *     node e2e/probe-page-settle.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const BASE = `${CMS}/content/typerefinery-showcase/pages/os-triage`
const STATE = path.join(__dirname, '.auth', 'cms.json')
const BUDGET = 40_000

const PAGES = [
  {
    act: 'Act 1', url: `${BASE}/pages/incidents.html`, says: 'no warm-up stated',
    ready: async (page) => (await page.locator('table tbody tr').count()) > 0,
    what: 'incident rows in the table',
  },
  {
    act: 'Act 2', url: `${BASE}/forms/overview-local.html`, says: '~10 s warm',
    /**
     * ⚠️ Two different questions, and the weaker one flatters the product.
     *
     * "Nodes are drawn" happens early. The runsheet's claim is *"roughly ten seconds warm before it
     * **looks right**"*, and for a force-directed graph that means the simulation has stopped moving.
     * Reporting the draw time against a settle claim would have made the runsheet look 3× pessimistic
     * when it was measuring something else.
     *
     * So: nodes drawn AND their positions unchanged across two consecutive polls.
     */
    ready: async (page, state) => {
      const f = page.frames().find((x) => /widgetdevoverview|4008/.test(x.url()))
      if (!f) return false
      const pos = await f.evaluate(() => {
        const els = [...document.querySelectorAll('svg image, svg g.node, svg circle')]
        if (els.length < 2) return null
        return els.slice(0, 12).map((e) => `${e.getAttribute('x') || e.getAttribute('cx') || ''},${e.getAttribute('y') || e.getAttribute('cy') || ''}${e.getAttribute('transform') || ''}`).join('|')
      }).catch(() => null)
      if (!pos) return false
      const stable = state.lastPos === pos
      state.lastPos = pos
      return stable
    },
    what: 'force graph drawn AND positions stable',
  },
  {
    act: 'Act 3', url: `${BASE}/forms/composer-local.html`, says: '~12 s warm',
    ready: async (page) => {
      const f = page.frames().find((x) => /widgetdevcomposer|4005/.test(x.url()))
      if (!f) return false
      // All THREE panes — a Composer with a tree and two empty panes is not ready to demo.
      //
      // ⚠️ The ids are `tree_svg`, `promo_svg_zoom`, `scratch_svg_zoom`. A first version used
      // `#promo_svg` / `#scratch_svg` — the names the d3 selections carry in the widget source and
      // the names docs/issues/0171 and 0010 quote — and reported **"Act 3 NOT READY within 40 s"**
      // on a page the gate walks green. Selecting an element that does not exist looks exactly like
      // a page that never loads, and it would have been reported as a demo-blocking regression.
      for (const svg of ['#tree_svg', '#promo_svg_zoom', '#scratch_svg_zoom']) {
        if ((await f.locator(`${svg} image, ${svg} circle, ${svg} g.node, ${svg} text`).count().catch(() => 0)) < 1) return false
      }
      return true
    },
    what: 'all three panes populated',
  },
]

if (!fs.existsSync(STATE)) {
  console.error(`no auth state at ${STATE} — run: ./node_modules/.bin/playwright test --project=setup`)
  process.exit(2)
}
const browser = await chromium.launch()
const results = []
for (const p of PAGES) {
  const ctx = await browser.newContext({ storageState: STATE, ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 } })
  const page = await ctx.newPage()
  const state = {}
  const t0 = Date.now()
  await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => {})
  let settled = null
  while (Date.now() - t0 < BUDGET) {
    if (await p.ready(page, state).catch(() => false)) { settled = Date.now() - t0; break }
    await page.waitForTimeout(250)
  }
  results.push({ ...p, settled })
  console.log(`  ${p.act}  ${settled === null ? `NOT READY within ${BUDGET / 1000}s` : `${(settled / 1000).toFixed(1)}s`}  — ${p.what} (runsheet says ${p.says})`)
  await ctx.close()
}
await browser.close()

fs.writeFileSync(path.join(__dirname, 'probe-page-settle.json'),
  JSON.stringify(results.map(({ act, url, says, what, settled }) => ({ act, url, says, what, settledMs: settled })), null, 2))

const missed = results.filter((r) => r.settled === null)
console.log(`\n${results.length - missed.length}/${results.length} page(s) settled within ${BUDGET / 1000}s`)
if (missed.length) { console.log('🚩 ' + missed.map((m) => m.act).join(', ') + ' did not reach a usable state'); process.exitCode = 1 }
else console.log('⚠️ One run each, on a warm stack — these are indicative, not a benchmark. Re-measure before quoting.')
