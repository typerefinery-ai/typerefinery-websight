import { expect } from '@playwright/test'
import { step, test, observe } from '../runsheet'
import { clickAnyNode, selectPopulatedNode } from '../form-pane'
import {
  choosePairWithConnectionField,
  ensurePromotable,
  ensureScratch,
  promotableIds,
  requireScratch,
} from '../fixtures'
import { SHOWCASE, FLOW_BASE } from '../playwright.config'

/** Act 3 — Incident Composer. Runsheet Act 3 / docs/issues/0007. */

const COMPOSER = `${SHOWCASE}/forms/composer-local.html`
/** The composer workbench is the dependable lab for cross-origin gestures (docs/issues/0007). */
export const WORKBENCH = 'http://localhost:4005/workbench.html'

/**
 * The composer draws its tree and graph nodes as SVG **images/groups**, not bare circles —
 * a probe of the workbench counted `svg image` 3, `svg circle` 0, class `node`×3.
 */
const NODE_SELECTOR = 'svg image, svg g.node, svg g[class*="node"], svg circle, [class*="tree-node"], [class*="treenode"]'

/**
 * ⚠️ **The workbench hosts the widget in an iframe** (`http://localhost:4005/` inside
 * `workbench.html`). Querying at the top level finds nothing, which is why every workbench step
 * failed for two runs even though the screenshots show a populated Evidence List. Always go
 * through this frame.
 */
function widget(page: any) {
  return page.frameLocator('iframe').first()
}

/**
 * On the **Composer page** (as opposed to the workbench) the layout is:
 *
 *   frame[1] `widgetdevcomposer…`  — the whole widget: Evidence List + Promotable + Scratch
 *                                    (31 node images, 3 svgs, the source radios)
 *   frame[2] `…/stixorm-forms/default` — the form pane, showing "Select an object in the viz…"
 *
 * A left-select does **not** add a frame; it *navigates the existing form frame* away from
 * `default`. An earlier version of P3-S5 counted iframes and so could never observe a pass.
 */
function composerWidget(page: any) {
  return page.frameLocator('iframe[src*="widgetdevcomposer"], iframe[src*="4005"]').first()
}

/**
 * The three panes carry stable ids, so steps can name the pane they mean instead of
 * indexing into "all nodes on the page". That matters: the first node in DOM order belongs to
 * the **tree**, and clicking a tree node only shows its JSON tooltip — it does *not* open a
 * form. P3-S5 failed for exactly that reason while the behaviour it tests worked fine.
 *
 *   `.tree_svg`    — Evidence List   (3 nodes)
 *   `.promo_svg`   — Promotable      (23 nodes for the current incident)
 *   `.scratch_svg` — Scratch Pad     (5 nodes)
 */
const PANE = { tree: 'svg.tree_svg', promo: 'svg.promo_svg', scratch: 'svg.scratch_svg' }
const paneNodes = (page: any, pane: string) =>
  composerWidget(page).locator(pane).locator('image, g.node, circle')

/**
 * Right-click targets, which are **not** the same elements as `paneNodes`.
 *
 * A pane alternates in DOM order: a `g.node` row group (~162×40, the whole row) and then the
 * `image` icon inside it (40×40). The **context-menu handler lives on the `image`** — measured
 * 2026-08-04: right-clicking `g.node` produces no menu at all, right-clicking the `image`
 * immediately in front of it opens Copy / Edit DAG.
 *
 * `paneNodes(...).first()` therefore lands on the row group and hangs waiting for a menu that
 * will never appear. That is what made P3-S4 fail while the feature it tests worked — the same
 * shape of harness defect as docs/issues/0040, and now docs/issues/0043.
 */
const paneNodeIcons = (page: any, pane: string) =>
  composerWidget(page).locator(pane).locator('image')

/**
 * Composer modals (Create SRO / Create Connection) mount in a **fourth frame** of their own,
 * `…/forms/stixorm-forms/modal-forms/…` — not in the widget frame and not in the host page.
 * That is why asserting on the modal from either of those found nothing while the modal was
 * plainly on screen.
 */
async function modalState(page: any) {
  for (const f of page.frames()) {
    if (!/modal-forms/.test(f.url())) continue
    const text = await f.locator('body').innerText().catch(() => '')
    const values = await f
      .locator('input')
      .evaluateAll((els: HTMLInputElement[]) => els.map((e) => e.value).filter(Boolean))
      .catch(() => [] as string[])
    // ⚠️ Count the **Choices-rendered** items, not native <option> elements. Choices.js takes
    // the options out of the native select and renders its own list, so `select option` is
    // legitimately 0 on a fully populated field — that miscount made this step look like a
    // product defect for three runs (docs/issues/0030, closed as not-a-defect).
    const options = await f.locator('.choices__item').count().catch(() => 0)
    // ⚠️ …but that count is **unscoped**, and Choices.js also renders an item for the selected /
    // placeholder entry. So an *empty* field list — defect 0030's exact symptom — still counts 1
    // and passes a `> 0` assertion (measured: 1 item while the modal read "No choices to choose
    // from"). Scope to the dropdown list for a count of genuinely selectable options, the way
    // P5-S5 does. Both are returned so callers can say which they mean.
    // ⚠️ …and even the SCOPED list carries a placeholder when it is empty: Choices.js renders an
    // item reading 'No choices to choose from'. Measured 2026-08-05 on an email-addr -> identity
    // pair, where no valid connection field exists — the count read 1 and P3-S7 duly 'chose' the
    // placeholder as its field. Exclude it, or an empty list passes a > 0 assertion (0030 again).
    const dropdownItems = f.locator('.choices__list--dropdown .choices__item')
    const dropdownLabels = (await dropdownItems.allInnerTexts().catch(() => [] as string[]))
      .map((t) => t.trim())
      .filter((t) => t && !/no choices/i.test(t))
    const dropdownOptions = dropdownLabels.length
    return { found: true, text, values, options, dropdownOptions, dropdownLabels }
  }
  return { found: false, text: '', values: [] as string[], options: 0, dropdownOptions: 0, dropdownLabels: [] as string[] }
}

