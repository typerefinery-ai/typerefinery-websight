/**
 * Act 2 pointer-motion gestures in **headed** Chrome — P2-S3 (drag a node) and P2-S4 (zoom / pan).
 *
 * These are the ONLY two headline gestures in the demo that had never been driven by hand: every
 * Chrome walk so far listed them under "Steps NOT exercised" because the runsheet flags pointer
 * motion inside the cross-origin widget iframe as unreliable under CDP. They rested on the
 * Playwright suite, which exercises the harness's selectors rather than a human's pointer.
 *
 * ⚠️ Headed Playwright, not the Claude-in-Chrome bridge — docs/issues/0161's outage covers both
 * clicks and keystrokes, so the bridge cannot even pass the CMS login.
 *
 * The oracles are read from the widget's own implementation (widget-graph-viz-overview
 * `src/js/widget.js`), not guessed:
 *
 *   P2-S3  d3.drag's "drag" sets `d.fx = d.x = event.x` and "end" leaves fx/fy set, so a dragged
 *          node is PINNED where it was dropped. Two independent oracles: the node's rendered
 *          position lands near the drop point, and the widget console logs "Node fixed at
 *          position:". A moving force layout could fake the first; only a real drag emits the
 *          second.
 *   P2-S4  d3.zoom writes `svg.attr("transform", `${baseTransform()} ${event.transform}`)` onto the
 *          inner g, so after a wheel the transform carries a TRAILING `scale(k)` that is absent
 *          before. Panning changes the trailing translate. The base fit transform is left alone,
 *          which is why the check reads the LAST scale/translate, not the first.
 *
 *     node e2e/walk-act2-pointer-gestures.mjs <outdir>
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const OUT = process.argv[2] || '.'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html'

const results = []
const record = (s, v, n) => { results.push({ s, v, n }); console.log(`${v.padEnd(7)} ${s.padEnd(7)} ${n}`) }
const step = async (name, fn) => {
  try { await fn() } catch (e) { record(name, 'FAIL', 'threw: ' + String(e.message).split('\n')[0].slice(0, 90)) }
}

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

// The widget's own "end" handler is one of P2-S3's two oracles.
const pinLogs = []
let toastBlocks = 0
page.on('console', (m) => {
  const t = m.text()
  if (/Node fixed at position/.test(t)) pinLogs.push(t.slice(0, 120))
  if (/intercepts pointer events/.test(t)) toastBlocks++
})

await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(24_000)

const w = page.frameLocator('iframe[src*="widgetdevoverview"]').first()
const nodes = w.locator('svg g.node, svg image')
const nNodes = await nodes.count().catch(() => 0)
console.log(`graph nodes: ${nNodes}`)
if (!nNodes) {
  record('P2-S3', 'FAIL', 'graph is empty — no node to drag')
  record('P2-S4', 'FAIL', 'graph is empty — nothing to zoom')
}

/** The inner <g> the zoom handler writes onto. */
const gTransform = async () => {
  const g = w.locator('svg > g').first()
  return (await g.getAttribute('transform').catch(() => null)) || ''
}
/** d3 appends its transform, so the LAST scale()/translate() is the zoom one. */
const lastScale = (t) => { const m = [...t.matchAll(/scale\(([-\d.]+)/g)]; return m.length ? Number(m[m.length - 1][1]) : null }
const lastTranslate = (t) => {
  const m = [...t.matchAll(/translate\(([-\d.]+)[ ,]+([-\d.]+)/g)]
  return m.length ? [Number(m[m.length - 1][1]), Number(m[m.length - 1][2])] : null
}

if (nNodes) {
  // ---- P2-S3: drag a node and prove it stays where it was dropped
  await step('P2-S3', async () => {
    const target = nodes.nth(Math.min(3, nNodes - 1))
    const before = await target.boundingBox()
    if (!before) { record('P2-S3', 'FAIL', 'could not resolve the node bounding box'); return }
    const from = { x: before.x + before.width / 2, y: before.y + before.height / 2 }
    const to = { x: from.x + 160, y: from.y - 110 }

    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
    // Several intermediate moves: d3.drag needs motion, not a teleport.
    for (let i = 1; i <= 8; i++) {
      await page.mouse.move(from.x + ((to.x - from.x) * i) / 8, from.y + ((to.y - from.y) * i) / 8)
      await page.waitForTimeout(60)
    }
    await page.mouse.up()
    await page.waitForTimeout(3_000)

    const after = await target.boundingBox()
    if (!after) { record('P2-S3', 'FAIL', 'node vanished after the drag'); return }
    const landed = { x: after.x + after.width / 2, y: after.y + after.height / 2 }
    const moved = Math.hypot(landed.x - from.x, landed.y - from.y)
    const missBy = Math.hypot(landed.x - to.x, landed.y - to.y)

    // Settle check: fx/fy pinning means it must NOT drift back once the pointer is gone.
    await page.waitForTimeout(4_000)
    const settledBox = await target.boundingBox()
    const drift = settledBox
      ? Math.hypot(settledBox.x + settledBox.width / 2 - landed.x, settledBox.y + settledBox.height / 2 - landed.y)
      : NaN

    // ⚠️ The verdict rests on POSITION, not on the console log. Console from a cross-origin iframe
    // does not always reach the parent, so requiring the pin log would risk the same false FAIL as
    // counting <option> on a Choices-hidden select (P5-S5). The log is reported as corroboration.
    const nearDrop = missBy < 60
    const pinned = pinLogs.length > 0
    const verdict = nearDrop && drift < 25 ? 'PASS' : moved > 40 ? 'PARTIAL' : 'FAIL'
    record('P2-S3', verdict,
      `node moved ${moved.toFixed(0)}px, landed ${missBy.toFixed(0)}px from the drop point, ` +
      `drift after 4 s ${Number.isNaN(drift) ? 'n/a' : drift.toFixed(0)}px · ` +
      `widget "Node fixed at position" logs: ${pinLogs.length}${pinned ? ` (e.g. ${pinLogs[0]})` : ' — pin log NOT seen'}`)
    await page.screenshot({ path: path.join(OUT, 'act2-p2s3-drag.png') })
  })

  // ---- P2-S4a: scroll-zoom
  await step('P2-S4', async () => {
    const box = await w.locator('svg').first().boundingBox()
    if (!box) { record('P2-S4', 'FAIL', 'could not resolve the svg bounding box'); return }
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 }

    const t0 = await gTransform()
    const s0 = lastScale(t0)
    await page.mouse.move(centre.x, centre.y)
    for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, -220); await page.waitForTimeout(220) }
    await page.waitForTimeout(1_500)
    const t1 = await gTransform()
    const s1 = lastScale(t1)

    const zoomed = s1 !== null && (s0 === null ? s1 !== 1 : Math.abs(s1 - s0) > 0.05)
    record('P2-S4', zoomed ? 'PASS' : 'FAIL',
      `scroll-zoom: trailing scale ${s0 === null ? '(none)' : s0.toFixed(3)} → ${s1 === null ? '(none)' : s1.toFixed(3)}` +
      (zoomed ? ' — the wheel reached the widget' : ` — UNCHANGED; transform="${t1.slice(0, 90)}"`))
    await page.screenshot({ path: path.join(OUT, 'act2-p2s4-zoom.png') })
  })

  // ---- P2-S4b: background-drag pan
  await step('P2-S4b', async () => {
    // ⚠️ RELOAD FIRST. The zoom step above leaves the graph at ~9.8x, and at that magnification the
    // nodes cover the canvas — the "empty" corner this step grabs is then a NODE, so the drag moves
    // a node instead of panning and d3.zoom's translate correctly stays put. The first run of this
    // walk scored a FAIL for exactly that reason; `probe-p2s4b-pan-isolated.mjs` showed the pan
    // works perfectly on a fresh page (translate moved by the exact drag delta). Reload so the
    // gesture is measured on background, not on a magnified node.
    await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(24_000)

    const box = await w.locator('svg').first().boundingBox()
    if (!box) { record('P2-S4b', 'FAIL', 'could not resolve the svg bounding box'); return }
    // Bottom-left of the canvas is the emptiest region — pan must not start on a node.
    const from = { x: box.x + 70, y: box.y + box.height - 70 }

    // Confirm the grab point really is background before pressing, rather than assuming it.
    const frame = page.frames().find((f) => /widgetdevoverview/.test(f.url()))
    const under = frame
      ? await frame.evaluate(([x, y]) => {
          const r = document.querySelector('svg').getBoundingClientRect()
          const el = document.elementFromPoint(r.left + x, r.top + y)
          return el ? el.tagName + '.' + String(el.getAttribute('class') || '') : '(none)'
        }, [70, box.height - 70])
      : '(frame not found)'
    if (!/^svg/.test(under)) {
      record('P2-S4b', 'NOT-EXERCISED', `grab point is not background (<${under}>) — refusing to call a node-drag a pan`)
      return
    }

    const p0 = lastTranslate(await gTransform())
    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
    for (let i = 1; i <= 8; i++) { await page.mouse.move(from.x + 15 * i, from.y - 9 * i); await page.waitForTimeout(60) }
    await page.mouse.up()
    await page.waitForTimeout(1_500)
    const p1 = lastTranslate(await gTransform())

    const moved = p0 && p1 && (Math.abs(p1[0] - p0[0]) > 8 || Math.abs(p1[1] - p0[1]) > 8)
    record('P2-S4b', moved ? 'PASS' : 'FAIL',
      `background-drag pan: trailing translate ${p0 ? `(${p0[0].toFixed(0)},${p0[1].toFixed(0)})` : '(none)'} → ` +
      `${p1 ? `(${p1[0].toFixed(0)},${p1[1].toFixed(0)})` : '(none)'}` +
      (moved ? ' — the canvas panned' : ' — UNCHANGED'))
    await page.screenshot({ path: path.join(OUT, 'act2-p2s4b-pan.png') })
  })
}

console.log(`\ntoast interceptions observed: ${toastBlocks}  (0148's signature — 0 expected after 43c944f)`)
console.log(`=== ${results.filter((r) => r.v === 'PASS').length}/${results.length} Act 2 pointer gestures PASS`)
console.log(JSON.stringify(results, null, 2))
await browser.close()
