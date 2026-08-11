/**
 * docs/issues/0084 — is the Overview tooltip a hit shield?
 *
 * The tooltip is created with `display:block`, `z-index:10`, `position:absolute` and is hidden on
 * mouseout by `opacity: 0` ALONE. An opacity-0 element still receives pointer events, and this one
 * is anchored at (clientX, clientY + 10) — 10px below the pointer, exactly where the next click
 * lands — and may be up to 900px wide.
 *
 * This probe does not click anything. It asks the DOM the same question the browser asks when
 * routing a click: `document.elementFromPoint()` over each node's centre. That is the measurement
 * `clickAnyNode` never made, and it is why "8/8 nodes opened" could be true while 7 of those clicks
 * hit a div (docs/issues/0100).
 *
 *     node e2e/probe-0084-tooltip-hit-shield.mjs
 *
 * Expected BEFORE the fix: after hovering a node, elementFromPoint returns the tooltip div.
 * Expected AFTER  the fix: it returns the node image, because pointer-events:none takes the
 * tooltip out of hit-testing entirely.
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Measure the EMBEDDED Overview, not the standalone dev server: standalone renders 0 nodes (it is
// fed by the host), and the embed is where the defect was observed. Reuse the suite's CMS login.
const CMS_BASE = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const URL =
  process.env.OVERVIEW_URL ||
  `${CMS_BASE}/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html`

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  ignoreHTTPSErrors: true,
  storageState: path.join(__dirname, '.auth', 'cms.json'),
})
const page = await context.newPage()
await page.goto(URL, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(20000) // the graph pages take ~25-30s to paint (docs/issues/0105)

// Everything below runs INSIDE the widget's iframe: the tooltip is appended to the iframe's own
// <body>, and elementFromPoint must be asked in that document with its own coordinates.
const frame = page.frameLocator('iframe[src*="widgetdevoverview"]')
const frameHandle = await page.locator('iframe[src*="widgetdevoverview"]').elementHandle()
const contentFrame = frameHandle ? await frameHandle.contentFrame() : null
if (!contentFrame) {
  console.error('FAIL — could not reach the overview widget iframe.')
  await browser.close()
  process.exit(1)
}

const tip = await contentFrame.evaluate(() => {
  const t = document.querySelector('#widget-tooltip, .tooltip')
  if (!t) return null
  const cs = getComputedStyle(t)
  return { display: cs.display, opacity: cs.opacity, zIndex: cs.zIndex, pointerEvents: cs.pointerEvents }
})
console.log('tooltip computed style:', JSON.stringify(tip))
if (!tip) {
  console.error('FAIL — no tooltip element found; cannot measure. Is the widget loaded?')
  await browser.close()
  process.exit(1)
}

const nodes = frame.locator('svg image.node-image')
const count = await nodes.count()
console.log(`nodes: ${count}`)
if (count < 2) {
  console.error('FAIL — need at least 2 nodes to hover one and test another.')
  await browser.close()
  process.exit(1)
}

// Hover node 0 to park the tooltip, then ask what is on top of each node's centre.
await nodes.nth(0).hover()
await page.waitForTimeout(600)

// boundingBox() is page-relative; the frame's own coordinates need the iframe offset removed.
const iframeBox = await page.locator('iframe[src*="widgetdevoverview"]').boundingBox()
if (!iframeBox) {
  console.error('FAIL — iframe has no layout box.')
  await browser.close()
  process.exit(1)
}

// ⚠️ Measure GEOMETRIC OVERLAP against EVERY node, not elementFromPoint at a handful of centres.
//
// A first version of this probe hovered node[0] and asked elementFromPoint at 8 node centres. It
// reported PASS — and reported PASS identically with the guard removed, i.e. it proved nothing.
// The reason: the tooltip is anchored at (clientX, clientY + 10), so it starts just BELOW the node
// you hovered and extends down-right (measured 409x634). The hovered node is the one node it never
// covers, and the other sampled nodes happened to lie to its left. Sampling could not see a shield
// that is genuinely there.
await page.waitForTimeout(400)
const tipRect = await contentFrame.evaluate(() => {
  const el = document.querySelector('#widget-tooltip, .tooltip')
  if (!el) return null
  const r = el.getBoundingClientRect()
  const cs = getComputedStyle(el)
  return { x: r.x, y: r.y, w: r.width, h: r.height, pe: cs.pointerEvents, display: cs.display, opacity: cs.opacity }
})
console.log(`\ntooltip rect after hover: ${JSON.stringify(tipRect)}`)

const results = []
for (let i = 0; i < count; i++) {
  const box = await nodes.nth(i).boundingBox()
  if (!box) continue
  const cx = box.x + box.width / 2 - iframeBox.x
  const cy = box.y + box.height / 2 - iframeBox.y
  const inside =
    !!tipRect &&
    cx >= tipRect.x && cx <= tipRect.x + tipRect.w &&
    cy >= tipRect.y && cy <= tipRect.y + tipRect.h
  results.push({ i, cx: Math.round(cx), cy: Math.round(cy), inside })
}

const covered = results.filter((r) => r.inside)
console.log(`\n--- node centres falling INSIDE the parked tooltip rect ---`)
covered.slice(0, 12).forEach((r) => console.log(`  node[${r.i}] (${r.cx},${r.cy})`))
if (!covered.length) console.log('  (none)')

// A node centre inside the rect is only *shielded* if the tooltip still takes pointer events.
const shielded = tipRect && tipRect.pe !== 'none' ? covered : []
console.log('\n=== VERDICT ===')
console.log(`nodes measured      : ${results.length}`)
console.log(`covered by the rect : ${covered.length}`)
console.log(`shielded by tooltip : ${shielded.length}`)
if (tip.pointerEvents === 'none') {
  console.log('tooltip has pointer-events:none — it is out of hit-testing.')
} else {
  console.log(`tooltip pointer-events is "${tip.pointerEvents}" — it CAN capture clicks.`)
}
console.log(
  shielded.length === 0
    ? 'PASS — every node centre routes to the node itself.'
    : `FAIL — ${shielded.length} node(s) would have their click swallowed by the tooltip.`,
)

await browser.close()
process.exit(shielded.length === 0 ? 0 : 1)
