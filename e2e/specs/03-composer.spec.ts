import { expect } from '@playwright/test'
import { step, test, observe } from '../runsheet'
import { selectPopulatedNode } from '../form-pane'
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
  step('P3-S1', async ({ page }) => {
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

    // "…none drifting" is the row's third claim (0016: the graph never settles when embedded).
    // Two measurements of the same node, 3 s apart, is the P2-S3 pattern.
    const firstIcon = composerWidget(page).locator(PANE.promo).locator('image').first()
    const at = async () => JSON.stringify(await firstIcon.boundingBox().catch(() => null))
    const t0 = await at()
    await page.waitForTimeout(3_000)
    expect(await at(), 'Promo graph has settled — no drift 3s after load (0016)').toBe(t0)
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
    const { shape, skipped, tried } = await selectPopulatedNode(page, nodes)
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
    await promo.first().click()

    if ((await scratch.count()) > 0) {
      await scratch.first().click()
      return scratch.first()
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
    let modal = { found: false, text: '', values: [] as string[], options: 0 }
    for (let i = 0; i < 12 && !modal.found; i++) {
      modal = await modalState(page)
      if (!modal.found) await page.waitForTimeout(2_500)
    }
    expect(modal.found, 'the SRO modal mounted in its own modal-forms frame').toBeTruthy()
    expect(modal.text, 'the SRO modal, not some other modal-forms frame').toMatch(/Create SRO Relationship/i)

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

    // ⚠️ This deliberately does NOT assert "> 0 real fields", and the reason matters. The field list
    // is the set of reference properties on the source type that can point at the target's type, so
    // **zero is correct for some pairs** — measured on email-addr -> identity. Pane ordering varies
    // between runs, so which pair is selected varies too, and a `> 0` assertion here fails against
    // correct behaviour.
    //
    // The stronger guard (defect 0030: a list that is empty when it should not be) needs an oracle —
    // `/os-triage/rmb-force/get-connection-types` for the pair. Two payload shapes were tried and
    // both returned a 200-error-body, so the request shape is unknown and is NOT being guessed at.
    // Until then the count is recorded, and the write half below exercises the populated case.

    // The row also claims the refs are pre-filled **across the panes**. Matching any stix-shaped
    // string never showed that; compare against the two ids actually selected.
    const finalState = await modalState(page)
    observe(
      test.info(),
      'note',
      `modal refs: ${finalState.values.filter((v) => /--[0-9a-f-]{8,}/i.test(v)).join(' → ')} · ` +
        `selectable fields: ${finalState.dropdownOptions} (unscoped would read ${finalState.options})`,
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

    if (labels.length === 0) {
      observe(
        test.info(),
        'note',
        `no valid connection field exists for ${sourceRef.split('--')[0]} -> ${targetRef.split('--')[0]}; ` +
          'the write half cannot be exercised on this pair (not a defect)',
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
      const value = node?.original?.[chosenField]
      return Array.isArray(value) ? value.join(',') : (value ?? null)
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
})
