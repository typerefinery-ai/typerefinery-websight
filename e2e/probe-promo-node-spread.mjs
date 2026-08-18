/**
 * Why is the Promotable force graph crammed into a box?
 *
 * The composer's centre pane clamps every node to `panelBounds` AFTER each simulation tick
 * (panel.forcegraph.js `clampNodesToPanel`). That bound is **cached on first measurement** and never
 * recomputed, and panel.forcegraph.js already documents two ways the measurement goes wrong:
 * the SVG is created once with fixed pixel attrs from the panel's size at that moment
 * (measured panel 759x466 vs svg 841x283), and `options.width/height` are the CSS strings "100%".
 *
 * So the hypothesis is: the clamp box is smaller than the visible pane, and the nodes are packed
 * into it while the rest of the pane sits empty. This measures that rather than assuming it —
 * pane box vs svg attrs vs svg rendered box vs the actual spread of node coordinates.
 *
 *     node e2e/probe-promo-node-spread.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PAGE = process.env.PAGE_URL
  || 'https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html'
const STATE = path.join(__dirname, '.auth', 'cms.json')

const browser = await chromium.launch()
const ctx = await browser.newContext({ storageState: STATE, ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()
await page.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 90_000 })

// let all three panes fill and the simulation stop
await page.waitForTimeout(12_000)

const frames = page.frames().filter((f) => f.url().includes('widgetdevcomposer'))
console.log(`composer frames: ${frames.length}`)

const report = []
for (const f of frames) {
  const r = await f.evaluate(() => {
    const out = []
    // ⚠️ select by CLASS — the ids are tree_svg / promo_svg_zoom / scratch_svg_zoom but the
    // classes are tree_svg / promo_svg / scratch_svg (alpha-launch 0171/0010).
    for (const cls of ['promo_svg', 'scratch_svg', 'tree_svg']) {
      const svg = document.querySelector('svg.' + cls) || document.querySelector('.' + cls + ' svg')
      if (!svg) continue
      const pane = svg.closest('div')
      const sb = svg.getBoundingClientRect()
      const pb = pane && pane.getBoundingClientRect()
      const nodes = Array.from(svg.querySelectorAll('image, rect.node, g.node'))
        .map((n) => n.getBoundingClientRect())
        .filter((b) => b.width && b.height)
      const xs = nodes.map((b) => b.left - sb.left)
      const ys = nodes.map((b) => b.top - sb.top)
      out.push({
        cls,
        svgAttr: { w: svg.getAttribute('width'), h: svg.getAttribute('height') },
        svgRendered: { w: Math.round(sb.width), h: Math.round(sb.height) },
        paneRendered: pb ? { w: Math.round(pb.width), h: Math.round(pb.height) } : null,
        nodeCount: nodes.length,
        spread: xs.length ? {
          x: [Math.round(Math.min(...xs)), Math.round(Math.max(...xs))],
          y: [Math.round(Math.min(...ys)), Math.round(Math.max(...ys))],
        } : null,
      })
    }
    const fg = window.Widgets && window.Widgets.Panel && window.Widgets.Panel.ForceGraph
    return { panels: out, cachedBounds: fg && fg.panelBounds ? JSON.parse(JSON.stringify(fg.panelBounds)) : null }
  }).catch((e) => ({ error: String(e) }))
  if (r && r.panels && r.panels.length) report.push(r)
}

for (const r of report) {
  console.log(`\ncached panelBounds: ${JSON.stringify(r.cachedBounds)}`)
  for (const p of r.panels) {
    console.log(`\n  ${p.cls}`)
    console.log(`    svg width/height ATTR : ${p.svgAttr.w} x ${p.svgAttr.h}`)
    console.log(`    svg RENDERED         : ${p.svgRendered.w} x ${p.svgRendered.h}`)
    console.log(`    pane RENDERED        : ${p.paneRendered ? p.paneRendered.w + ' x ' + p.paneRendered.h : '?'}`)
    console.log(`    nodes                : ${p.nodeCount}`)
    if (p.spread) {
      const usedW = p.spread.x[1] - p.spread.x[0]
      const usedH = p.spread.y[1] - p.spread.y[0]
      const pctW = Math.round((usedW / p.svgRendered.w) * 100)
      const pctH = Math.round((usedH / p.svgRendered.h) * 100)
      console.log(`    node spread x        : ${p.spread.x[0]} … ${p.spread.x[1]}  (${usedW}px = ${pctW}% of svg width)`)
      console.log(`    node spread y        : ${p.spread.y[0]} … ${p.spread.y[1]}  (${usedH}px = ${pctH}% of svg height)`)
      if (pctW < 70 || pctH < 70) console.log(`    🚩 nodes occupy only ${pctW}%x${pctH}% of the pane — packed into a sub-box`)
    }
  }
}

await page.screenshot({ path: path.join(__dirname, 'probe-promo-node-spread.png') })
fs.writeFileSync(path.join(__dirname, 'probe-promo-node-spread.json'), JSON.stringify(report, null, 2))
console.log(`\nscreenshot: e2e/probe-promo-node-spread.png`)
await browser.close()
