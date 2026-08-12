import { expect } from '@playwright/test'
import { step, test, observe } from '../runsheet'
import { SHOWCASE, FLOW_BASE } from '../playwright.config'

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
  step('P2-S1', async ({ page, request }) => {
    await openOverview(page)
    const nodes = graph(page).locator(NODE)
    await expect
      .poll(async () => await nodes.count(), { timeout: 60_000, message: 'graph nodes rendered' })
      .toBeGreaterThan(1)

    // The row claims the graph renders the incident **and its related objects**. `> 1` is satisfied
    // by two nodes and no edges (docs/issues/0048, Tier 2). Compare against what the endpoint
    // actually returns, so under-rendering is visible rather than silently green.
    const api = await request
    const payload = await (await api.get(`${FLOW_BASE}/viz-data/overview-default-incident`)).json()
    const expectedNodes = (payload.nodes || []).length
    const expectedEdges = (payload.edges || payload.links || []).length
    const renderedNodes = await nodes.count()
    const renderedEdges = await graph(page).locator('svg line, svg path.link, svg .link').count().catch(() => 0)

    observe(
      test.info(),
      renderedNodes === expectedNodes ? 'pass' : 'note',
      `rendered ${renderedNodes}/${expectedNodes} nodes, ${renderedEdges} edge marks (endpoint says ${expectedEdges} edges)`,
    )
    expect(renderedNodes, `every node from the endpoint is drawn (${renderedNodes}/${expectedNodes})`)
      .toBe(expectedNodes)
    expect(expectedEdges, 'the incident has related objects to draw').toBeGreaterThan(0)
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

    // ⚠️ "In bounds" is not GitHub #80's criterion — #80 asks for a **usable, centred** layout, and
    // an oversized graph shrunk to nothing would satisfy `outside === 0` perfectly. That gap was
    // recorded as the reason #80 stayed PARTIAL, so assert the thing the issue actually asks for.
    //
    // Measured 2026-08-05 across three panel widths (27 nodes):
    //   1067px panel → fill 74% x 68%, icons 35px, margins L138=R138 T162=B162, 0 overlaps
    //    853px panel → fill 92% x 84%, icons 35px, margins  L35=R35   T65=B65,  0 overlaps
    //    683px panel → fill 92% x 77%, icons 28px, margins  L28=R28   T82=B82,  0 overlaps
    // So fitToPanel() scales down only when the panel is genuinely smaller than the graph, and
    // even then the icons stay legible. Thresholds are set well below the measurements so a real
    // collapse fails while normal variation does not.
    const fit = await graph(page).locator('svg').first().evaluate((svg: SVGSVGElement) => {
      const box = svg.getBoundingClientRect()
      const rects = [...svg.querySelectorAll('image.node-image, image')]
        .map((n) => (n as SVGGraphicsElement).getBoundingClientRect())
        .filter((r) => r.width > 0)
      if (!rects.length) return null
      const left = Math.min(...rects.map((r) => r.left))
      const right = Math.max(...rects.map((r) => r.right))
      const top = Math.min(...rects.map((r) => r.top))
      const bottom = Math.max(...rects.map((r) => r.bottom))
      const centres = rects.map((r) => [r.left + r.width / 2, r.top + r.height / 2] as const)
      const nearest = centres.map(([x, y], i) => {
        let best = Infinity
        centres.forEach(([x2, y2], j) => {
          if (i !== j) best = Math.min(best, Math.hypot(x - x2, y - y2))
        })
        return best
      })
      // Walk up from the svg so a collapse can be attributed to a named element rather than
      // "some container" (docs/issues/0056).
      const chain: string[] = []
      let el: Element | null = svg.parentElement
      for (let i = 0; i < 4 && el; i++, el = el.parentElement) {
        const r = el.getBoundingClientRect()
        chain.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''}=${Math.round(r.width)}x${Math.round(r.height)}`)
      }
      return {
        panelW: box.width,
        panelH: box.height,
        chain: chain.join(' < '),
        transform: (svg.querySelector('g') || {}).getAttribute?.('transform') || '',
        fillX: (right - left) / box.width,
        fillY: (bottom - top) / box.height,
        // Difference between opposing margins, as a fraction of the panel — 0 means centred.
        skewX: Math.abs((left - box.left) - (box.right - right)) / box.width,
        skewY: Math.abs((top - box.top) - (box.bottom - bottom)) / box.height,
        iconPx: rects[0].width,
        overlapping: nearest.filter((d) => d < rects[0].width).length,
      }
    })
    expect(fit, 'nodes measurable for the fit assertions').not.toBeNull()
    // Report every number on any failure — "icons are 7px" is only actionable next to the panel
    // size, node count and scale that produced it (docs/issues/0056).
    // Which layer is wrong when the panel collapses — the host's iframe, or the widget's own svg?
    const hostFrame = await page
      .locator('iframe[src*="widgetdevoverview"], iframe[src*="4008"], iframe')
      .first()
      .evaluate((el: HTMLIFrameElement) => {
        const r = el.getBoundingClientRect()
        return `${Math.round(r.width)}x${Math.round(r.height)}`
      })
      .catch(() => 'unknown')
    const shape =
      `iframe ${hostFrame} · panel ${Math.round(fit!.panelW)}x${Math.round(fit!.panelH)} · nodes ${inside} · ` +
      `fill ${(fit!.fillX * 100).toFixed(0)}%x${(fit!.fillY * 100).toFixed(0)}% · ` +
      `icons ${fit!.iconPx.toFixed(1)}px · skew ${(fit!.skewX * 100).toFixed(0)}%,${(fit!.skewY * 100).toFixed(0)}% · ` +
      `overlaps ${fit!.overlapping} · transform ${fit!.transform} · ancestors ${fit!.chain}`
    observe(test.info(), 'note', `P2-S2 fit: ${shape}`)
    expect(Math.max(fit!.fillX, fit!.fillY), `graph fills a usable share of the panel, not shrunk to a dot — ${shape}`)
      .toBeGreaterThan(0.5)
    expect(Math.max(fit!.skewX, fit!.skewY), `graph is centred in the panel — ${shape}`).toBeLessThan(0.15)
    expect(fit!.iconPx, `node icons are still legible — ${shape}`).toBeGreaterThan(12)
    expect(fit!.overlapping, `node icons do not overlap each other — ${shape}`).toBe(0)
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
    /**
     * docs/issues/0048's last Tier 2 item — the row says the node follows the pointer **exactly**,
     * and this asserted only `|Δx| + |Δy| > 20` against a pointer that travels ~180px. A node that
     * lurched 25px and stopped would have passed.
     *
     * ⚠️ **The expected delta is NOT (120, 80).** The drag starts at the node's **centre** and ends
     * at `(before.x + 120, before.y + 80)`, so the pointer travels `(120 - w/2, 80 - h/2)`.
     * Asserting (120, 80) would fail on a perfectly good drag — the same guess-instead-of-measure
     * error that produced two false alarms elsewhere in this suite (P1-S4 reading radio `.value`s as
     * pre-filled data, P3-S3 expecting a STIX id on a tree node).
     *
     * Measured with `probe-0048-p2s3-drag-geometry.mjs`, three consecutive drags:
     *   icon 20×20 · expected (110, 70) · actual (110, 70) · **error (0, 0)** every time.
     *
     * So the tracking really is exact and a tight tolerance is honest rather than optimistic. 6px
     * absorbs sub-pixel rounding and any settling nudge without admitting a fling.
     */
    const expectedDx = 120 - before!.width / 2
    const expectedDy = 80 - before!.height / 2
    const errX = Math.abs(after!.x - before!.x - expectedDx)
    const errY = Math.abs(after!.y - before!.y - expectedDy)
    observe(
      test.info(),
      'note',
      `drag: icon ${Math.round(before!.width)}×${Math.round(before!.height)}, expected ` +
        `(${Math.round(expectedDx)}, ${Math.round(expectedDy)}), actual ` +
        `(${Math.round(after!.x - before!.x)}, ${Math.round(after!.y - before!.y)})`,
    )
    expect(errX, 'node tracked the pointer on X (the row says "exactly")').toBeLessThanOrEqual(6)
    expect(errY, 'node tracked the pointer on Y (the row says "exactly")').toBeLessThanOrEqual(6)
    // Guards the regression in docs/issues/0006: dragging used to re-heat the simulation
    // and leave it churning. Positions must be stable a moment after release.
    const settled = await node.boundingBox()
    await page.waitForTimeout(2_500)
    const still = await node.boundingBox()
    const drift = Math.abs(still!.x - settled!.x) + Math.abs(still!.y - settled!.y)
    expect(drift, 'graph settles after the drag').toBeLessThan(15)
  })

  step('P2-S4', async ({ page }) => {
    // Manual-only, and 2026-08-05 established *why* more precisely than "CDP times out".
    //
    // PAN was verified in Chrome against the real embedded page: a background drag of (+170,-110)
    // moved every node by exactly that delta — a canvas pan, not a node drag.
    //
    // ZOOM could not be driven by any automation available here. Chrome's `scroll` action delivers
    // **zero wheel events** — measured with a capture-phase `wheel` listener on the widget's own
    // document, which logged 0 after a 4-tick scroll. So "the graph did not zoom" is a statement
    // about the tool, not the product, and reporting it as a defect would have been wrong.
    //
    // What the product does: dispatching a real WheelEvent on the widget's svg runs its d3.zoom
    // handler and writes `scale(1.5157)` into the layout transform. Zoom works.
    //
    // Both come from the same `zoom_handler(parentSvg)` in widget-graph-viz-overview — pan proves
    // it is attached in the embedded context, and d3.zoom sets no `.filter()` that could accept
    // drags while rejecting wheels. See docs/issues/0006 and GitHub #80.
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

    // ⚠️ The above clicks ONE node, and most nodes are stix-typed — which never broke. docs/issues/0049
    // was specifically that **os-threat typed** objects (event, sequence, task, anecdote) 404'd,
    // because the recorded `object_family` named a folder that does not exist. Asserting only the
    // first node would report that defect as fixed without ever exercising it.
    //
    // So walk the graph and require that *every* form opened resolves. A 404 renders zero inputs,
    // which is exactly what this catches.
    const nodes = graph(page).locator(NODE)
    const total = Math.min(await nodes.count(), 8)
    const broken: string[] = []
    const opened: string[] = []
    for (let i = 0; i < total; i++) {
      await nodes.nth(i).click()
      let url = ''
      let inputs = 0
      for (let waited = 0; waited < 12_000; waited += 1_000) {
        const frame = page.frames().find(
          (f) => /stixorm-forms/.test(f.url()) && !/\/default(\.html)?$/.test(f.url()),
        )
        if (frame) {
          url = frame.url()
          inputs = await frame.locator('input').count().catch(() => 0)
          if (inputs > 0) break
        }
        await page.waitForTimeout(1_000)
      }
      const form = url.split('/').slice(-1)[0] || '(no form frame)'
      if (inputs === 0) broken.push(`${form} (0 inputs)`)
      else opened.push(form)
    }
    observe(test.info(), 'note', `left-select opened ${opened.length}/${total} forms: ${[...new Set(opened)].join(', ')}`)
    expect(broken, `every left-selected node opened a form that resolves (0049)`).toEqual([])
  })

  step('P2-S6', async ({ page }) => {
    await openOverview(page)

    // The claim is "the theme **config** applies to the viz" — so read the configured theme and
    // require the rendering to match it, rather than demanding dark unconditionally. The deployed
    // options say `current_theme: "light"`, so the old assertion could only ever fail here, and a
    // failure would have said nothing about whether theming works. #82's options are consumed as of
    // 2026-08-05 (P2-S7), which is what makes this checkable at all.
    const widget = page.frames().find((f: any) => /widgetdevoverview|:4008/.test(f.url()))
    expect(widget, 'the widget frame is present').toBeTruthy()

    const configured = await widget!.evaluate(() => {
      const ns = (window as any).Widgets?.Widget
      return (ns && ns.config && ns.config.current_theme) || null
    })
    const luminance = await widget!.evaluate(() => {
      const bg = getComputedStyle(document.body).backgroundColor
      const m = bg.match(/\d+/g)
      return m ? m.slice(0, 3).map(Number).reduce((a, b) => a + b, 0) : null
    })
    observe(test.info(), 'note', `current_theme=${configured}, body luminance sum=${luminance}`)

    expect(configured, 'the widget has a configured theme (from #82 options)').toBeTruthy()
    expect(luminance, 'the widget body has a measurable background').not.toBeNull()
    if (configured === 'dark') {
      expect(luminance!, 'dark theme renders a dark background').toBeLessThan(200)
    } else {
      expect(luminance!, 'light theme renders a light background').toBeGreaterThanOrEqual(200)
    }
  })

  step('P2-S7', async ({ page }) => {
    await openOverview(page)

    // ⚠️ Assert inside the WIDGET frame. The widget fetches its options from its own document, so
    // `performance.getEntriesByType('resource')` on the top-level page never sees the request —
    // the previous version of this step checked the parent and reported "did not request" against
    // a widget that had just fetched them.
    const widget = page.frames().find((f: any) => /widgetdevoverview|:4008/.test(f.url()))
    expect(widget, 'the widget frame is present').toBeTruthy()

    const asked = await widget!.evaluate(() =>
      performance.getEntriesByType('resource').some((e: any) => /overview-options/i.test(e.name)),
    )
    expect(asked, 'widget requested the Overview options (#82)').toBeTruthy()

    // Requesting is not applying. `current_theme` is supplied only by the API — it is not among the
    // widget's built-in defaults — so its presence in ns.config proves the merge actually landed.
    const merged = await widget!.evaluate(() => {
      const ns = (window as any).Widgets?.Widget || (window as any).ns
      const cfg = ns && ns.config
      return cfg ? { current_theme: cfg.current_theme, iconSize: cfg.iconSize, prefix: cfg.prefix } : null
    })
    expect(merged, 'the widget namespace exposes its config').toBeTruthy()
    observe(test.info(), 'note', `merged config: ${JSON.stringify(merged)}`)
    expect(merged!.current_theme, 'an API-only option (current_theme) reached ns.config').toBeDefined()
  })
})
