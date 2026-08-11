import { expect, test } from '@playwright/test'
import { selectPopulatedNode } from '../form-pane'
import { ensurePromotable, ensureScratch } from '../fixtures'
import { SHOWCASE } from '../playwright.config'

/**
 * Act 3 as ONE continuous journey, for a single video.
 *
 * Companion to act1/act2/act5-journey.demo.ts — see act1 for why a whole act has to be one test.
 *
 * ⚠️ Act 3 is the act with the most landmines, and this file deliberately films only the beats
 * that are both visual and dependable. Excluded on purpose:
 *
 *   • **P3-S6 / P3-S7 (Create SRO / Create Connection modals)** — the modal mounts in a fourth
 *     frame, and whether a valid connection field even exists depends on the *pair* of objects
 *     picked (`choosePairWithConnectionField` exists solely to find one). A recording that lands
 *     on a pair with no valid field films an empty dropdown reading "No choices to choose from",
 *     which looks like a defect and is not one. That belongs in the regression run, not the demo.
 *   • **The promote-to-incident API (#84)** — its 503 is a *response* timeout while the flow
 *     completes asynchronously (measured repeatedly; counts must be polled until they stop
 *     changing). Filming it would show an error toast for a working operation.
 *
 * Everything below reuses the regression spec's proven helpers and selectors rather than
 * re-deriving them. Acts 1 and 2 each cost three or four failed recordings to learn that.
 *
 * Run with:  ./node_modules/.bin/playwright test --project=demo --grep "Act 3"
 */

const COMPOSER = `${SHOWCASE}/forms/composer-local.html`

/** Copied verbatim from specs/03-composer.spec.ts — these are module-local there. */
const composerWidget = (page: any) =>
  page.frameLocator('iframe[src*="widgetdevcomposer"], iframe[src*="4005"]').first()

/**
 * The three panes carry stable ids. This matters: the first node in DOM order belongs to the
 * **tree**, and clicking a tree node only shows its JSON tooltip — it does not open a form.
 */
const PANE = { tree: 'svg.tree_svg', promo: 'svg.promo_svg', scratch: 'svg.scratch_svg' }
const paneNodes = (page: any, pane: string) =>
  composerWidget(page).locator(pane).locator('image, g.node, circle')

/**
 * ⚠️ Right-click targets are NOT the same elements as `paneNodes`. A pane alternates a `g.node`
 * row group and the `image` icon inside it, and the **context-menu handler lives on the image**.
 * Right-clicking the row group produces no menu at all.
 */
const paneNodeIcons = (page: any, pane: string) => composerWidget(page).locator(pane).locator('image')

const beat = (page: any, ms = 2_500) => page.waitForTimeout(ms)

async function scene(page: any, title: string) {
  // eslint-disable-next-line no-console
  console.log(`  ▸ ${title}`)
  await test.step(title, async () => {
    await beat(page, 800)
  })
}

