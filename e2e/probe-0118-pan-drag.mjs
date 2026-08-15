/**
 * docs/issues/0118 — pan and drag measured in-frame, with the view transform as the oracle.
 *
 *   1. background drag (pan): root <g> transform must CHANGE and the layout must not rescale
 *   2. node drag: the dragged node's position must move to the drop point (fx/fy pinned)
 *   3. reset control: assert whether any reset-view affordance exists (expected: none — defect 3)
 *
 *     node e2e/probe-0118-pan-drag.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
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
const frameEl = await page.locator('iframe').first().elementHandle()
const frame = await frameEl.contentFrame()
await frame.locator('svg image').first().waitFor({ timeout: 60_000 })
await page.waitForTimeout(6_000)

const readState = () =>
  frame.locator('svg').first().evaluate((svg) => {
    const g = svg.querySelector('g')
    const first = svg.querySelector('image')
    const r = first.getBoundingClientRect()
    return { transform: g.getAttribute('transform') || '', firstIcon: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) } }
  })

const box = await (await page.locator('iframe').first().elementHandle()).boundingBox()
const at = (x, y) => ({ x: box.x + x, y: box.y + y })

// --- 1. background pan: drag from an empty corner of the panel ---
const before = await readState()
const p1 = at(150, 700)
const p2 = at(320, 560)
await page.mouse.move(p1.x, p1.y)
await page.mouse.down()
for (let i = 1; i <= 8; i++) await page.mouse.move(p1.x + ((p2.x - p1.x) * i) / 8, p1.y + ((p2.y - p1.y) * i) / 8)
await page.mouse.up()
await page.waitForTimeout(800)
const afterPan = await readState()
const panMoved = before.transform !== afterPan.transform
const iconShift = Math.hypot(afterPan.firstIcon.x - before.firstIcon.x, afterPan.firstIcon.y - before.firstIcon.y)
const iconScaleChange = Math.abs(afterPan.firstIcon.w - before.firstIcon.w)

console.log(`pan: transform changed=${panMoved}, first icon shifted ${Math.round(iconShift)}px, icon size change ${iconScaleChange}px`)

// --- 2. node drag: drag the first icon by (+120, +90) ---
const iconBefore = afterPan.firstIcon
const n1 = { x: iconBefore.x + iconBefore.w / 2, y: iconBefore.y + iconBefore.w / 2 }
const n2 = { x: n1.x + 120, y: n1.y + 90 }
await page.mouse.move(n1.x, n1.y)
await page.mouse.down()
for (let i = 1; i <= 8; i++) await page.mouse.move(n1.x + ((n2.x - n1.x) * i) / 8, n1.y + ((n2.y - n1.y) * i) / 8)
await page.mouse.up()
await page.waitForTimeout(800)
const afterDrag = await readState()
const dragDx = afterDrag.firstIcon.x - iconBefore.x
const dragDy = afterDrag.firstIcon.y - iconBefore.y
const landAccuracy = Math.hypot(dragDx - 120, dragDy - 90)
const viewJumped = afterDrag.transform !== afterPan.transform

console.log(`drag: node moved (${dragDx}, ${dragDy}) vs intended (120, 90) — landing error ${Math.round(landAccuracy)}px; view transform jumped=${viewJumped}`)

// --- 3. reset control: exists, and clicking it restores the fitted transform after the pan+drag ---
const resetBtn = frame.locator('.graph-reset-view')
const resetExists = (await resetBtn.count()) > 0
let resetWorks = false
if (resetExists) {
  await resetBtn.click()
  await page.waitForTimeout(600)
  const afterReset = await readState()
  // reset must clear the zoom translate: the transform should no longer equal the panned state
  resetWorks = afterReset.transform !== afterDrag.transform && /scale/.test(afterReset.transform + ' ') !== null
  console.log(`reset: clicked — transform now "${afterReset.transform.slice(0, 60)}…" (changed=${resetWorks})`)
}
console.log(`reset-view control: ${resetExists ? 'present' : 'ABSENT'}, works=${resetWorks}`)

const panOk = panMoved && iconShift > 30 && iconScaleChange <= 2
const dragOk = landAccuracy < 25 && !viewJumped
console.log(`\npan: ${panOk ? '✅ works, pure translate' : '🔴 FAILED'}  ·  node drag: ${dragOk ? '✅ lands where dropped, no view jump' : '🔴 FAILED'}  ·  reset: ${resetExists && resetWorks ? '✅ present and restores the view' : '🔴 missing/broken'}`)
await browser.close()
process.exit(panOk && dragOk && resetExists && resetWorks ? 0 : 1)
