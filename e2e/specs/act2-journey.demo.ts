import { expect, test } from '@playwright/test'
import { SHOWCASE } from '../playwright.config'

/**
 * Act 2 as ONE continuous journey, for a single video.
 *
 * Companion to act1-journey.demo.ts — see that file for why a whole act has to be one test (one
 * context = one video) and why demo journeys live in the `demo` project rather than the runsheet
 * suite.
 *
 * ⚠️ **P2-S4 (scroll-zoom / background-drag) is excluded.** The runsheet marks it manual-only: CDP
 * scroll gestures time out against the cross-origin embed. It works by hand — it just cannot be
 * driven here, so recording it would produce a scene where nothing happens.
 *
 * Run with:  ./node_modules/.bin/playwright test --project=demo --grep "Act 2"
 */

const OVERVIEW = `${SHOWCASE}/forms/overview-local.html`

/** Three frames on the page — target the widget by src, not `.first()` (docs/issues/0043). */
const graph = (page: any) =>
  page.frameLocator('iframe[src*="widgetdevoverview"], iframe[src*="4008"], iframe').first()

/**
 * Nodes are `<image class="node-image">`. There is **no** circle and no `g.node` in this widget —
 * looking for circles reported a working graph as blank for two runs (docs/issues/0006).
 */
const NODE = 'svg image.node-image, svg image, svg g.node'

const beat = (page: any, ms = 2_500) => page.waitForTimeout(ms)

async function scene(page: any, title: string) {
  // eslint-disable-next-line no-console
  console.log(`  ▸ ${title}`)
  await test.step(title, async () => {
    await beat(page, 800)
  })
}

test('Act 2 — Incident Overview: the graph, dragging, and opening an object', async ({ page }) => {
  test.setTimeout(300_000)

  // ---- Scene 1 — the graph (P2-S1, P2-S2) ---------------------------------
  await scene(page, 'Open Incident Overview')
  await page.goto(OVERVIEW, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 90_000 }).catch(() => {})
  // The graph is posted in by the host, then simulated — let it settle before filming.
  await beat(page, 10_000)

  const nodes = graph(page).locator(NODE)
  await expect
    .poll(async () => await nodes.count(), { timeout: 90_000, message: 'the force graph drew its nodes' })
    .toBeGreaterThan(1)
  const nodeCount = await nodes.count()
  console.log(`     graph shows ${nodeCount} nodes`)
  await beat(page, 4_000)

  // ---- Scene 2 — drag a node (P2-S3) --------------------------------------
  await scene(page, 'Drag a node — it follows the pointer and settles')
  const dragged = nodes.first()
  const before = await dragged.boundingBox()
  if (before) {
    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2)
    await page.mouse.down()
    // Slow and many-stepped: a demo wants to *see* the node travel, not teleport.
    await page.mouse.move(before.x + 160, before.y + 90, { steps: 40 })
    await page.mouse.up()
    await beat(page, 3_000)
    const after = await dragged.boundingBox()
    if (after) console.log(`     node moved ${Math.round(after.x - before.x)}px, ${Math.round(after.y - before.y)}px`)
  } else {
    console.log('     could not measure a node to drag; skipping that beat')
  }
  await beat(page, 2_000)

  // ---- Scene 3 — open an object's form (P2-S5) ----------------------------
  //
  // ⚠️ Three approaches to picking a node failed before this one, and the failures are worth
  // keeping so nobody repeats them:
  //
  //   1. `[id="<stix id>"]` — Overview node images carry **no id at all** (0 of 27 measured).
  //      Composer's *do*, which is where the assumption came from; they are different widgets.
  //   2. `image[href*="<icon>"]` driven from the payload's `icon` — resolved correctly, but the
  //      chosen node sat at **x=1152 in a 1067-wide svg**, so a click at its centre landed outside
  //      the drawn area and opened nothing.
  //   3. Both of the above also fought `#widget-tooltip`: hovering a node raises a tooltip *under
  //      the pointer*, so Playwright's hover → check → click sequence intercepts its own click.
  //      A person never hits this; mousedown lands before the tooltip renders.
  //
  // P2-S5 just clicks nodes positionally and checks a form appears. Do the same: try nodes in order
  // and stop at the first that opens one. **25 of 27 types resolve** (docs/issues/0084 — the
  // incident and impact nodes 404), so this lands on a working node almost immediately, and if it
  // does hit one of the two bad ones it moves on rather than filming a blank pane.
  await scene(page, 'Left-select an object — its Update form opens, populated')

  const formOpen = async () =>
    page.frames().some((f: any) => /-update|-create/.test(f.url()) && !/default/.test(f.url()))

  let opened = false
  const tries = Math.min(6, nodeCount)
  for (let i = 0; i < tries && !opened; i++) {
    // Park the pointer away first so the tooltip from the previous hover has dismissed.
    await page.mouse.move(10, 10)
    await beat(page, 600)
    await nodes.nth(i).click({ force: true }).catch(() => {})
    for (let w = 0; w < 12 && !opened; w++) {
      await page.waitForTimeout(1_000)
      opened = await formOpen()
    }
    if (!opened) console.log(`     node ${i + 1} opened no form — trying the next`)
  }

  if (!opened) {
    console.log(`     no form opened after ${tries} nodes; skipping the form beat`)
  } else {
    const form = page.frames().find((f: any) => /-update/.test(f.url()))
    const which = form ? (form.url().match(/\/([a-z0-9-]+)-update\.html/) || [])[1] : 'an object'
    const inputs = form ? await form.locator('input').count().catch(() => 0) : 0
    console.log(`     ${which} form opened with ${inputs} fields`)
    await beat(page, 6_000)
  }

  await scene(page, 'End of Act 2')
  await beat(page, 2_000)
})
