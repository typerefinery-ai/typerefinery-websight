/**
 * docs/issues/0048 — can P2-S4 (scroll-to-zoom) be automated after all?
 *
 * P2-S4 is one of only two steps in `runsheet.ts` that are not `baseline: 'pass'`, and its spec body
 * in `specs/02-overview.spec.ts` is **entirely comments — it asserts nothing**. Anything not 'pass'
 * is non-strict, so a real zoom regression reports as *skipped* while the runsheet marks the row
 * verified. That is exactly 0048's class.
 *
 * The classification rests on this finding, recorded 2026-08-05:
 *
 *     "ZOOM could not be driven by any automation available here. Chrome's `scroll` action delivers
 *      zero wheel events — measured with a capture-phase wheel listener, which logged 0 after a
 *      4-tick scroll."
 *
 * ⚠️ That measurement is about the **Claude-in-Chrome bridge's** scroll action, not about Playwright.
 * Playwright's `page.mouse.wheel(dx, dy)` synthesises a real wheel event through the browser's input
 * pipeline, and it dispatches at viewport coordinates — so it lands on whatever is under the cursor,
 * cross-origin iframe included. The generalisation from "the bridge cannot" to "no automation can"
 * was never tested.
 *
 * This probe tests it. The oracle is the widget's own layout transform: the spec records that a real
 * WheelEvent runs d3.zoom and writes `scale(1.5157)` into it. So read the transform, wheel, read it
 * again, and report whether the scale moved.
 *
 *     node e2e/probe-0048-p2s4-wheel.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const OVERVIEW = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html`
const STATE = path.join(__dirname, '.auth', 'cms.json')

const NODE = 'svg image.node-image, svg image, svg g.node'

/**
 * Read every transform that looks like a d3.zoom layout transform, from the widget's own document.
 *
 * ⚠️ The transform is COMPOSED — measured shape:
 *
 *     translate(a,b) scale(1) translate(c,d) scale(k)
 *
 * A first version of this matched `/scale\(([-\d.]+)/` and took the first hit, which is the constant
 * `scale(1)` of the outer layout group. It reported "scale did not move" through a 3x zoom and would
 * have recorded a product defect that does not exist. Capture EVERY scale and compare the whole list.
 */
const readScale = async (frame) =>
  frame.evaluate(() => {
    const out = []
    document.querySelectorAll('svg g').forEach((g) => {
      const t = g.getAttribute('transform') || ''
      const scales = [...t.matchAll(/scale\(([-\d.]+)/g)].map((m) => parseFloat(m[1]))
      if (scales.length) out.push({ transform: t, scales, product: scales.reduce((a, b) => a * b, 1) })
    })
    return out
  })

const run = async () => {
  if (!fs.existsSync(STATE)) {
    console.error(`no auth state at ${STATE} — run: ./node_modules/.bin/playwright test --project=setup`)
    process.exit(2)
  }
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ storageState: STATE, ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()

  const resp = await page.goto(OVERVIEW, { waitUntil: 'domcontentloaded', timeout: 60000 })
  console.log(`GET overview-local.html -> ${resp && resp.status()}`)
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {})
  await page.waitForTimeout(10000)

  const frame = page.frames().find((f) => /widgetdevoverview|4008/.test(f.url()))
  if (!frame) {
    console.error('graph frame not found; frames present:')
    for (const f of page.frames()) console.error(`  ${f.url()}`)
    await browser.close()
    process.exit(1)
  }
  console.log(`graph frame: ${frame.url()}`)

  const nodes = await frame.locator(NODE).count()
  console.log(`nodes rendered: ${nodes}`)
  if (!nodes) {
    console.error('no nodes — cannot test zoom against an empty graph (that would be 0048 all over again)')
    await browser.close()
    process.exit(1)
  }

  // Count wheel events the widget's own document actually receives, capture-phase — the same
  // instrument the 2026-08-05 finding used, so the two are directly comparable.
  await frame.evaluate(() => {
    window.__wheelCount = 0
    document.addEventListener('wheel', () => { window.__wheelCount++ }, { capture: true, passive: true })
  })

  const before = await readScale(frame)
  console.log(`\ntransforms before: ${JSON.stringify(before)}`)

  // Put the cursor over the middle of the graph frame, then wheel.
  const box = await page.locator('iframe[src*="widgetdevoverview"], iframe[src*="4008"]').first().boundingBox()
  if (!box) { console.error('could not measure the iframe box'); await browser.close(); process.exit(1) }
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  console.log(`wheeling at viewport (${Math.round(cx)}, ${Math.round(cy)}) over a ${Math.round(box.width)}x${Math.round(box.height)} frame`)
  await page.mouse.move(cx, cy)
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, -240)
    await page.waitForTimeout(300)
  }
  await page.waitForTimeout(1500)

  const wheelCount = await frame.evaluate(() => window.__wheelCount)
  const after = await readScale(frame)
  console.log(`\nwheel events the widget document received: ${wheelCount}   (the bridge delivered 0)`)
  console.log(`transforms after : ${JSON.stringify(after)}`)

  const s0 = before.map((b) => b.product)
  const s1 = after.map((a) => a.product)
  const changed = s1.some((v, i) => s0[i] === undefined || Math.abs(v - s0[i]) > 0.01)

  // Stage 2 — isolate tool from product. The spec records that dispatching a real WheelEvent on the
  // widget's svg runs d3.zoom and writes `scale(1.5157)`. If that still holds while Playwright's
  // wheel does not scale, the difference is in HOW the event is delivered (target, deltaMode,
  // ctrlKey). If it no longer holds, the 2026-08-05 "zoom works" finding is itself stale.
  const synthetic = await frame.evaluate(() => {
    const svg = document.querySelector('svg')
    if (!svg) return { error: 'no svg' }
    const r = svg.getBoundingClientRect()
    const before = document.querySelector('svg g')?.getAttribute('transform') || ''
    for (let i = 0; i < 4; i++) {
      svg.dispatchEvent(new WheelEvent('wheel', {
        deltaY: -240, deltaMode: 0, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2,
        bubbles: true, cancelable: true,
      }))
    }
    return { before, after: document.querySelector('svg g')?.getAttribute('transform') || '' }
  })
  await page.waitForTimeout(800)
  const afterSynthetic = await readScale(frame)
  console.log(`\nsynthetic WheelEvent on the svg:`)
  console.log(`  before: ${String(synthetic.before).slice(0, 100)}`)
  console.log(`  after : ${String(synthetic.after).slice(0, 100)}`)
  console.log(`  scales now: ${JSON.stringify(afterSynthetic.map((a) => a.scales))}`)

  await page.screenshot({ path: path.join(__dirname, 'probe-0048-p2s4-wheel.png'), fullPage: false })
  fs.writeFileSync(path.join(__dirname, 'probe-0048-p2s4-wheel.json'),
    JSON.stringify({ nodes, wheelCount, before, after, changed }, null, 2))

  console.log('\n=== VERDICT ===')
  if (changed) {
    console.log('ZOOM IS AUTOMATABLE via page.mouse.wheel — the scale moved.')
    console.log('P2-S4 can carry a real assertion and its baseline can go strict.')
  } else if (wheelCount > 0) {
    console.log(`wheel events ARRIVED (${wheelCount}) but the scale did not move.`)
    console.log('That is a product statement, not a tooling one — worth a look before changing anything.')
  } else {
    console.log('no wheel events reached the widget document — Playwright is limited the same way the')
    console.log('bridge was, and "manual" stands. Record that as measured, not assumed.')
  }

  await browser.close()
}

run().catch((e) => { console.error(e); process.exit(1) })
