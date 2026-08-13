/**
 * Measure how much of each Composer pane the graph actually fills — Act 3's "the SCREEN is the gap".
 *
 * decision 0036 says the cast is now right (Promotable 8 / Scratch 4, matching image5) but that the
 * cluster "renders small and centred in a large pane". That is a claim about geometry, so measure it
 * rather than eyeball it: Act 2's equivalent problem was tracked as a fill percentage ("renders at
 * 39%") and that number is what made the fix reviewable.
 *
 * Reported per pane:
 *   pane W x H          the svg's own box
 *   cluster W x H       bounding box of the rendered node icons
 *   fill                cluster area / pane area, and each axis separately
 *   icon size           median rendered icon width
 *
 * ⚠️ Measures the ICONS, not the <g> transform — the transform can say anything; what the audience
 * sees is where the icons land.
 *
 *     node e2e/probe-act3-pane-fill.mjs <outdir>
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const OUT = process.argv[2] || '.'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html'
const MAP = path.join(
  __dirname, '..', '..', 'typerefinery', 'services', 'fastapi', 'generated', 'os-triage',
  'context_mem', 'context_map.json',
)

console.log(`current_incident: ${JSON.parse(fs.readFileSync(MAP, 'utf8')).current_incident}`)

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(26_000)

const frame = page.frames().find((f) => /widgetdevcomposer/.test(f.url()))
if (!frame) { console.log('FAIL: composer frame not found'); await browser.close(); process.exit(1) }

// image5's LEFT pane is a populated "EVIDENCE:" tree, and the build renders that pane empty. 0036
// notes the image5 incident has no ATTACHED objects — so the empty tree may be a consequence of the
// data choice rather than a widget defect. Count it here so the two can be told apart.
const evidence = await frame.evaluate(() => {
  const pane = document.querySelector('.evidence, #evidence, [class*="evidence"]')
  const listish = pane ? pane.querySelectorAll('li, .node, image, tr, [class*="item"]').length : -1
  return {
    paneFound: !!pane,
    paneClass: pane ? String(pane.className).slice(0, 60) : '(none)',
    entries: listish,
    text: pane ? pane.innerText.replace(/\s+/g, ' ').trim().slice(0, 120) : '(none)',
  }
})
console.log(`\n=== Evidence List pane`)
console.log(`    found: ${evidence.paneFound} (${evidence.paneClass})`)
console.log(`    entries: ${evidence.entries}`)
console.log(`    text: "${evidence.text}"`)

const report = await frame.evaluate(() => {
  const out = []
  for (const cls of ['promo_svg', 'scratch_svg']) {
    const svg = document.querySelector(`svg.${cls}`)
    if (!svg) { out.push({ pane: cls, error: 'svg not found' }); continue }
    const pane = svg.getBoundingClientRect()
    const icons = [...svg.querySelectorAll('image')]
    if (!icons.length) { out.push({ pane: cls, error: 'no icons', paneW: pane.width, paneH: pane.height }); continue }
    const boxes = icons.map((n) => n.getBoundingClientRect()).filter((b) => b.width > 0)
    const minX = Math.min(...boxes.map((b) => b.left))
    const maxX = Math.max(...boxes.map((b) => b.right))
    const minY = Math.min(...boxes.map((b) => b.top))
    const maxY = Math.max(...boxes.map((b) => b.bottom))
    const widths = boxes.map((b) => b.width).sort((a, b) => a - b)
    out.push({
      pane: cls,
      nodes: icons.length,
      paneW: Math.round(pane.width), paneH: Math.round(pane.height),
      clusterW: Math.round(maxX - minX), clusterH: Math.round(maxY - minY),
      // margins tell you WHERE the empty space is, which decides fit-vs-spread
      left: Math.round(minX - pane.left), right: Math.round(pane.right - maxX),
      top: Math.round(minY - pane.top), bottom: Math.round(pane.bottom - maxY),
      iconMedian: Math.round(widths[Math.floor(widths.length / 2)]),
      labels: svg.querySelectorAll('text').length,
    })
  }
  return out
})

for (const r of report) {
  if (r.error) { console.log(`\n${r.pane}: ${r.error} (pane ${r.paneW}x${r.paneH})`); continue }
  const fillX = ((r.clusterW / r.paneW) * 100).toFixed(0)
  const fillY = ((r.clusterH / r.paneH) * 100).toFixed(0)
  const area = (((r.clusterW * r.clusterH) / (r.paneW * r.paneH)) * 100).toFixed(0)
  console.log(`\n=== ${r.pane} — ${r.nodes} nodes, ${r.labels} text elements`)
  console.log(`    pane    ${r.paneW} x ${r.paneH}`)
  console.log(`    cluster ${r.clusterW} x ${r.clusterH}`)
  console.log(`    FILL    ${fillX}% wide, ${fillY}% tall, ${area}% of area`)
  console.log(`    margins L${r.left} R${r.right} T${r.top} B${r.bottom}`)
  console.log(`    icon    ${r.iconMedian}px median`)
}

await page.screenshot({ path: path.join(OUT, 'act3-pane-fill.png') })
console.log(`\nscreenshot → ${path.join(OUT, 'act3-pane-fill.png')}`)
await browser.close()