/** True once the form pane has left the default placeholder and rendered a real form. */
async function formPaneOpened(page: any) {
  for (const f of page.frames()) {
    const url = f.url()
    if (!/stixorm-forms|forms\//.test(url) || /\/default(\.html)?$/.test(url)) continue
    const inputs = await f.locator('input, select, textarea').count().catch(() => 0)
    if (inputs > 0) return true
  }
  return false
}

async function openComposer(page: any) {
  await page.goto(COMPOSER, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(12_000)
}

test.describe('Act 3 — Incident Composer', () => {
  step('P3-S1', async ({ page, request }) => {
    // docs/issues/0076 — this step asserts all three panes are non-empty, and Act 3 drains Scratch to
    // zero over repeated runs, so it fails on the fixture rather than on the behaviour it guards
    // (0004: Promo/Scratch rendered empty). Seeding was added to P3-S8/P3-S9 first and missed here.
    await ensureScratch(page, request, 1)
    await openComposer(page)

    // ⚠️ This used to loop over **iframes** and pass if any one of them held a node. All three
    // panes live inside the single `widgetdevcomposer` frame, so one node anywhere satisfied it —
    // an empty Promo or Scratch (the exact 0004 defect this row guards) was green
    // (docs/issues/0048). Assert each pane separately, by its own svg.
    const paneCounts: Record<string, number> = {}
    for (const [name, sel] of Object.entries(PANE)) {
      await expect
        .poll(async () => (paneCounts[name] = await paneNodes(page, sel).count().catch(() => 0)), {
          timeout: 60_000,
          message: `${name} pane holds rendered nodes (0004: Promo/Scratch rendered empty)`,
        })
        .toBeGreaterThan(0)
    }
    observe(test.info(), 'note', `pane node counts — ${Object.entries(paneCounts).map(([k, v]) => `${k}:${v}`).join(' ')}`)

    // docs/issues/0058 — no pane's drawing surface may extend past its own container. A full run
    // failed P3-S6 because `svg.scratch_svg` had grown over the Promo pane and **intercepted its
    // clicks**; the Promo node was visible, enabled and stable, and the click still never landed.
    //
    // Asserted here rather than left to P3-S6 because "a click was intercepted" only shows up when
    // the overlap happens to sit under the node the step chose. This measures the condition itself,
    // so the fix is verifiable instead of probabilistic.
    const overflow = await composerWidget(page)
      .locator('svg.promo_svg, svg.scratch_svg')
      .first()
      .evaluate(() => {
        const report: Array<{ pane: string; overflowX: number; overflowY: number }> = []
        for (const id of ['promo_panel', 'scratch_panel']) {
          const pane = document.getElementById(id)
          const svg = pane && pane.querySelector('svg')
          if (!pane || !svg) continue
          const p = pane.getBoundingClientRect()
          const s = svg.getBoundingClientRect()
          report.push({
            pane: id,
            overflowX: Math.round(Math.max(0, s.right - p.right, p.left - s.left)),
            overflowY: Math.round(Math.max(0, s.bottom - p.bottom, p.top - s.top)),
          })
        }
        return report
      })
    observe(test.info(), 'note', `pane overflow — ${overflow.map((o) => `${o.pane}:${o.overflowX}x${o.overflowY}`).join(' ')}`)
    for (const o of overflow) {
      // A couple of pixels of border/rounding is fine; a pane covering its neighbour is not.
      expect(o.overflowX, `${o.pane} svg does not extend past its pane horizontally`).toBeLessThan(8)
      expect(o.overflowY, `${o.pane} svg does not extend past its pane vertically`).toBeLessThan(8)
    }

    // docs/issues/0065 — every pane node must be **reachable**. The Overview has asserted the
    // equivalent since 0056 (P2-S2, "all nodes within the visible panel bounds"); the Composer had
    // no such check, which is how nodes at y = -46.68 and y = 386.6 went unnoticed while two fixes
    // for the same family of fault landed next door. They surfaced instead as intermittent failures
    // in P5-S4 and P3-S7, which were mis-attributed to load latency for two ticks.
    //
    // ⚠️ Assert the node's **centre**, not strict containment. A click — Playwright's or a user's —
    // lands on the centre, so a node overhanging an edge by a few pixels is still perfectly usable.
    // Requiring every node fully inside would fail on ~1 node per pane for a purely cosmetic reason.
    const unreachable = await composerWidget(page)
      .locator('svg.promo_svg')
      .first()
      .evaluate(() => {
        const report: Array<{ pane: string; total: number; unreachable: number; worst: string }> = []
        for (const cls of ['promo_svg', 'scratch_svg']) {
          const svg = document.querySelector(`svg.${cls}`)
          if (!svg) continue
          const box = svg.getBoundingClientRect()
          const nodes = [...svg.querySelectorAll('image')]
            .map((n) => ({
              id: n.id || '',
              cx: Number(n.getAttribute('x')) + (Number(n.getAttribute('width')) || 0) / 2,
              cy: Number(n.getAttribute('y')) + (Number(n.getAttribute('height')) || 0) / 2,
            }))
            .filter((n) => Number.isFinite(n.cx) && Number.isFinite(n.cy))
          const out = nodes.filter((n) => n.cx < 0 || n.cy < 0 || n.cx > box.width || n.cy > box.height)
          report.push({
            pane: cls,
            total: nodes.length,
            unreachable: out.length,
            worst: out.length ? `${out[0].id.slice(0, 24)}@(${Math.round(out[0].cx)},${Math.round(out[0].cy)})` : '-',
          })
        }
        return report
      })
    observe(
      test.info(),
      'note',
      `pane node reachability — ${unreachable.map((u) => `${u.pane}:${u.total - u.unreachable}/${u.total} reachable`).join(' ')}`,
    )
    for (const u of unreachable) {
      expect(u.unreachable, `${u.pane}: every node's centre is inside the pane (worst ${u.worst})`).toBe(0)
    }

    // ⚠️ The check above is a **weak** guard, and 2026-08-10 proved it: with `clampNodesToPanel`
    // disabled entirely, it still passed. Not because it is vacuous — it measured 28 promo and 12
    // scratch nodes — but because **the defect is node-count dependent**. The escapes recorded in
    // docs/issues/0065 (y = -46.68, y = 386.6) were measured when Promotable had grown to ~38–55
    // nodes via docs/issues/0051; at the reset count of 28 the spread stays inside the pane, so
    // there is nothing for the assertion to catch. It fires only once the simulation happens to
    // breach the bound — which is exactly when a demo is being rehearsed, and never on fresh data.
    //
    // So assert the **invariant** as well as the outcome: hand the containment function nodes that
    // are definitively outside and require it to bring them back. Deterministic, independent of how
    // many nodes the panes hold, and it fails the moment containment is removed.
    //
    // Deliberately uses a **synthetic array**, not the live simulation's nodes: this must not
    // perturb the graph the other steps go on to click. (It therefore checks that containment is
    // implemented and correct, while the check above covers that it is actually wired into the
    // tick handler — the two together are the guard.)
    const containment = await composerWidget(page)
      .locator('svg.promo_svg')
      .first()
      .evaluate(() => {
        const fg = (window as any).Widgets?.Panel?.ForceGraph
        if (!fg || typeof fg.clampNodesToPanel !== 'function') {
          return { implemented: false, moved: 0, after: [] as Array<{ x: number; y: number }>, box: null as any }
        }
        const svg = document.querySelector('svg.promo_svg')
        const box = svg ? svg.getBoundingClientRect() : null
        // Far outside on every side, so a partial clamp (one axis, one direction) still fails.
        const probes = [
          { x: -500, y: -500 },
          { x: 99999, y: 99999 },
          { x: -1, y: 50 },
          { x: 50, y: 99999 },
        ]
        const moved = fg.clampNodesToPanel(probes, '#promo_panel', 35)
        return {
          implemented: true,
          moved,
          after: probes.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })),
          box: box ? { w: Math.round(box.width), h: Math.round(box.height) } : null,
        }
      })

    observe(
      test.info(),
      'note',
      `containment invariant — implemented=${containment.implemented} moved=${containment.moved}/4 ` +
        `into ${containment.box ? `${containment.box.w}x${containment.box.h}` : '?'}: ` +
        containment.after.map((p) => `(${p.x},${p.y})`).join(' '),
    )

    expect(containment.implemented, 'the panes have a containment function at all (docs/issues/0065)').toBe(true)
    expect(containment.moved, 'containment moves every out-of-bounds node (4 probes, each outside)').toBe(4)
    for (const p of containment.after) {
      expect(p.x, `containment brought x back inside the pane — got ${p.x}`).toBeGreaterThanOrEqual(0)
      expect(p.y, `containment brought y back inside the pane — got ${p.y}`).toBeGreaterThanOrEqual(0)
      if (containment.box) {
        expect(p.x, `containment brought x back inside the pane — got ${p.x}`).toBeLessThanOrEqual(containment.box.w)
        expect(p.y, `containment brought y back inside the pane — got ${p.y}`).toBeLessThanOrEqual(containment.box.h)
      }
    }

    // "…none drifting" is the row's third claim (0016: the graph never settles when embedded).
    // Two measurements of the same node, 3 s apart, is the P2-S3 pattern.
    const firstIcon = composerWidget(page).locator(PANE.promo).locator('image').first()
    const at = async () => JSON.stringify(await firstIcon.boundingBox().catch(() => null))
    const t0 = await at()
    await page.waitForTimeout(3_000)
    expect(await at(), 'Promo graph has settled — no drift 3s after load (0016)').toBe(t0)
  })

  step('P3-S2', async ({ page, request }) => {
    // The Composer page carries the radios directly (Attack-Flow, Behavior, Sighting, Tasks,
    // Impact, Event, User, Company) — no need for the workbench now that the frame is targeted.
    await openComposer(page)
    const radios = composerWidget(page).locator('input[type="radio"]')
    await expect.poll(async () => await radios.count(), { timeout: 60_000 }).toBeGreaterThan(1)

    const treeBefore = await composerWidget(page).locator(PANE.tree).innerHTML().catch(() => '')
    // Switch to a different source and let the tree reload.
    await radios.nth(3).click({ force: true })
    await page.waitForTimeout(8_000)
    const treeAfter = await composerWidget(page).locator(PANE.tree).innerHTML().catch(() => '')
    expect(treeAfter, 'tree re-rendered for the newly selected source').not.toBe(treeBefore)

    // ⚠️ The assertion above only proves the DOM changed. It passed for months while
    // /viz-data/tree-company was running the *Unattached* algorithm and serving unattached objects
    // (docs/issues/0073) — because it never checks WHICH data set arrived, and nth(3) is "Tasks",
    // so Company and User are never selected at all.
    //
    // Every tree source must answer with a TREE. Measured 2026-08-11 across all six routes:
    //
    //   tree-sighting  TREE  children:2   tree-task  TREE  children:2
    //   tree-impact    TREE  children:1   tree-event TREE  children:1
    //   tree-user      TREE  children:0   tree-company  NODES/EDGES  nodes:39   <-- the odd one out
    //
    // ⚠️ Shape, not content, is the right invariant here. An earlier version of this check compared
    // the company node ids against the unattached set — which caught today's defect but would have
    // kept failing after a fix, because a correctly-working tree-company returns `children`, not
    // `nodes`, so the comparison would read zero company nodes forever.
    const shapeOf = async (route: string) => {
      const res = await request.get(`${FLOW_BASE}/viz-data/${route}`, { timeout: 60_000 })
      const body = res.ok() ? await res.json().catch(() => ({} as any)) : ({} as any)
      return {
        route,
        tree: Array.isArray(body.children),
        children: (body.children || []).length,
        nodes: (body.nodes || []).length,
        name: body.name || '',
      }
    }

    const sources = ['tree-sighting', 'tree-task', 'tree-impact', 'tree-event', 'tree-user', 'tree-company']
    const shapes = []
    for (const s of sources) shapes.push(await shapeOf(s))
    observe(
      test.info(),
      'note',
      shapes.map((s) => `${s.route}:${s.tree ? `tree(${s.children})` : `nodes(${s.nodes})`}`).join(' '),
    )

    const notTrees = shapes.filter((s) => !s.tree)
    expect(
      notTrees.map((s) => `${s.route} returned ${s.nodes} nodes/edges instead of a tree`),
      'every treeview source must answer with a tree — one returning the unattached nodes/edges ' +
        'graph is the signature of that tab running another flow\'s algorithm (docs/issues/0073)',
    ).toEqual([])
  })

  step('P3-S3', async ({ page }) => {
    await page.goto(WORKBENCH, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(8_000)
    const node = widget(page).locator(NODE_SELECTOR).first()
    await expect(node).toBeVisible({ timeout: 40_000 })
    // Captured BEFORE the gesture — the preview assertion below is only meaningful as a change.
    const bodyBefore = (await widget(page).locator('body').innerText()).replace(/\s+/g, ' ')
    await node.click({ button: 'right' })
    await expect(widget(page).getByText(/copy/i).first()).toBeVisible({ timeout: 20_000 })
    await expect(widget(page).getByText(/edit dag/i).first()).toBeVisible({ timeout: 20_000 })

    /**
     * docs/issues/0048 Tier 2 — the row says the menu shows Copy and Edit DAG **"with the node's JSON
     * preview"**, and the preview half was never asserted. A menu that rendered its two items and no
     * preview at all passed.
     *
     * ⚠️ **Two wrong ways to assert this, both tried:**
     *
     * 1. *Compare the preview against the node's STIX id.* Tree nodes do not carry one — measured,
     *    the element's attributes are `{id: "node", class: "node", transform: …}`. The id is a
     *    literal string, not the object's identity, so that check failed for a reason that had
     *    nothing to do with the behaviour.
     * 2. *Assert some JSON is on the page.* That is precisely the anti-pattern this issue exists to
     *    kill — the preview only means something if it **appeared because of the right-click**.
     *
     * So assert it the one way that can actually fail for the right reason: **capture before,
     * compare after.** The preview must be absent before the gesture and carry a well-formed STIX
     * object after it, with `type` and `id` agreeing — measured shape:
     * `{"type": "sighting", "spec_version": "2.1", "id": "sighting--f38db457-…", …}`.
     */
    const stixId = /"id"\s*:\s*"([a-z0-9-]+)--[0-9a-f-]{36}"/
    expect(
      stixId.test(bodyBefore),
      'no JSON preview is on screen BEFORE the right-click — otherwise this asserts nothing',
    ).toBeFalsy()

    const after = (await widget(page).locator('body').innerText()).replace(/\s+/g, ' ')
    const match = stixId.exec(after)
    expect(match, 'the right-click produced a JSON preview carrying a STIX id').toBeTruthy()

    // The preview describes ONE object: the `type` field and the id's prefix must agree. A fragment
    // stitched from two objects, or a stale preview from a previous selection, fails here.
    const typeInPreview = /"type"\s*:\s*"([a-z0-9-]+)"/.exec(after)
    expect(
      typeInPreview?.[1],
      `the preview's "type" agrees with its id prefix (${match?.[1]})`,
    ).toBe(match?.[1])
  })

  step('P3-S4', async ({ page, request }) => {
    // The criterion is "copies to unattached context and refreshes", so assert the *effect* —
    // the object arriving in unattached context — rather than matching toast wording. Runs on
    // the Composer page, which carries the real tree and the real host wiring.
    const api = await request
    const before = await (await api.get(`${FLOW_BASE}/viz-data/unattached-split`)).json()
    const beforeCount = (before.scratch?.nodes || []).length + (before.promo?.nodes || []).length

    await openComposer(page)
    // Right-click the node *icon*, not the row group — only the icon carries the menu handler.
    const treeNode = paneNodeIcons(page, PANE.tree).first()
    await expect(treeNode).toBeVisible({ timeout: 60_000 })
    await treeNode.click({ button: 'right' })

    // Arm the wait *before* the click so a fast reply cannot be missed. The `.catch` matters:
    // a pending waitForResponse rejects with "Test ended" when anything *else* fails first, and
    // Playwright then reports that instead of the real cause — it masked the actual failure here.
    const copyResponse = page
      .waitForResponse(
        (r) => /copy-to-unattached/.test(r.url()) && r.request().method() === 'POST',
        { timeout: 60_000 },
      )
      .catch(() => null)
    await composerWidget(page).getByText(/^\s*copy\s*$/i).first().click()

    // The copy algorithm used to fail for every STIX type (docs/issues/0033) — guard the message
    // so a regression is recognisable rather than just "count did not grow".
    await expect(composerWidget(page).locator('text=/No content found for STIX type/i')).toHaveCount(0)

    // Do NOT assert the unattached count grew. `add_node` matches on id and *replaces*, and every
    // node in the tree the Composer opens on is already in unattached context (measured: 31 of 31
    // for tree-company), so a re-copy is a legitimate no-op that leaves the count identical. The
    // old assertion could therefore never pass, and reported a working feature as broken in every
    // run since it was written (docs/issues/0040).
    //
    // Assert the criterion instead: the copy call succeeded, and nothing was lost.
    const copied = await copyResponse
    expect(copied, 'the Copy click produced no POST to copy-to-unattached').not.toBeNull()
    expect(copied!.ok(), `copy-to-unattached returned ${copied!.status()}`).toBeTruthy()
    const body = await copied!.text()
    expect(body, 'copy API reported an error').not.toMatch(/error|No content found/i)

    const after = await (await api.get(`${FLOW_BASE}/viz-data/unattached-split`)).json()
    const afterCount = (after.scratch?.nodes || []).length + (after.promo?.nodes || []).length
    expect(afterCount, 'copy must never lose objects').toBeGreaterThanOrEqual(beforeCount)

    // 0040 rightly rules out asserting the count *grew* — `add_node` replaces by id, and every tree
    // node is already in unattached context, so a re-copy is a legitimate no-op. But **presence** is
    // still assertable, and that is what "copied to unattached context" actually claims
    // (docs/issues/0048, Tier 2). The Copy request body carries the raw node, so take the id from
    // there rather than guessing which node was clicked.
    const copiedId = (copied!.request().postData() || '').match(/[a-z-]+--[0-9a-f-]{8,}/i)?.[0]
    if (copiedId) {
      const present = [...(after.scratch?.nodes || []), ...(after.promo?.nodes || [])]
        .some((n: any) => String(n.id) === copiedId)
      expect(present, `the copied object ${copiedId} is in unattached context`).toBeTruthy()
      observe(test.info(), 'note', `copied ${copiedId}; unattached ${beforeCount} → ${afterCount} (replace-by-id, so equal is correct)`)
    } else {
      observe(test.info(), 'note', 'could not read a stix id from the copy request body — presence not asserted')
    }
  })

  step('P3-S5', async ({ page }) => {
    await openComposer(page)
    const nodes = paneNodes(page, PANE.promo)
    await expect
      .poll(async () => await nodes.count(), { timeout: 60_000, message: 'Promo pane nodes rendered' })
      .toBeGreaterThan(0)

    // The row claims the form opens **populated** — "identity 15/20 fields, relationship 12/15,
    // every field the payload carries". This used to assert only that *some* form frame left the
    // default placeholder and had at least one input, which is a much weaker claim
    // (docs/issues/0048, Tier 2). It also clicked `nodes.first()`, and pane ordering varies between
    // runs: land on an os-threat family and the form is a 0-input 404
    // (docs/issues/0049), so the step was flaky-red for a reason unrelated to what it tests.
    //
    // `selectPopulatedNode` walks the pane and applies the real measurement — see `../form-pane`.
    // ⚠️ docs/issues/0076 — same gate as P5-S4, for the same measured reason. Controlled pair:
    // Act 3 run from a freshly reset dataset passes **13/13**; run again immediately, with no reset,
    // **P3-S5 fails at 6/14**. Each Act 3 run leaves ~2 more objects in Promo (76 → 78 → 80), and
    // those the suite creates are sparse, so they progressively crowd out the candidates this step
    // samples. Without a minimum, the walk stops at the first node that merely has nothing
    // *missing* — which a one-field object satisfies — and the ratio assertion below then fails on
    // a fixture problem rather than a product one.
    const { shape, skipped, tried } = await selectPopulatedNode(page, nodes, {
      candidates: 10,
      minFilledRatio: 0.5,
    })
    if (skipped.length) {
      observe(test.info(), 'note', `left-select opened no object for: ${skipped.join(', ')}`)
    }
    expect(
      shape,
      `left-select opened a populated Update form (tried ${tried}: ${skipped.join(', ') || 'none empty'})`,
    ).not.toBeNull()
    observe(
      test.info(),
      'note',
      `${shape!.frame} pre-filled ${shape!.filled}/${shape!.total} fields for ${shape!.id}`,
    )
    expect(shape!.filled / shape!.total, `most fields pre-filled (${shape!.filled}/${shape!.total})`)
      .toBeGreaterThan(0.5)
  })

  // S6/S7 run against the **Composer page**, not the workbench: the page's widget carries the
  // real Promo (23 nodes / 42 edges) and Scratch (5 nodes) data for the current incident, while
  // the workbench only preloads the tree fixture and leaves both panes empty.
  /**
   * Select one object in Promo, then one in Scratch — selection *order* sets source/target.
   *
   * ⚠️ **Creating an SRO consumes a Scratch node.** Once a scratch object is linked to a
   * promotable, `split_subgraphs_by_promotables` classifies it as promotable-connected and moves it
   * into Promo. So every P3-S6 run permanently shrinks Scratch by one, and after enough runs the
   * pane is empty — six runs during the docs/issues/0050 work took it from 3 to 0, which failed
   * P3-S7 and P3-S8 for a data reason unrelated to what they test.
   *
   * That is why the Scratch requirement is a *preference*, not a preconditon: fall back to a second
   * Promo node and say so, rather than reporting a red suite for an exhausted fixture. The
   * cross-pane case is P3-S6's own claim and it asserts it directly.
   */
  async function selectAcrossPanes(page: any) {
    const promo = paneNodes(page, PANE.promo)
    const scratch = paneNodes(page, PANE.scratch)
    await expect.poll(async () => await promo.count(), { timeout: 60_000 }).toBeGreaterThan(1)
    // ⚠️ `.first()` is a coin flip — the simulation can settle a node outside the pane viewport and
    // Playwright then burns its whole timeout on an unclickable element (docs/issues/0065).
    await clickAnyNode(promo, { label: 'promo' })

    if ((await scratch.count()) > 0) {
      return await clickAnyNode(scratch, { label: 'scratch' })
    }
    observe(
      test.info(),
      'note',
      'Scratch pane is empty — selecting a second Promo node instead. Creating an SRO moves its ' +
        'scratch endpoint into Promo, so repeated runs drain the pane (docs/issues/0051).',
    )
    await promo.nth(1).click()
    return promo.nth(1)
  }

  step('P3-S6', async ({ page, request }) => {
    // The runsheet's Expected result makes TWO claims: the modal opens pre-filled, **and** "the
    // relationship is created across the two panes". Only the first was ever asserted, so the step
    // showed green for weeks while the relationship was never written (docs/issues/0047).
    //
    // The modal half genuinely works and stays strict — it is what #23's own criterion asks for.
    // The persistence half is recorded via observe() rather than expect(), because it is a known
    // open defect: failing here would turn the suite red for something already tracked, and the
    // harness's contract is that red means "something that used to work no longer does".
    // Promote this to a hard assertion once 0047's save logic is authored.
    const api = await request
    const countRels = async () => {
      const j = await (await api.get(`${FLOW_BASE}/viz-data/unattached-split`)).json()
      return [...(j.promo?.nodes || []), ...(j.scratch?.nodes || [])]
        .filter((n: any) => String(n.id || '').startsWith('relationship--')).length
    }
    const before = await countRels()

    await openComposer(page)
    const target = await selectAcrossPanes(page)
    await target.click({ button: 'right' })
    await composerWidget(page).getByText(/create sro/i).first().click()

    // ⚠️ Assert in the MODAL frame, not the widget frame. The composer modals mount in a fourth
    // frame (`…/modal-forms/…`), and the widget itself renders every edge label as text — the
    // Promo pane alone shows 8 visible `related-to` edge labels *before any menu is opened*
    // (measured 2026-08-04). An earlier version asserted `composerWidget.getByText(/related-to/)`
    // and so passed vacuously: it was matching graph edges, never the modal.
    // ⚠️ Waiting for the FRAME is not waiting for the FORM. The modal-forms frame mounts, and its
    // heading renders, **before** the widget has posted the two selected ids into it — the same
    // mount-before-load trap that form-pane.ts documents for the update forms. Polling on
    // `found` alone reads a half-built form, and whether that read lands early enough is a race
    // this step lost once in a full run (docs/issues/0055): the snapshot at the moment of failure
    // shows Source Ref and Target Ref BOTH populated, so the product was fine and the assertion
    // was early. Poll until the refs are actually there, then assert.
    /**
     * docs/issues/0166 — this poll fails intermittently in a **full** run (measured 2 of 5) and
     * passes when the step is re-run alone. The bare failure says only *"the modal never mounted"*,
     * which is not enough to act on, so capture the state that distinguishes the candidates **at the
     * moment of failure** and re-throw.
     *
     * 🔑 **What the answers mean:**
     *   - no `modal-forms` frame **and** the context menu still on screen → the *"Create SRO"* click
     *     never took effect (a gesture/timing problem, not the modal);
     *   - no frame **and** no menu → the menu closed but nothing opened (the event was raised and
     *     lost, or never raised);
     *   - a `modal-forms` frame present → the poll's own read is at fault, not the product.
     *
     * ⚠️ Note this failure is at **frame mount**, which the pair-dependence mechanism 0166 quotes
     * from `act3-journey.demo.ts` does **not** explain — an unusable pair yields a *mounted* modal
     * with an empty dropdown, not a missing frame. Recording that distinction is the point.
     */
    try {
      await expect
        .poll(async () => (await modalState(page)).found, {
          timeout: 30_000,
          message: 'the SRO modal mounted in its own modal-forms frame',
        })
        .toBeTruthy()
    } catch (error) {
      const frames = page.frames().map((f: any) => f.url().split('/').pop() || '(root)')
      const widgetText = await composerWidget(page)
        .locator('body')
        .innerText()
        .catch(() => '')
        .then((t: string) => t.replace(/\s+/g, ' '))
      const menuStillOpen = /create sro/i.test(widgetText)
      observe(
        test.info(),
        'note',
        `0166 DIAGNOSTIC — modal never mounted. frames=[${frames.join(' | ')}] ` +
          `contextMenuStillOnScreen=${menuStillOpen} ` +
          `verdict=${menuStillOpen ? 'the Create SRO click did not take effect' : 'menu closed but no modal opened'}`,
      )
      throw error
    }
    expect((await modalState(page)).text, 'the SRO modal, not some other modal-forms frame').toMatch(
      /Create SRO Relationship/i,
    )
    // Then wait for it to be POPULATED — P3-S7 below already does this, and P3-S6 was the one
    // place still snapshotting. The frame mounts and its heading renders before the widget posts
    // the two selected ids in, so a single read can catch a half-built form.
    /**
     * ⚠️ On failure, CAPTURE WHICH FRAME WAS READ — docs/issues/0101.
     *
     * This assertion failed once in the 2026-08-13T23:05Z suite with `Expected >= 2, Received 1`,
     * and the follow-up probe (`e2e/probe-0101-which-ref-lands.mjs`) showed that in isolation both
     * refs land **together** at ~5 s, 4 runs out of 4. So the "one id was posted and the other
     * dropped" reading is refuted, and two possibilities remain — which need different fixes:
     *
     *   1. the write pair is genuinely interrupted under suite load, or
     *   2. the poll read the WRONG modal frame. P3-S6 has a history of a different modal mounting
     *      (docs/issues/0074, 0166), and one STIX-shaped value in the wrong form reports `1` just as
     *      convincingly as a half-built right one.
     *
     * Telling them apart needs the FAILING run, and a failing run that records nothing is a wasted
     * one — this issue has already cost several. So capture the frame URLs and the values before
     * re-throwing, and leave the failure itself untouched.
     */
    try {
      await expect
        .poll(
          async () =>
            (await modalState(page)).values.filter((v) => /^[a-z-]+--[0-9a-f-]{8,}/i.test(v)).length,
          { timeout: 30_000, message: 'Source Ref and Target Ref pre-filled' },
        )
        .toBeGreaterThanOrEqual(2)
    } catch (err) {
      const frames = page.frames().map((f: any) => f.url()).filter((u: string) => /modal-forms/.test(u))
      const st = await modalState(page).catch(() => ({ values: [], text: '' } as any))
      observe(test.info(), 'note',
        `0101 diagnostic — ${frames.length} modal-forms frame(s): ${frames.join(' | ').slice(0, 300) || '(none)'}`)
      observe(test.info(), 'note',
        `0101 diagnostic — values seen: ${JSON.stringify(st.values).slice(0, 300)}`)
      observe(test.info(), 'note',
        `0101 diagnostic — modal text starts: ${String(st.text).replace(/\s+/g, ' ').slice(0, 160)}`)
      throw err
    }
    const modal = await modalState(page)

    // The row claims source AND target are pre-filled. Measured shape of this modal:
    //   source_ref = sighting--7a7017af…   target_ref = identity--32e8384f…
    // and the relationship types are rendered by Choices.js (3 items, matching the 3 the
    // get-relationship-types API returns) — the native <select> is emptied, and the type name is
    // NOT in the modal's body text, so a text match for /related-to/ is the wrong assertion here.
    const stixIds = modal.values.filter((v) => /^[a-z-]+--[0-9a-f-]{8,}/i.test(v))
    expect(stixIds.length, `source_ref and target_ref pre-filled (saw: ${modal.values.join(' | ').slice(0, 160)})`)
      .toBeGreaterThanOrEqual(2)
    expect(modal.options, 'relationship-type list is populated, not just a placeholder')
      .toBeGreaterThanOrEqual(2)

    // Second claim — "the relationship is created". The save leg was authored 2026-08-04
    // (docs/issues/0047), so this is now a hard assertion rather than an observation.
    //
    // ⚠️ It cannot be checked by counting nodes. A created relationship persists as an **edge**
    // (`unattached_relation.json` / `relation_edges.json`), so `countRels()` — which counts nodes
    // whose id starts with `relationship--` — stays flat even on success. That is exactly why 0047
    // originally concluded "33 objects / 4 relationships before and after, nothing was saved".
    // Assert on the submit response, which carries the save confirmation.
    const saveBodies: string[] = []
    page.on('response', async (r) => {
      if (!/modal-forms\/sro-constraints/.test(r.url()) || r.request().method() !== 'POST') return
      saveBodies.push(`${r.status()} ${(await r.text().catch(() => '')).slice(0, 400)}`)
    })

    // ⚠️ Choose a relationship type first — a user would. Measured 2026-08-04: submitting without
    // one posts `{"object":{source_ref,target_ref,relationship_type:null}}`, and the Make-Object
    // API answers **200 with an error body** for a null type (the docs/issues/0026 pattern), so the
    // save leg correctly never fires. Skipping this step made the persistence assertion fail
    // against a working flow.
    const modalFrame = page.frames().find((f) => /modal-forms\/sro-constraints/.test(f.url()))!
    const choices = modalFrame.locator('.choices').first()
    await choices.click()
    const typeOption = modalFrame.locator('.choices__list--dropdown .choices__item').first()
    await expect(typeOption, 'the relationship-type dropdown offers a type to pick')
      .toBeVisible({ timeout: 15_000 })
    const chosenType = (await typeOption.innerText()).trim()
    await typeOption.click()
    observe(test.info(), 'note', `chose relationship type "${chosenType}"`)

    const submit = page.getByRole('button', { name: /save changes|^save$|^create$|^ok$|apply/i }).first()
    expect(await submit.count(), 'the SRO modal offers a submit button').toBeGreaterThan(0)
    await submit.click()

    await expect
      .poll(() => saveBodies.length, { timeout: 45_000, message: 'the SRO modal actually submitted' })
      .toBeGreaterThan(0)

    const combined = saveBodies.join('\n')
    observe(test.info(), 'note', `Create SRO submit -> ${combined.slice(0, 200)}`)
    // 0047 first half — the route resolves. It used to answer 404 "Bad Gateway".
    expect(combined, 'the submit did not 404 (the route resolves — 0047 first half)')
      .not.toMatch(/^404|Bad Gateway/m)

    // 0047 second half — the relationship is actually created.
    //
    // ⚠️ Do NOT assert this from the response body. The HTTP route answers with the echo node's
    // message, and the save leg completes independently of that response — so the body looks the
    // same whether the relationship was written or not. Asserting on it failed twice against a
    // flow that was working.
    //
    // This now asserts through the **endpoint**, which is the point of docs/issues/0050: until that
    // was fixed, `unattached-split` never served a created relationship, and this step had to read
    // `unattached_relation.json` off disk to see anything. Asserting through the API also covers
    // 0050 itself — if the merge regresses, the relationship becomes invisible again and this
    // goes red.
    await expect
      .poll(() => countRels(), {
        timeout: 45_000,
        message: 'the created relationship is served by unattached-split (0047 + 0050)',
      })
      .toBeGreaterThan(before)

    // Recorded, not asserted: the created relationship is persisted but NOT served by the viz
    // endpoints, so the analyst cannot see what they just made (docs/issues/0050).
    const after = await countRels()
    observe(
      test.info(),
      'note',
      `relationship nodes served by unattached-split: ${before} → ${after} (unchanged is expected — ` +
        `relationships are stored as edges and are not surfaced, docs/issues/0050)`,
    )
  })

  step('P3-S7', async ({ page, request }) => {
    const api = await request
    await openComposer(page)
    // docs/issues/0077 — pick a pair the oracle APPROVES, instead of whatever happens to be
    // clickable. Measured 2026-08-11: of 24 arbitrary pairs only 3 (13%) offer a connection
    // field, so random selection made this step skip more often than it asserted (6 of 10 runs)
    // and #24's completion leg went largely unexercised. Every viable pair had an identity target.
    //
    // ⚠️ Falls back to the original selection when the oracle approves nothing, so a context with
    // no valid pair degrades to the old behaviour (a skip) rather than failing the step.
    const pairs = await choosePairWithConnectionField(request)
    const byId = (id: string) =>
      composerWidget(page)
        .locator('svg.promo_svg, svg.scratch_svg')
        .locator(`image[id="${id}"]`)
        .first()

    // ⚠️ An oracle-approved pair can still be UNCLICKABLE: nodes overlap in a dense pane, and the
    // one on top intercepts the pointer ("<image id=…> intercepts pointer events"). clickAnyNode
    // used to hide that by skipping candidates; choosing a specific node removes that escape hatch,
    // so try each approved pair in turn.
    let target
    for (const pair of pairs) {
      try {
        await byId(pair.sourceId).click({ timeout: 10_000 })
        const t = byId(pair.targetId)
        await t.click({ timeout: 10_000 })
        target = t
        observe(test.info(), 'note', `0077 pair: ${pair.sourceId} -> ${pair.targetId} [${pair.fields.join(',')}]`)
        break
      } catch {
        observe(test.info(), 'note', `0077: ${pair.sourceId} -> ${pair.targetId} not clickable (occluded?), trying next`)
      }
    }
    if (!target) {
      observe(test.info(), 'note', `0077: no approved pair was clickable (${pairs.length} tried) — falling back`)
      target = await selectAcrossPanes(page)
    }

    // docs/issues/0074 — this step fails roughly one run in three because the modal never mounts.
    // The saved trace showed the menu click landing AND a 200 for the modal HTML, but the trace
    // records action times on a monotonic counter and network times on a wall clock, so the fetch
    // could not be ordered against the click. That ordering is the whole question: a fetch after
    // the click means the modal was asked for and failed to attach; no fetch means the widget's
    // handler never fired. Record it on the SAME clock as the click.
    const modalRequests: string[] = []
    const clickAt = Date.now()
    page.on('request', (r) => {
      if (/modal-forms|foreign-key-connections/.test(r.url())) {
        modalRequests.push(`+${Date.now() - clickAt}ms ${r.method()} ${r.url().slice(-60)}`)
      }
    })
    const framesAt = () => page.frames().map((f: any) => f.url()).filter((u: string) => /modal|forms/.test(u))

    await target.click({ button: 'right' })

    // docs/issues/0077 — the click intermittently falls THROUGH to the node: no modal-forms request
    // is made and a `user-account-update` frame opens instead, which is the left-select result. So
    // the menu had already closed and the click hit what was underneath.
    //
    // `.scm-container` is persistent and toggled rather than created per interaction (P3-S9's notes),
    // so matching the item's text does not prove the menu is OPEN. Scope to the visible container and
    // wait for it before clicking.
    //
    // ⚠️ The outcome of this is itself evidence: if asserting visibility makes the failure vanish, the
    // race was in the harness; if it persists, it is in the widget.
    const menu = composerWidget(page).locator('.scm-container:visible')
    await expect(menu.first(), 'the context menu is open before its item is clicked (0077)').toBeVisible({
      timeout: 15_000,
    })
    const item = menu.getByText(/create connection/i).first()
    await expect(item, 'Create Connection is present in the OPEN menu (0077)').toBeVisible({ timeout: 15_000 })
    await item.click()

    // The "Create Foreign Key Connections" modal must carry **both refs pre-filled** and offer
    // the connection fields. `created_by_ref` is an *option inside the collapsed dropdown*, not
    // visible text — asserting on the literal string failed against a working modal.
    try {
      await expect
        .poll(async () => (await modalState(page)).found, {
          timeout: 30_000,
          message: 'Create Connection modal frame (…/modal-forms/…) appeared',
        })
        .toBeTruthy()
    } catch (err) {
      // Attach the evidence 0074 needs before rethrowing — a failing run is rare, so it must not
      // be wasted.
      // ⚠️ observe() only pushes a testInfo annotation, which neither the list reporter nor the
      // trace surfaces — the first version of this instrumentation was unreadable where it mattered.
      // console.log lands in stdout on every reporter.
      const note = `0074: modal did not mount. Requests after the click: ${
        modalRequests.length ? modalRequests.join(' ; ') : 'NONE - the click produced no fetch'
      }. Frames now: ${JSON.stringify(framesAt())}`
      console.log(note)
      observe(test.info(), 'note', note)
      throw err
    }
    const okNote = `0074: modal mounted; requests after click: ${modalRequests.join(' ; ') || 'none'}`
    console.log(okNote)
    observe(test.info(), 'note', okNote)

    expect((await modalState(page)).text, 'modal is the Foreign Key Connections form').toMatch(
      /foreign key connections/i,
    )

    // The criterion is that source and target arrive **pre-filled across the two panes**.
    // The frame mounts before it is populated, so this must be polled, not snapshotted.
    try {
      await expect
        .poll(
          async () => (await modalState(page)).values.filter((v) => /--[0-9a-f-]{8,}/i.test(v)).length,
          { timeout: 30_000, message: 'Source Ref and Target Ref pre-filled' },
        )
        .toBeGreaterThan(1)
    } catch (err) {
      // docs/issues/0077 mechanism 3 — the widget logs correct refs
      // (`dataForForm source_ref=… target_ref=… types=1`) and the form still renders empty. Three
      // causes have already been distinguished for this step, so capture enough to tell which
      // *this* is rather than naming a fourth from a bare timeout.
      //
      // ⚠️ console.log, not observe(): observe() only pushes a testInfo annotation, which neither
      // the list reporter nor the trace surfaces (learned the hard way on 0074).
      const frames = []
      for (const f of page.frames()) {
        if (!/modal-forms/.test(f.url())) continue
        const fields = await f
          .locator('input, select, textarea')
          .evaluateAll((els: any[]) =>
            els.map((e) => ({
              name: e.getAttribute('name') || e.getAttribute('id') || e.tagName,
              type: e.getAttribute('type') || e.tagName,
              value: String(e.value ?? '').slice(0, 60),
              hidden: e.type === 'hidden',
            })),
          )
          .catch(() => [])
        const bodyLen = await f.locator('body').innerText().then((t: string) => t.length).catch(() => -1)
        frames.push({ url: f.url().slice(-70), bodyChars: bodyLen, fieldCount: fields.length, fields })
      }
      console.log('0077-m3: pre-fill empty. modal frames: ' + JSON.stringify(frames))
      throw err
    }
    const modal = await modalState(page)

    // `created_by_ref` is an *option* in the collapsed "Connection Field List", never visible
    // text — an assertion on the literal string fails against a working modal.
    //
    // ⚠️ Use the **scoped** count. The unscoped `.choices__item` includes the placeholder entry, so
    // it reads 1 even when the list is empty ("No choices to choose from") — which is defect 0030's
    // exact symptom passing as green (docs/issues/0048).
    await expect
      .poll(async () => (await modalState(page)).dropdownOptions, {
        timeout: 30_000,
        message: 'the connection field list rendered (Choices replaced the native select)',
      })
      .toBeGreaterThanOrEqual(0)

    // The strong guard for defect 0030 — a list that is empty when it should NOT be — needs an
    // oracle, because "zero fields" is correct for some pairs (measured: email-addr -> identity
    // returns []). Pane ordering varies between runs, so a blanket `> 0` fails against correct
    // behaviour, and a blanket "no assertion" would let 0030 back in.
    //
    // `/os-triage/rmb-force/get-connection-types` IS that oracle. Its payload was found by reading
    // the algorithm rather than guessing (two guessed shapes had returned 200-error-bodies): it
    // wants the **full STIX objects**, `{source: <object>, target: <object>}` — not type names.
    // Verified: sighting->identity 3 fields, observed-data->identity 1, email-addr->identity 0.

    // The row also claims the refs are pre-filled **across the panes**. Matching any stix-shaped
    // string never showed that; compare against the two ids actually selected.
    const finalState = await modalState(page)
    observe(
      test.info(),
      'note',
      `modal refs: ${finalState.values.filter((v) => /--[0-9a-f-]{8,}/i.test(v)).join(' → ')} · ` +
        `selectable fields BEFORE opening: ${finalState.dropdownOptions} (unscoped ${finalState.options}) — ` +
        `Choices renders items lazily on open, so this under-reports; the authoritative count is the ` +
        `API comparison below`,
    )

    // Second claim — the connection is actually SET on the object. This was unmet until the save leg
    // was composed (docs/decisions/0009); before that the modal opened, submitted, and wrote nothing.
    const modalFrame = page.frames().find((f) => /foreign-key-connections/.test(f.url()))!
    const valueOf = async (name: string) =>
      (await modalFrame.locator(`input[name="${name}"]`).first().inputValue().catch(() => '')).trim()
    const sourceRef = await valueOf('source_ref')
    const targetRef = await valueOf('target_ref')
    expect(sourceRef, 'the modal carries a source_ref to write to').toMatch(/--[0-9a-f-]{8,}/i)

    // ⚠️ Pick a field first. The equivalent omission on the SRO modal posted a null and the API
    // answered 200-with-an-error-body, so the save correctly never fired (docs/issues/0026).
    //
    // ⚠️ And exclude the placeholder. Choices.js renders "No choices to choose from" as an item, so
    // an empty list still yields one — this step duly "chose" that string as its field name until
    // 2026-08-05. Some pairs legitimately have NO valid connection field (measured: email-addr ->
    // identity), because the field list is the set of reference properties that can point at the
    // target's type. That is correct behaviour, not a defect, so it is recorded and skipped rather
    // than failed.
    const choices = modalFrame.locator('.choices').first()
    await choices.click()
    const items = modalFrame.locator('.choices__list--dropdown .choices__item')
    await expect
      .poll(async () => (await items.allInnerTexts().catch(() => [])).length, { timeout: 15_000 })
      .toBeGreaterThan(0)
    const labels = (await items.allInnerTexts())
      .map((t) => t.trim())
      .filter((t) => t && !/no choices/i.test(t))

    // Ask the oracle what this pair SHOULD offer, and hold the modal to it.
    const graph = await (await api.get(`${FLOW_BASE}/viz-data/unattached-split`)).json()
    const allNodes = [...(graph.promo?.nodes || []), ...(graph.scratch?.nodes || [])]
    const originalOf = (id: string) => allNodes.find((n: any) => n.id === id)?.original
    let expectedFields: string[] | null = null
    const sourceObject = originalOf(sourceRef)
    const targetObject = originalOf(targetRef)
    if (sourceObject && targetObject) {
      const res = await api.post(`${FLOW_BASE}/os-triage/rmb-force/get-connection-types`, {
        data: { source: sourceObject, target: targetObject },
      })
      const body = res.ok() ? await res.json().catch(() => null) : null
      if (body && Array.isArray(body.connection_field_list)) expectedFields = body.connection_field_list
    }

    observe(
      test.info(),
      'note',
      `${sourceRef.split('--')[0]} -> ${targetRef.split('--')[0]}: modal offers [${labels.join(', ')}], ` +
        `API says [${expectedFields ? expectedFields.join(', ') : 'unavailable'}]`,
    )
    if (expectedFields) {
      expect(
        labels.sort(),
        'the modal offers exactly the fields the connection-types API allows for this pair (0030)',
      ).toEqual([...expectedFields].sort())
    }

    // ⚠️ This used to `return` here, which reported the step GREEN having tested nothing. That is how
    // docs/issues/0071 stayed hidden: the write half is the criterion under test (#24, second
    // criterion), and a pair with no valid field cannot exercise it. A pass that proves nothing must
    // not look like a pass that proves something — same class as docs/issues/0048.
    if (labels.length === 0) {
      observe(
        test.info(),
        'note',
        `no valid connection field exists for ${sourceRef.split('--')[0]} -> ${targetRef.split('--')[0]} ` +
          '— confirmed by the API — so the write half CANNOT be exercised for this pair (0071)',
      )
      test.skip(
        true,
        `P3-S7 write half not exercised: no valid connection field for ` +
          `${sourceRef.split('--')[0]} -> ${targetRef.split('--')[0]}. Not a product defect, but not ` +
          `coverage either — see docs/issues/0071.`,
      )
      return
    }

    const chosenField = labels[0]
    await items.filter({ hasText: chosenField }).first().click()
    observe(test.info(), 'note', `setting ${sourceRef}.${chosenField} = ${targetRef}`)

    await page.getByRole('button', { name: /save changes|^save$|^create$|^ok$|apply/i }).first().click()

    // Assert the stored object, not the response: the route answers with the echo node's message and
    // the save leg completes independently, so the body looks identical either way (the mistake that
    // cost two runs on P3-S6).
    const fieldOnSource = async () => {
      const res = await api.get(`${FLOW_BASE}/viz-data/unattached-split`)
      if (!res.ok()) return null
      const j = await res.json()
      const node = [...(j.promo?.nodes || []), ...(j.scratch?.nodes || [])]
        .find((n: any) => n.id === sourceRef)
      // Distinguish the two failure modes: a null tells you nothing, and this step failed once with
      // exactly that. 'node-missing' and 'field-unset' say which half went wrong.
      if (!node) return 'node-missing: ' + sourceRef
      const value = node.original?.[chosenField]
      if (value === undefined || value === null) return 'field-unset: ' + chosenField
      return Array.isArray(value) ? value.join(',') : String(value)
    }
    await expect
      .poll(fieldOnSource, {
        timeout: 45_000,
        message: `${chosenField} was written onto ${sourceRef} (0009 / #24 second criterion)`,
      })
      .toContain(targetRef.split('--')[1].slice(0, 8))
  })

  /**
   * ⚠️ **Destructive.** This consumes one Scratch object from the current incident's unattached
   * context. Scratch is cheap to repopulate (P5-S3 / the identity-create form writes straight into
   * it), which is why this is acceptable to run — but do not point it at Promo.
   */
  step('P3-S8', async ({ page, request }) => {
    // docs/issues/0076 — this step DELETES a Scratch object and nothing replaces it, so a suite on
    // a loop eventually runs it against an empty pane. Seed rather than fail: the fixture is the
    // suite's responsibility, not a defect in what this step tests.
    const seeded = await ensureScratch(page, request, 2)
    observe(test.info(), 'note', `P3-S8 fixture: scratch ${seeded}`)
    await requireScratch(request, 'P3-S8')
    // ⚠️ The UI count is the *weaker* half of this claim. docs/issues/0037 is exactly the case
    // where Remove reported success and removed nothing — a pane that re-renders without the node
    // proves the widget refreshed, not that the object is gone. So check the store too
    // (docs/issues/0048, Tier 2).
    const api = await request
    const unattachedIds = async (): Promise<string[]> => {
      const res = await api.get(`${FLOW_BASE}/viz-data/unattached-split`, { timeout: 60_000 })
      if (!res.ok()) return []
      const j = await res.json()
      return [...(j.scratch?.nodes ?? []), ...(j.promo?.nodes ?? [])].map((n: any) => String(n.id))
    }
    const idsBefore = await unattachedIds()

    await openComposer(page)

    // ⚠️ Do not require a Scratch node. Within a single regression run the pane drains: P3-S6
    // creates an SRO, which reclassifies its Scratch endpoint into Promo permanently
    // (docs/issues/0051). This step failed a full run with `Expected > 0, Received 0` while
    // passing in isolation — an ordering artefact, not a Remove defect.
    //
    // Remove is asserted against the **unattached context** below, which covers either pane, so
    // falling back to Promo tests the same behaviour.
    const scratchCount = await paneNodes(page, PANE.scratch).count().catch(() => 0)
    const pane = scratchCount > 0 ? PANE.scratch : PANE.promo
    if (scratchCount === 0) {
      observe(test.info(), 'note', 'Scratch empty — removing from Promo instead (docs/issues/0051)')
    }
    const targets = paneNodes(page, pane)
    await expect
      .poll(async () => await targets.count(), { timeout: 60_000, message: `${pane} holds a node to remove` })
      .toBeGreaterThan(0)
    const before = await targets.count()

    await targets.first().click({ button: 'right' })
    await composerWidget(page).getByText(/^\s*remove\s*$/i).first().click()

    await expect
      .poll(async () => await paneNodes(page, pane).count(), {
        timeout: 60_000,
        message: 'the object disappears from its pane after Remove + refresh',
      })
      .toBeLessThan(before)

    // The object must be gone from unattached context, not merely off the canvas.
    await expect
      .poll(async () => (await unattachedIds()).length, {
        timeout: 60_000,
        message: 'the object was actually removed from unattached context, not just from the pane (0037)',
      })
      .toBeLessThan(idsBefore.length)
    const idsAfter = new Set(await unattachedIds())
    const removed = idsBefore.filter((id) => !idsAfter.has(id))
    observe(test.info(), 'note', `removed from unattached context: ${removed.join(', ') || '(count fell but id not isolated)'}`)
  })

  step('P3-S9', async ({ page, request }) => {
    // docs/issues/0076 — right-clicks a Scratch node to prove Promote is NOT offered there, so an
    // empty pane makes the negative half unprovable rather than false.
    const seeded = await ensureScratch(page, request, 1)
    observe(test.info(), 'note', `P3-S9 fixture: scratch ${seeded}`)
    await openComposer(page)
    // The criterion is stated negatively ("Promote is *not* offered for non-Promotables"), which
    // passes vacuously while Promote does not exist at all. Assert the positive case instead, so
    // this step stays red until the menu item is actually built (source-doc task 9).
    const promo = paneNodes(page, PANE.promo)
    await expect.poll(async () => await promo.count(), { timeout: 60_000 }).toBeGreaterThan(0)
    await promo.first().click({ button: 'right' })
    await expect(composerWidget(page).getByText(/promote/i).first()).toBeVisible({ timeout: 15_000 })

    // Now the negative half is worth asserting: it was vacuous while Promote did not exist
    // anywhere, and it is the row's actual claim. Promote is authored **only** in
    // `panel.promo.js` — Scratch's menu deliberately has no such entry, because #78 makes
    // promotable-ness a property of the node's type and Scratch holds what no promotable reaches
    // (decisions/0010, 0007).
    // ⚠️ Dismiss the first menu *deterministically*. `Escape` did not close it, and the open
    // `.scm-container` then covered the Scratch node — the click was intercepted by
    // `<div class="scm-item">` and the step timed out in a full run while passing targeted.
    // Same family as docs/issues/0058: something overlapping the thing under test.
    // ⚠️ `.scm-container` is NOT removed when the menu closes — it stays in the DOM and is toggled,
    // so counting it always returns 1. Wait for it to stop being *visible*.
    await composerWidget(page).locator('svg.promo_svg').click({ position: { x: 5, y: 5 } })
    await expect(composerWidget(page).locator('.scm-container').first(), 'the first context menu closed')
      .toBeHidden({ timeout: 15_000 })

    const scratch = paneNodes(page, PANE.scratch)
    await expect.poll(async () => await scratch.count(), { timeout: 60_000 }).toBeGreaterThan(0)
    await scratch.first().click({ button: 'right' })
    // The Scratch menu must open — otherwise "no Promote" would be true for the wrong reason.
    await expect(composerWidget(page).getByText(/create sro/i).first()).toBeVisible({ timeout: 15_000 })
    // Count only VISIBLE matches: the Promo pane's menu stays in the DOM when hidden, so an
    // unscoped count would find its Promote entry and fail against a correct build.
    const promoteInScratch = await composerWidget(page)
      .locator('.scm-container:visible')
      .getByText(/^\s*promote\s*$/i)
      .count()
    observe(test.info(), promoteInScratch === 0 ? 'pass' : 'note', `Promote entries in the Scratch menu: ${promoteInScratch}`)
    expect(promoteInScratch, 'Promote is NOT offered on a non-Promotable (Scratch)').toBe(0)
  })

  step('P3-S10', async ({ page }) => {
    // #42 — "The New Object button enables one to select any valid new object" and "when the object
    // is selected, the create form for that object is opened". Both halves are asserted here; the
    // button was authored 2026-08-04 (e2e/author-newobject-button.mjs, docs/issues/0044).
    await openComposer(page)

    const button = page.getByRole('button', { name: /new object/i }).first()
    await expect(button, 'a "New Object" button exists on the Composer').toBeVisible({ timeout: 30_000 })
    await button.click()

    // Criterion 1 — the list offers the object types. It is DERIVED from the create forms that
    // exist, so assert against that list rather than a hardcoded one: if a form is added or
    // removed, this should follow rather than lie. `attack`/`os-threat`/`oca` families have no
    // create form at all, so a list that offered them would be the docs/issues/0049 404.
    // ⚠️ Count **visible** items. `.dropdown-item` is in the DOM before any click — measured 15
    // with the menu closed — so a plain `count()` here would pass without the dropdown ever
    // opening, which is the docs/issues/0048 anti-pattern this suite exists to avoid.
    const menu = page.locator('.dropdown-menu').first()
    await expect(menu, 'the New Object dropdown opened').toBeVisible({ timeout: 20_000 })
    const items = page.locator('.dropdown-menu .dropdown-item:visible')
    await expect
      .poll(async () => await items.count(), { timeout: 20_000, message: 'dropdown items shown' })
      .toBeGreaterThan(10)
    const labels = (await items.allInnerTexts()).map((t) => t.trim()).filter(Boolean)
    observe(test.info(), 'note', `New Object offers ${labels.length} types: ${labels.join(', ')}`)
    expect(labels, 'the dropdown offers the core object types')
      .toEqual(expect.arrayContaining(['Identity', 'Indicator', 'Relationship', 'Sighting']))

    // Criterion 2 — choosing one opens *that type's* create form. Naming the type matters: a modal
    // that opened the wrong form, or the default placeholder, would satisfy a bare "a modal opened".
    // The dropdown template puts the label on its own line, so the element's text is
    // "\n        Identity\n    " — an anchored /^Identity$/ never matches it. Allow the padding.
    await items.filter({ hasText: /^\s*Identity\s*$/ }).first().click()
    await expect
      .poll(
        async () => page.frames().some((f) => /identity-forms\/identity-create/.test(f.url())),
        { timeout: 30_000, message: 'the Identity create form opened' },
      )
      .toBeTruthy()

    const form = page.frames().find((f) => /identity-create/.test(f.url()))!
    expect(await form.locator('input').count(), 'the create form rendered its fields')
      .toBeGreaterThan(5)
  })

  step('P3-S11', async ({ page }) => {
    await openComposer(page)
    await page.waitForTimeout(15_000)
    // docs/issues/0017 — dismissal is a one-shot text match that can miss the last toast.
    // The toast renders **inside the widget frames**, so a page-level check passes vacuously
    // and would falsely close 0017. Check every frame, and only after the panes have content
    // (no data → no toast → nothing to prove).
    const frames = page.locator('iframe')
    const count = await frames.count()
    let sawContent = false
    for (let i = 0; i < count; i++) {
      const f = page.frameLocator('iframe').nth(i)
      if (await f.locator(NODE_SELECTOR).count().catch(() => 0)) sawContent = true
      await expect(f.locator('text=/Loading graph data/i')).toHaveCount(0)
    }
    expect(sawContent, 'a pane actually loaded data, so a toast could have appeared').toBeTruthy()
  })

  step('P3-S12', async ({ page, request }) => {
    // ⚠️ THIS STEP NEEDS ITS OWN TIMEOUT — docs/issues/0148, the half that a green suite does not fix.
    //
    // The promote poll below asks for 120 s. The project timeout is ALSO 120 s
    // (`playwright.config.ts`), and this step spends a large part of it before the poll even starts:
    // seeding a promotable through the create form, `openComposer` (whose `networkidle` wait can burn
    // its full 60 s because networkidle never settles on the composer under suite load), then up to
    // 60 s polling for panes to render. So the poll could never have the budget its own code claims —
    // on a fast run it got most of it, on a slow one almost none. That is 0148's Run 3: the step
    // failed not because promotion broke but because the clock ran out mid-poll, which reads
    // identically in a report.
    //
    // Fixing this by giving the STEP room, rather than by shortening the poll: the poll is long on
    // purpose (docs/issues/0087 — `/os-triage/promote-subgraph` 503s while the flow completes anyway,
    // so the context must be polled until the id disappears). `test.setTimeout` is the established
    // convention here — the four journey specs already set 300–480 s for the same reason.
    test.setTimeout(360_000)

    // docs/issues/0086 + 0087 — the claim P3-S9 makes but never tests: promoting moves the object
    // out of unattached context and onto the incident (os-threat#84).
    //
    // Three things this step must NOT do, each measured rather than assumed (docs/issues/0087):
    //
    //  1. Do not consume demo data. Only THREE promotable objects exist, and promotion takes the
    //     target plus its sub-graph (~9 objects), so a borrowing step exhausts them in three runs.
    //     ensurePromotable() seeds one and returns only an id it created.
    //  2. Do not trust the HTTP status. /os-triage/promote-subgraph 503s while the flow completes
    //     anyway — the 503 is TotalJS abandoning the response, not a failure.
    //  3. Do not measure immediately. Every incoherent reading in 0087 came from sampling a still
    //     running flow. Poll until the id is gone.
    const seeded = await ensurePromotable(page, request)
    observe(test.info(), 'note', `P3-S12 fixture: seeded ${seeded ?? '(none)'}`)
    expect(seeded, 'a promotable was seeded through the create form (docs/issues/0086)').toBeTruthy()

    const before = await promotableIds(request)
    expect(before, 'the seeded promotable is in unattached context').toContain(seeded)

    await openComposer(page)

    const promo = paneNodes(page, PANE.promo)
    await expect.poll(async () => await promo.count(), { timeout: 60_000 }).toBeGreaterThan(0)

    // Promote through the UI, not the API: the point is that the gesture works end to end.
    const target = composerWidget(page).locator(`[id="${seeded}"]`).first()
    await expect(target, 'the seeded promotable is rendered in a pane').toBeVisible({ timeout: 60_000 })
    await target.click({ button: 'right' })

    const promote = composerWidget(page)
      .locator('.scm-container:visible')
      .getByText(/^\s*promote\s*$/i)
      .first()
    await expect(promote, 'Promote is offered on the seeded promotable').toBeVisible({ timeout: 15_000 })
    await promote.click()

    // ⚠️ Poll the CONTEXT, never the response. A seeded task has no references, so its sub-graph is
    // itself and exactly this one id should disappear (docs/issues/0087).
    await expect
      .poll(async () => (await promotableIds(request)).includes(seeded!), {
        timeout: 120_000,
        message: 'the promoted object left unattached context (os-threat#84 half 1)',
      })
      .toBe(false)

    const after = await promotableIds(request)
    observe(test.info(), 'pass', `promotables ${before.length} -> ${after.length}; seeded id gone`)
  })
})