async function openComposer(page: any) {
  await page.goto(COMPOSER, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  await beat(page, 12_000)
}

/** Close an open context menu deterministically — Escape does not do it (P3-S9's notes). */
async function dismissMenu(page: any) {
  await composerWidget(page).locator('svg.promo_svg').click({ position: { x: 5, y: 5 } }).catch(() => {})
  await composerWidget(page)
    .locator('.scm-container')
    .first()
    .waitFor({ state: 'hidden', timeout: 15_000 })
    .catch(() => {})
}

test('Act 3 — Incident Composer: three panes, selection, context menus, and New Object', async ({
  page,
  request,
}) => {
  test.setTimeout(480_000)

  // ---- Seed ---------------------------------------------------------------
  //
  // Act 3 drains Scratch as it runs (docs/issues/0076: P3-S6 moves a node out of Scratch on every
  // run), so a recording made after enough runs would open onto an empty pane and film nothing.
  // Seed before the camera matters.
  const seededScratch = await ensureScratch(page, request, 2).catch(() => 0)
  const seededPromo = await ensurePromotable(page, request).catch(() => null)
  console.log(`     seed: scratch=${seededScratch}, promotable=${seededPromo ?? 'existing'}`)

  // ---- Scene 1 — the workbench (P3-S1) ------------------------------------
  await scene(page, 'Open the Incident Composer')
  await openComposer(page)

  const counts: Record<string, number> = {}
  for (const [name, sel] of Object.entries(PANE)) {
    await expect
      .poll(async () => await paneNodes(page, sel).count(), {
        timeout: 60_000,
        message: `${name} pane rendered`,
      })
      .toBeGreaterThan(0)
    counts[name] = await paneNodes(page, sel).count()
  }
  console.log(
    `     Evidence List ${counts.tree} · Promotable ${counts.promo} · Scratch ${counts.scratch}`,
  )
  await beat(page, 5_000)

  // ---- Scene 2 — left-select opens a populated form (P3-S5) ---------------
  //
  // ⚠️ Do not just click the first promo node, and do not gate readiness on "some field is
  // non-blank" — the empty form ships its own constants (`type`, `spec_version`) and some
  // families 404 with zero inputs (docs/issues/0049). `selectPopulatedNode` encodes both traps.
  await scene(page, 'Left-select a Promotable object — its form opens, populated')
  const promo = paneNodes(page, PANE.promo)
  const { shape, skipped, tried } = await selectPopulatedNode(page, promo)
  if (skipped.length) console.log(`     forms that opened without the object: ${skipped.join(', ')}`)
  if (shape) {
    console.log(`     ${shape.id}: ${shape.filled}/${shape.total} fields pre-filled`)
  } else {
    console.log(`     no populated form after ${tried} nodes — continuing`)
  }
  await beat(page, 6_000)

  // ---- Scene 3 — the Promotable context menu (P3-S4, P3-S9) ---------------
  await scene(page, 'Right-click a Promotable object — Copy, Edit DAG, Promote')
  await openComposer(page)
  const promoIcons = paneNodeIcons(page, PANE.promo)
  await expect
    .poll(async () => await promoIcons.count(), { timeout: 60_000, message: 'promotable icons' })
    .toBeGreaterThan(0)
  await promoIcons.first().click({ button: 'right' })

  const menu = composerWidget(page).locator('.scm-container:visible')
  await expect(menu.first(), 'the context menu opened').toBeVisible({ timeout: 20_000 })
  const entries = (await menu.allInnerTexts().catch(() => [] as string[]))
    .join(' ')
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean)
  console.log(`     Promotable menu offers: ${entries.join(' | ')}`)
  await beat(page, 5_000)
  await dismissMenu(page)

  // ---- Scene 4 — Scratch's menu differs (the negative half of P3-S9) ------
  //
  // Promote is authored only in `panel.promo.js`. Scratch holds what no promotable reaches, so its
  // menu deliberately has no Promote entry — showing both menus side by side is the clearest way
  // to make that design visible.
  await scene(page, 'Right-click a Scratch object — Create SRO, but no Promote')
  const scratchIcons = paneNodeIcons(page, PANE.scratch)
  if ((await scratchIcons.count()) > 0) {
    await scratchIcons.first().click({ button: 'right' })
    await expect(composerWidget(page).getByText(/create sro/i).first()).toBeVisible({ timeout: 20_000 })
    // ⚠️ Count only VISIBLE matches: the Promo pane's menu stays in the DOM when hidden, so an
    // unscoped count finds its Promote entry against a perfectly correct build.
    const promoteInScratch = await composerWidget(page)
      .locator('.scm-container:visible')
      .getByText(/^\s*promote\s*$/i)
      .count()
    console.log(`     Promote entries in the Scratch menu: ${promoteInScratch} (expected 0)`)
    await beat(page, 5_000)
    await dismissMenu(page)
  } else {
    console.log('     Scratch pane is empty — skipping that beat')
  }

  // ---- Scene 5 — New Object (P3-S10, #42) ---------------------------------
  await scene(page, 'New Object — choose a type, and its create form opens')
  await openComposer(page)
  const button = page.getByRole('button', { name: /new object/i }).first()
  await expect(button, 'a "New Object" button exists').toBeVisible({ timeout: 30_000 })
  await button.click()

  // ⚠️ Count **visible** items. `.dropdown-item` is in the DOM before any click (measured 15 with
  // the menu closed), so a plain count passes without the dropdown ever opening.
  const dropdown = page.locator('.dropdown-menu').first()
  await expect(dropdown, 'the New Object dropdown opened').toBeVisible({ timeout: 20_000 })
  const items = page.locator('.dropdown-menu .dropdown-item:visible')
  await expect
    .poll(async () => await items.count(), { timeout: 20_000, message: 'dropdown items shown' })
    .toBeGreaterThan(10)
  console.log(`     New Object offers ${await items.count()} types`)
  await beat(page, 5_000)

  // The dropdown template puts the label on its own line, so an anchored /^Identity$/ never
  // matches — allow the padding.
  await items.filter({ hasText: /^\s*Identity\s*$/ }).first().click()
  await expect
    .poll(async () => page.frames().some((f: any) => /identity-forms\/identity-create/.test(f.url())), {
      timeout: 30_000,
      message: 'the Identity create form opened',
    })
    .toBeTruthy()
  const form = page.frames().find((f: any) => /identity-create/.test(f.url()))
  console.log(`     Identity create form opened with ${form ? await form.locator('input').count() : 0} fields`)
  await beat(page, 6_000)

  await scene(page, 'End of Act 3')
  await beat(page, 2_000)
})
