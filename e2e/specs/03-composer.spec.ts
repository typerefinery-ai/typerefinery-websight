import { expect } from '@playwright/test'
import { step, test } from '../runsheet'
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
    return { found: true, text, values, options }
  }
  return { found: false, text: '', values: [] as string[], options: 0 }
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
  step('P3-S1', async ({ page }) => {
    await openComposer(page)
    const frames = page.locator('iframe')
    await expect.poll(async () => await frames.count(), { timeout: 60_000 }).toBeGreaterThan(0)
    // Tree + Promo + Scratch should each hold rendered content.
    let panesWithContent = 0
    const count = await frames.count()
    for (let i = 0; i < count; i++) {
      const f = page.frameLocator('iframe').nth(i)
      const marks = await f.locator(NODE_SELECTOR).count().catch(() => 0)
      if (marks > 0) panesWithContent++
    }
    expect(panesWithContent, 'panes holding rendered content').toBeGreaterThan(0)
  })

  step('P3-S2', async ({ page }) => {
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
  })

  step('P3-S3', async ({ page }) => {
    await page.goto(WORKBENCH, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(8_000)
    const node = widget(page).locator(NODE_SELECTOR).first()
    await expect(node).toBeVisible({ timeout: 40_000 })
    await node.click({ button: 'right' })
    await expect(widget(page).getByText(/copy/i).first()).toBeVisible({ timeout: 20_000 })
    await expect(widget(page).getByText(/edit dag/i).first()).toBeVisible({ timeout: 20_000 })
  })

  step('P3-S4', async ({ page, request }) => {
    // The criterion is "copies to unattached context and refreshes", so assert the *effect* —
    // the object arriving in unattached context — rather than matching toast wording. Runs on
    // the Composer page, which carries the real tree and the real host wiring.
    const api = await request
    const before = await (await api.get(`${FLOW_BASE}/viz-data/unattached-split`)).json()
    const beforeCount = (before.scratch?.nodes || []).length + (before.promo?.nodes || []).length

    await openComposer(page)
    const treeNode = paneNodes(page, PANE.tree).first()
    await expect(treeNode).toBeVisible({ timeout: 60_000 })
    await treeNode.click({ button: 'right' })
    await composerWidget(page).getByText(/^\s*copy\s*$/i).first().click()

    // The copy algorithm used to fail for every STIX type (docs/issues/0033) — guard the message
    // so a regression is recognisable rather than just "count did not grow".
    await expect(composerWidget(page).locator('text=/No content found for STIX type/i')).toHaveCount(0)

    await expect
      .poll(
        async () => {
          const after = await (await api.get(`${FLOW_BASE}/viz-data/unattached-split`)).json()
          return (after.scratch?.nodes || []).length + (after.promo?.nodes || []).length
        },
        { timeout: 60_000, message: 'copied object appears in unattached context' },
      )
      .toBeGreaterThan(beforeCount)
  })

  step('P3-S5', async ({ page }) => {
    await openComposer(page)
    const nodes = paneNodes(page, PANE.promo)
    await expect
      .poll(async () => await nodes.count(), { timeout: 60_000, message: 'Promo pane nodes rendered' })
      .toBeGreaterThan(0)
    await nodes.first().click()
    await expect
      .poll(async () => await formPaneOpened(page), {
        timeout: 45_000,
        message: 'left-select navigated the form pane away from the default placeholder',
      })
      .toBeTruthy()
  })

  // S6/S7 run against the **Composer page**, not the workbench: the page's widget carries the
  // real Promo (23 nodes / 42 edges) and Scratch (5 nodes) data for the current incident, while
  // the workbench only preloads the tree fixture and leaves both panes empty.
  /** Select one object in Promo, then one in Scratch — selection *order* sets source/target. */
  async function selectAcrossPanes(page: any) {
    const promo = paneNodes(page, PANE.promo)
    const scratch = paneNodes(page, PANE.scratch)
    await expect.poll(async () => await promo.count(), { timeout: 60_000 }).toBeGreaterThan(0)
    await expect.poll(async () => await scratch.count(), { timeout: 60_000 }).toBeGreaterThan(0)
    await promo.first().click()
    await scratch.first().click()
    return scratch.first()
  }

  step('P3-S6', async ({ page }) => {
    await openComposer(page)
    const target = await selectAcrossPanes(page)
    await target.click({ button: 'right' })
    await composerWidget(page).getByText(/create sro/i).first().click()
    await expect(composerWidget(page).getByText(/related-to/i).first()).toBeVisible({ timeout: 30_000 })
  })

  step('P3-S7', async ({ page }) => {
    await openComposer(page)
    const target = await selectAcrossPanes(page)
    await target.click({ button: 'right' })
    await composerWidget(page).getByText(/create connection/i).first().click()

    // The "Create Foreign Key Connections" modal must carry **both refs pre-filled** and offer
    // the connection fields. `created_by_ref` is an *option inside the collapsed dropdown*, not
    // visible text — asserting on the literal string failed against a working modal.
    await expect
      .poll(async () => (await modalState(page)).found, {
        timeout: 30_000,
        message: 'Create Connection modal frame (…/modal-forms/…) appeared',
      })
      .toBeTruthy()

    expect((await modalState(page)).text, 'modal is the Foreign Key Connections form').toMatch(
      /foreign key connections/i,
    )

    // The criterion is that source and target arrive **pre-filled across the two panes**.
    // The frame mounts before it is populated, so this must be polled, not snapshotted.
    await expect
      .poll(
        async () => (await modalState(page)).values.filter((v) => /--[0-9a-f-]{8,}/i.test(v)).length,
        { timeout: 30_000, message: 'Source Ref and Target Ref pre-filled' },
      )
      .toBeGreaterThan(1)
    const modal = await modalState(page)

    // `created_by_ref` is an *option* in the collapsed "Connection Field List", never visible
    // text — an assertion on the literal string fails against a working modal.
    await expect
      .poll(async () => (await modalState(page)).options, {
        timeout: 30_000,
        message: 'connection field list offers fields to choose',
      })
      .toBeGreaterThan(0)
  })

  /**
   * ⚠️ **Destructive.** This consumes one Scratch object from the current incident's unattached
   * context. Scratch is cheap to repopulate (P5-S3 / the identity-create form writes straight into
   * it), which is why this is acceptable to run — but do not point it at Promo.
   */
  step('P3-S8', async ({ page }) => {
    await openComposer(page)
    const scratch = paneNodes(page, PANE.scratch)
    await expect.poll(async () => await scratch.count(), { timeout: 60_000 }).toBeGreaterThan(0)
    const before = await scratch.count()

    await scratch.first().click({ button: 'right' })
    await composerWidget(page).getByText(/^\s*remove\s*$/i).first().click()

    await expect
      .poll(async () => await paneNodes(page, PANE.scratch).count(), {
        timeout: 60_000,
        message: 'Scratch object disappears after Remove + refresh',
      })
      .toBeLessThan(before)
  })

  step('P3-S9', async ({ page }) => {
    await openComposer(page)
    // The criterion is stated negatively ("Promote is *not* offered for non-Promotables"), which
    // passes vacuously while Promote does not exist at all. Assert the positive case instead, so
    // this step stays red until the menu item is actually built (source-doc task 9).
    const promo = paneNodes(page, PANE.promo)
    await expect.poll(async () => await promo.count(), { timeout: 60_000 }).toBeGreaterThan(0)
    await promo.first().click({ button: 'right' })
    await expect(composerWidget(page).getByText(/promote/i).first()).toBeVisible({ timeout: 15_000 })
  })

  step('P3-S10', async ({ page }) => {
    await openComposer(page)
    // Looked for in the page *and* the widget frame — measured 2026-08-04: the page has no
    // buttons at all and the widget offers only "Reload".
    const pageBtn = page.getByRole('button', { name: /new object|new form|create object/i })
    const widgetBtn = composerWidget(page).getByRole('button', { name: /new object|new form|create object/i })
    const found = (await pageBtn.count()) + (await widgetBtn.count())
    expect(found, 'a "New Object" button exists on the Composer').toBeGreaterThan(0)
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
})
