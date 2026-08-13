/**
 * P2-S4b (background-drag pan) in isolation — does the canvas pan, and if not, why not?
 *
 * ⚠️ Why this probe exists. In `walk-act2-pointer-gestures.mjs` the pan step ran AFTER the zoom
 * step, which had left the graph at ~9.85x. At that magnification the nodes cover the canvas, so
 * the "empty" bottom-left corner the probe grabbed was very likely a NODE — dragging a node is not
 * a pan, and d3.zoom's translate would correctly stay put. Reporting that as a product FAIL would
 * have repeated the P5-S5 mistake (counting <option> on a Choices-hidden select).
 *
 * So this probe:
 *   1. loads a FRESH page (no prior zoom),
 *   2. asks the document what element is actually under the chosen point before pressing,
 *   3. only then drags, and reports what moved.
 *
 *     node e2e/probe-p2s4b-pan-isolated.mjs <outdir>
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const OUT = process.argv[2] || '.'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html'

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(24_000)

const w = page.frameLocator('iframe[src*="widgetdevoverview"]').first()
const svg = w.locator('svg').first()
const g = w.locator('svg > g').first()

const box = await svg.boundingBox()
const iframeBox = await page.locator('iframe[src*="widgetdevoverview"]').first().boundingBox()
console.log('svg box   :', JSON.stringify(box))
console.log('iframe box:', JSON.stringify(iframeBox))

const lastTranslate = (t) => {
  const m = [...String(t).matchAll(/translate\(([-\d.]+)[ ,]+([-\d.]+)/g)]
  return m.length ? [Number(m[m.length - 1][1]), Number(m[m.length - 1][2])] : null
}

// Candidate "empty background" points, in iframe-local coords for elementFromPoint.
const candidates = [
  ['bottom-left', 70, box.height - 70],
  ['top-left', 70, 70],
  ['top-right', box.width - 70, 70],
  ['bottom-right', box.width - 70, box.height - 70],
  ['centre', box.width / 2, box.height / 2],
]

// ⚠️ Ask the DOM what is under each point rather than assuming a corner is empty.
const probeFrame = page.frames().find((f) => /widgetdevoverview/.test(f.url()))
if (!probeFrame) { console.log('FAIL: could not resolve the widget frame'); await browser.close(); process.exit(0) }

const hits = await probeFrame.evaluate((pts) => {
  const svgEl = document.querySelector('svg')
  const r = svgEl.getBoundingClientRect()
  return pts.map(([name, x, y]) => {
    const el = document.elementFromPoint(r.left + x, r.top + y)
    return { name, x, y, tag: el ? el.tagName : '(none)', cls: el ? String(el.getAttribute('class') || '') : '', id: el ? String(el.getAttribute('href') || el.id || '') : '' }
  })
}, candidates)
hits.forEach((h) => console.log(`  ${h.name.padEnd(13)} → <${h.tag}> class="${h.cls}" ${h.id}`.slice(0, 150)))

// Pick the first point that is the bare svg / the zoom g — i.e. genuinely background.
const empty = hits.find((h) => h.tag === 'svg' || (h.tag === 'g' && !/node/.test(h.cls)))
if (!empty) {
  console.log('\nNO BACKGROUND POINT FOUND — every probed point sits on graph content.')
} else {
  console.log(`\nusing "${empty.name}" as background (<${empty.tag}>)`)
  const from = { x: box.x + empty.x, y: box.y + empty.y }
  const before = await g.getAttribute('transform')
  const p0 = lastTranslate(before)

  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let i = 1; i <= 10; i++) { await page.mouse.move(from.x + 18 * i, from.y - 11 * i); await page.waitForTimeout(60) }
  await page.mouse.up()
  await page.waitForTimeout(2_000)

  const after = await g.getAttribute('transform')
  const p1 = lastTranslate(after)
  const moved = p0 && p1 && (Math.abs(p1[0] - p0[0]) > 8 || Math.abs(p1[1] - p0[1]) > 8)
  console.log(`before transform: ${String(before).slice(0, 120)}`)
  console.log(`after  transform: ${String(after).slice(0, 120)}`)
  console.log(`\nP2-S4b ${moved ? 'PASS' : 'FAIL'} — trailing translate ` +
    `${p0 ? `(${p0[0].toFixed(0)},${p0[1].toFixed(0)})` : '(none)'} → ${p1 ? `(${p1[0].toFixed(0)},${p1[1].toFixed(0)})` : '(none)'}`)
  await page.screenshot({ path: path.join(OUT, 'act2-p2s4b-pan-isolated.png') })
}

// Control: does a wheel at the SAME point still work on this fresh page? If the wheel reaches the
// widget but the drag does not, the failure is drag-specific, not "the canvas ignores the pointer".
const t0 = await g.getAttribute('transform')
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await page.mouse.wheel(0, -120)
await page.waitForTimeout(1_200)
const t1 = await g.getAttribute('transform')
console.log(`\ncontrol — single wheel notch changed the transform: ${t0 !== t1}`)

await browser.close()
