import { expect } from '@playwright/test'
import { step, test } from '../runsheet'
import { SHOWCASE } from '../playwright.config'

/** Act 2 — Incident Overview force graph. Runsheet Act 2 / docs/issues/0006. */

const OVERVIEW = `${SHOWCASE}/forms/overview-local.html`

/**
 * The widget lives in a cross-origin iframe served by the :4008 dev server, proxied as
 * `widgetdevoverview.typerefinery.localhost`. The page carries **three** frames, so
 * `frameLocator('iframe').first()` picks the wrong one — target it by src.
 */
function graph(page: any) {
  return page.frameLocator('iframe[src*="widgetdevoverview"], iframe[src*="4008"], iframe').first()
}

/**
 * The overview draws each node as an `<image class="node-image">` — there is **no** circle and
 * no `g.node` anywhere in this widget. A probe of a healthy page (27 nodes / 52 edges) counted:
 * `svg image` 27, `svg circle` 0, `svg path` 53, classes `node-image`×27, `edgepath`×52.
 * Looking for circles reported a working graph as blank for two runs.
 */
const NODE = 'svg image.node-image, svg image, svg g.node'

async function openOverview(page: any) {
  await page.goto(OVERVIEW, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  // The graph is posted in by the host, then simulated — let it settle.
  await page.waitForTimeout(10_000)
}

test.describe('Act 2 — Incident Overview', () => {
  step('P2-S1', async ({ page }) => {
    await openOverview(page)
    const nodes = graph(page).locator(NODE)
    await expect
      .poll(async () => await nodes.count(), { timeout: 60_000, message: 'graph nodes rendered' })
      .toBeGreaterThan(1)
  })

  step('P2-S2', async ({ page }) => {
    await openOverview(page)
    // fitToPanel() should keep every node inside the SVG viewport — guards the centring
    // fault seen in docs/issues/0004.
    // ⚠️ Counting only *outside* nodes passes on an EMPTY graph — zero nodes means zero outside,
    // so a total render failure (0029's class, and the state Act 2 was in when data-starved by
    // Act 1) reported this step as green (docs/issues/0048). Count both, and require that nodes
    // were actually measured before concluding they all fit.
    const { inside, outside } = await graph(page).locator('svg').first().evaluate((svg: SVGSVGElement) => {
      const box = svg.getBoundingClientRect()
      let out = 0, ins = 0
      svg.querySelectorAll('image.node-image, image, circle, g.node').forEach((n) => {
        const b = (n as SVGGraphicsElement).getBoundingClientRect()
        if (b.width === 0 && b.height === 0) return
        if (b.left < box.left - 2 || b.right > box.right + 2 || b.top < box.top - 2 || b.bottom > box.bottom + 2) out++
        else ins++
      })
      return { inside: ins, outside: out }
    })
    expect(inside, 'nodes were actually rendered and measured (guards the empty-graph pass)').toBeGreaterThan(0)
    expect(outside, 'nodes outside the panel bounds').toBe(0)
  })

  step('P2-S3', async ({ page }) => {
    await openOverview(page)
    const node = graph(page).locator(NODE).first()
    await expect(node).toBeVisible({ timeout: 60_000 })
    const before = await node.boundingBox()
    expect(before).not.toBeNull()
    await page.mouse.move(before!.x + before!.width / 2, before!.y + before!.height / 2)
    await page.mouse.down()
    await page.mouse.move(before!.x + 120, before!.y + 80, { steps: 12 })
    await page.mouse.up()
    await page.waitForTimeout(1_500)
    const after = await node.boundingBox()
    const moved = Math.abs(after!.x - before!.x) + Math.abs(after!.y - before!.y)
    expect(moved, 'node followed the pointer').toBeGreaterThan(20)
    // Guards the regression in docs/issues/0006: dragging used to re-heat the simulation
    // and leave it churning. Positions must be stable a moment after release.
    const settled = await node.boundingBox()
    await page.waitForTimeout(2_500)
    const still = await node.boundingBox()
    const drift = Math.abs(still!.x - settled!.x) + Math.abs(still!.y - settled!.y)
    expect(drift, 'graph settles after the drag').toBeLessThan(15)
  })

  step('P2-S4', async ({ page }) => {
    // manual-only: CDP scroll gestures time out against the cross-origin embed.
  })

  step('P2-S5', async ({ page }) => {
    await openOverview(page)
    const node = graph(page).locator(NODE).first()
    await expect(node).toBeVisible({ timeout: 60_000 })
    await node.click()

    // ⚠️ This used to assert `document.querySelectorAll('iframe').length > 1`, which is true
    // **before the click** — the Overview page carries three frames (see the comment at the top of
    // this file). It could never distinguish a working left-select from a broken one
    // (docs/issues/0048). P3-S5 documents the same anti-pattern as already fixed on its side;
    // this is the equivalent fix here.
    //
    // Assert instead that a form frame **navigated off the default placeholder and carries
    // inputs** — the same signal P3-S5 uses.
    await expect
      .poll(
        async () => {
          for (const f of page.frames()) {
            const url = f.url()
            if (!/stixorm-forms|forms\//.test(url) || /\/default(\.html)?$/.test(url)) continue
            if ((await f.locator('input, select, textarea').count().catch(() => 0)) > 0) return true
          }
          return false
        },
        { timeout: 45_000, message: 'left-select opened a populated Update form (not the default placeholder)' },
      )
      .toBeTruthy()
  })

  step('P2-S6', async ({ page }) => {
    await openOverview(page)
    const dark = await graph(page).locator('body').first().evaluate((b: HTMLElement) => {
      const bg = getComputedStyle(b).backgroundColor
      const m = bg.match(/\d+/g)
      if (!m) return false
      const [r, g, bl] = m.map(Number)
      return r + g + bl < 200
    })
    expect(dark, 'viz uses the dark palette').toBeTruthy()
  })

  step('P2-S7', async ({ page }) => {
    await openOverview(page)
    // The options API (#82) exists; this asserts the widget actually asked for it.
    const asked = await page.evaluate(() => performance.getEntriesByType('resource').some((e: any) => /option/i.test(e.name)))
    expect(asked, 'widget requested the Overview options').toBeTruthy()
  })
})
