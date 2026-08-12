/**
 * P2-S3 — **how far does the node actually travel?**
 *
 * The row claims *"the node follows the pointer **exactly** — no fling, no runaway simulation, no
 * iframe freeze"*. The step asserts `|Δx| + |Δy| > 20` after a drag whose pointer travels ~160px, so
 * a node that moved 25px would pass — docs/issues/0048's "partial claim" shape, and its last open
 * item.
 *
 * ⚠️ **The expected delta is NOT (120, 80).** The drag starts at the node's **centre** and ends at
 * `(before.x + 120, before.y + 80)`, so the pointer travels `(120 - w/2, 80 - h/2)`. Asserting
 * against (120, 80) would fail on a perfectly good drag — the same guess-instead-of-measure error
 * that produced two false alarms earlier today (P1-S4's radios, P3-S3's node id).
 *
 * This measures the real geometry so the assertion can be written from data.
 *
 *     node e2e/probe-0048-p2s3-drag-geometry.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const SHOWCASE = '/content/typerefinery-showcase/pages/os-triage'

const browser = await chromium.launch({ channel: 'chrome' })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

await page.goto(`${CMS}${SHOWCASE}/forms/overview-local.html`, { waitUntil: 'domcontentloaded' })
const graph = page.frameLocator('iframe[src*="widgetdevoverview"], iframe[src*="4008"]').first()
const node = graph.locator('image, g.node, circle').first()
await node.waitFor({ timeout: 60_000 })
await page.waitForTimeout(8_000) // let the simulation settle before measuring

for (const run of [1, 2, 3]) {
  const before = await node.boundingBox()
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2)
  await page.mouse.down()
  await page.mouse.move(before.x + 120, before.y + 80, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(1_500)
  const after = await node.boundingBox()

  const expected = { x: 120 - before.width / 2, y: 80 - before.height / 2 }
  const actual = { x: after.x - before.x, y: after.y - before.y }
  console.log(
    `run ${run}: icon ${Math.round(before.width)}x${Math.round(before.height)} · ` +
    `expected (${Math.round(expected.x)}, ${Math.round(expected.y)}) · ` +
    `actual (${Math.round(actual.x)}, ${Math.round(actual.y)}) · ` +
    `error (${Math.round(actual.x - expected.x)}, ${Math.round(actual.y - expected.y)})`,
  )
  await page.waitForTimeout(2_000)
}

await browser.close()
