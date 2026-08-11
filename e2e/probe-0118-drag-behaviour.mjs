/**
 * docs/issues/0118 (1) — does dragging a node re-scale the whole Overview graph, and does the node
 * land where it was dropped?
 *
 * 0118 reports: "after the first drag the graph jumped to ~60% and into the top-left corner"; the
 * node "released at ~(620,520) settled ~(900,800) - half outside the visible panel"; and "the
 * Overview has no clamping".
 *
 * P2-S3 ("Dragging a node moves it without re-heating the simulation") currently PASSES, so either
 * 0118 is wrong or P2-S3 does not measure what 0118 describes. This measures three things P2-S3 does
 * not: the SVG view transform before/after, the drop-vs-settle distance, and whether the node ends
 * up inside the panel.
 *
 *     node e2e/probe-0118-drag-behaviour.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const URL = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html`

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1400, height: 950 },
  ignoreHTTPSErrors: true,
  storageState: path.join(__dirname, '.auth', 'cms.json'),
})
const page = await context.newPage()
await page.goto(URL, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(25000)

const iframeLoc = page.locator('iframe[src*="widgetdevoverview"]')
const iframeBox = await iframeLoc.boundingBox()
const handle = await iframeLoc.elementHandle()
const frame = handle ? await handle.contentFrame() : null
if (!frame || !iframeBox) {
  console.error('FAIL - could not reach the overview widget iframe.')
  await browser.close()
  process.exit(1)
}

/** The view transform of whatever <g> the zoom behaviour drives, plus panel size. */
const readView = () =>
  frame.evaluate(() => {
    const svg = document.querySelector('svg')
    const gs = [...document.querySelectorAll('svg > g')]
    const t = gs.map((g) => g.getAttribute('transform') || '')
    return {
      transforms: t,
      svgW: svg ? svg.clientWidth || Number(svg.getAttribute('width')) : 0,
      svgH: svg ? svg.clientHeight || Number(svg.getAttribute('height')) : 0,
    }
  })

const nodes = frame.locator('svg image.node-image')
const count = await nodes.count()
console.log(`nodes: ${count}`)

const before = await readView()
console.log(`view transforms BEFORE: ${JSON.stringify(before.transforms)}`)
console.log(`panel: ${before.svgW}x${before.svgH}`)

// Pick a node and record where it starts.
const target = nodes.nth(3)
const b0 = await target.boundingBox()
const startCx = Math.round(b0.x + b0.width / 2)
const startCy = Math.round(b0.y + b0.height / 2)

// Drop it somewhere clearly different but still well inside the iframe.
const dropX = Math.round(iframeBox.x + iframeBox.width * 0.62)
const dropY = Math.round(iframeBox.y + iframeBox.height * 0.62)

console.log(`\ndragging node[3] from (${startCx},${startCy}) to (${dropX},${dropY})`)
await page.mouse.move(startCx, startCy)
await page.mouse.down()
await page.mouse.move(dropX, dropY, { steps: 25 })
await page.mouse.up()
await page.waitForTimeout(3000) // let any simulation settle

const after = await readView()
const b1 = await target.boundingBox()
const endCx = b1 ? Math.round(b1.x + b1.width / 2) : null
const endCy = b1 ? Math.round(b1.y + b1.height / 2) : null

console.log(`view transforms AFTER : ${JSON.stringify(after.transforms)}`)
const transformChanged = JSON.stringify(before.transforms) !== JSON.stringify(after.transforms)

const dist = endCx == null ? null : Math.round(Math.hypot(endCx - dropX, endCy - dropY))
console.log(`\nnode settled at (${endCx},${endCy})   drop point (${dropX},${dropY})   distance ${dist}px`)

// Inside the panel?
const insidePanel =
  endCx != null &&
  endCx >= iframeBox.x && endCx <= iframeBox.x + iframeBox.width &&
  endCy >= iframeBox.y && endCy <= iframeBox.y + iframeBox.height

// How many of ALL nodes are outside the panel after the drag (0118: "no clamping")?
const outside = await frame.evaluate(() => {
  const svg = document.querySelector('svg')
  const w = svg.clientWidth || Number(svg.getAttribute('width'))
  const h = svg.clientHeight || Number(svg.getAttribute('height'))
  let n = 0
  for (const im of document.querySelectorAll('svg image.node-image')) {
    const r = im.getBoundingClientRect()
    const cx = r.x + r.width / 2
    const cy = r.y + r.height / 2
    if (cx < 0 || cy < 0 || cx > w || cy > h) n++
  }
  return { outside: n, w, h }
})

console.log('\n=== VERDICT ===')
console.log(`1. view transform changed by the drag : ${transformChanged}  ${transformChanged ? '(0118 claim 1: graph re-scaled)' : '(no rescale)'}`)
console.log(`2. node landed where dropped         : ${dist != null && dist <= 25} (${dist}px away)`)
console.log(`3. node inside the panel             : ${insidePanel}`)
console.log(`4. nodes outside panel bounds        : ${outside.outside} of ${count} (panel ${outside.w}x${outside.h})`)

await browser.close()
