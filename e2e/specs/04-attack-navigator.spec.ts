import { expect, FrameLocator, Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { step, test } from '../runsheet'
import { SHOWCASE } from '../playwright.config'
import { ACT4_MENU } from '../act4-menu'

/**
 * Act 4 — Attack Navigator. Runsheet Act 4 / docs/issues/0008 (R1–R5 delivered 2026-08-15).
 *
 * Rewritten against the REAL behaviour once 0008 R4 landed — the previous version carried
 * pre-build `expect(false)` placeholders from when the act was a gap, and P4-S1 did not handle
 * the Navigator's create-a-layer banner, so all five steps threw on every run (named by the
 * swallowed-reporter, docs/issues/0143). The gestures here are ported from
 * `e2e/walk-act4-gestures.mjs`, which passed 5/5 headed on the same build.
 *
 * ⚠️ P4-S3/S4 copy real objects into the incident's unattached context; the suite's
 * restore teardown (P0-S10) rolls the demo dataset back after the run.
 */

// Traefik's leaf cert is not in the Node trust store (docs/issues/0142) — needed for the
// direct fetches against flow.typerefinery.localhost below.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const HOST_PAGE = `${SHOWCASE}/pages/attack-navigator.html`
const SPLIT = 'https://flow.typerefinery.localhost:8101/viz-data/unattached-split'
const ROUTE = 'https://flow.typerefinery.localhost:8101/os-triage/transport/attack'
const CONTEXT_MAP = path.join(
  __dirname, '..', '..', '..',
  'typerefinery', 'services', 'fastapi', 'generated', 'os-triage', 'context_mem', 'context_map.json',
)

/**
 * Load the host page and get the Navigator to a rendered matrix.
 *
 * Three-layer diagnosis so a failure names WHICH half is broken (0176's trap — a frame showing
 * the gateway's 502 page still "has an iframe"):
 *   1. the page embeds the Navigator service (authoring is right)   -> R2.1
 *   2. the Angular app booted inside the frame (service is up)      -> R1.3/R1.4
 *   3. the matrix rendered (the app has its ATT&CK data)            -> R2.3
 * A fresh browser context has no saved layer, so the app lands on its banner — creating an
 * Enterprise layer is part of reaching state 3, not a workaround.
 */
async function openMatrix(page: Page): Promise<FrameLocator> {
  await page.goto(HOST_PAGE, { waitUntil: 'domcontentloaded' })

  const frame = page.locator('iframe[src*="attack-navigator"]')
  await expect(frame, 'the page embeds the attack-navigator service (R2.1)').toBeVisible({
    timeout: 30_000,
  })

  const nav = page.frameLocator('iframe[src*="attack-navigator"]').first()
  await expect(
    nav.locator('app-root'),
    'the Navigator app booted inside the frame — a 502/blank frame means the service is not ' +
      'running (R1.3/R1.4, docs/issues/0008)',
  ).toBeVisible({ timeout: 60_000 })

  // Banner state: no saved layer yet. Create an Enterprise layer to reach the matrix.
  await page.waitForTimeout(5_000)
  if (!(await nav.locator('.technique-cell, .technique').count())) {
    const create = nav.locator('text=Create New Layer').first()
    if (await create.count()) {
      await create.click()
      await page.waitForTimeout(1_500)
      const enterprise = nav.locator('text=Enterprise').first()
      if (await enterprise.count()) await enterprise.click()
    }
  }

  await expect
    .poll(async () => nav.locator('.technique-cell, .technique').count(), {
      message: 'the matrix rendered inside the frame, not a blank or errored app (R2.3)',
      timeout: 60_000,
    })
    .toBeGreaterThan(100)
  return nav
}

/** Right-click the first technique cell and wait for the context menu. */
async function openTechniqueMenu(page: Page, nav: FrameLocator) {
  // force: an invisible overlay from a prior interaction fails Playwright's actionability
  // wait (measured in the headed walk); the contextmenu event still dispatches at the cell.
  // The FIRST cell is the proven visible-and-menu-capable one — nth(3)/nth(10) matched
  // INVISIBLE cells and threw.
  const cell = nav.locator('.technique-cell, .technique').first()
  await cell.scrollIntoViewIfNeeded().catch(() => {})
  await cell.click({ button: 'right', force: true, timeout: 10_000 })
  await page.waitForTimeout(1_200)
}

/** Follow a context-menu item into its confirmation popup; return {stixId, confirmed}. */
async function copyViaMenu(page: Page, nav: FrameLocator, label: string) {
  const [popup] = await Promise.all([
    page.context().waitForEvent('page', { timeout: 15_000 }),
    nav.locator(`text=${label}`).first().click(),
  ])
  await popup.waitForLoadState('domcontentloaded')
  await popup.waitForTimeout(4_000)
  const stixId = (popup.url().match(/attack\/([a-z0-9-]+--[0-9a-f-]+)/) || [, ''])[1] as string
  const confirmed = (await popup.content()).includes('Copied to Scratch')
  await popup.close()
  return { stixId, confirmed }
}

async function inUnattached(stixId: string): Promise<boolean> {
  const body = JSON.stringify(await (await fetch(SPLIT)).json().catch(() => ({})))
  return body.includes(stixId)
}

test.describe('Act 4 — Attack Navigator', () => {
  step('P4-S1', async ({ page }) => {
    const nav = await openMatrix(page)
    // The first column of the 14-tactic enterprise matrix — booted WITH data, not just booted.
    await expect(
      nav.getByText('Reconnaissance').first(),
      'the enterprise matrix shows its tactic columns (R2.3)',
    ).toBeVisible({ timeout: 10_000 })
  })

  step('P4-S2', async ({ page }) => {
    const nav = await openMatrix(page)
    await openTechniqueMenu(page, nav)
    // decision 0014 Option 5: assert the **configured** labels, never a hardcoded string —
    // the Navigator service generates its menu config from env, so a rename is a config
    // change and this step follows it without an edit (see e2e/act4-menu.ts).
    await expect(
      nav.locator(`text=${ACT4_MENU.techniqueLabel}`).first(),
      `the technique menu item "${ACT4_MENU.techniqueLabel}" appears (R3)`,
    ).toBeVisible({ timeout: 10_000 })
    await expect(
      nav.locator(`text=${ACT4_MENU.tacticLabel}`).first(),
      `the tactic menu item "${ACT4_MENU.tacticLabel}" appears (R3, decision 0018 Option 4)`,
    ).toBeVisible({ timeout: 10_000 })
  })

  step('P4-S3', async ({ page }) => {
    const nav = await openMatrix(page)
    await openTechniqueMenu(page, nav)
    const { stixId, confirmed } = await copyViaMenu(page, nav, ACT4_MENU.techniqueLabel)
    expect(stixId, 'the confirmation URL carries the technique STIX id (R4.1)').toMatch(
      /^attack-pattern--/,
    )
    expect(confirmed, 'the new tab shows the "Copied to Scratch" confirmation (R4.2)').toBe(true)
    expect(
      await inUnattached(stixId),
      `${stixId} landed in the incident's unattached context (R4.3 — visible in Composer Scratch)`,
    ).toBe(true)
  })

  step('P4-S4', async ({ page }) => {
    const nav = await openMatrix(page)
    await openTechniqueMenu(page, nav)
    const { stixId, confirmed } = await copyViaMenu(page, nav, ACT4_MENU.tacticLabel)
    expect(stixId, 'the tactic item resolves the CELL\'s tactic, not the technique (decision 0018)').toMatch(
      /^x-mitre-tactic--/,
    )
    expect(confirmed, 'the new tab shows the "Copied to Scratch" confirmation').toBe(true)
    expect(await inUnattached(stixId), `${stixId} landed in the incident's unattached context`).toBe(
      true,
    )
  })

  step('P4-S5', async ({ page: _page }) => {
    // Route-level, on the exact path the popup hits — the popup UI adds nothing to what the
    // route answers, and editing context_map.json is how "no default incident" is reached.
    const original = fs.readFileSync(CONTEXT_MAP, 'utf8')
    try {
      const map = JSON.parse(original)
      map.current_incident = ''
      fs.writeFileSync(CONTEXT_MAP, JSON.stringify(map))
      // Machine contract is the STATUS (Total.js replaces custom bodies on non-2xx — measured;
      // decision 0017's reason→status map). Human contract: the HTML page NAMES the problem
      // (it answers 200 by design so its body survives).
      const api = await fetch(
        `${ROUTE}/attack-pattern--a62a8db3-f23a-4d8f-afd6-9dbc77e7813b?format=json`,
      )
      const html = await (
        await fetch(`${ROUTE}/attack-pattern--a62a8db3-f23a-4d8f-afd6-9dbc77e7813b`)
      ).text()
      expect(api.status, 'JSON contract: 409 for no_current_incident (decision 0017)').toBe(409)
      expect(
        html,
        'human contract: the page names the reason instead of a bare error',
      ).toContain('no_current_incident')
    } finally {
      fs.writeFileSync(CONTEXT_MAP, original)
    }
  })
})
