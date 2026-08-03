import { expect } from '@playwright/test'
import { step, test } from '../runsheet'
import { SHOWCASE } from '../playwright.config'

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
    // The runsheet marks the CMS embed unreliable for driving radios; use the workbench.
    await page.goto(WORKBENCH, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(8_000)
    const radios = widget(page).locator('input[type="radio"]')
    const n = await radios.count()
    expect(n, 'treeview source radios').toBeGreaterThan(1)
    await radios.nth(1).click()
    await page.waitForTimeout(4_000)
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

  step('P3-S4', async ({ page }) => {
    // Known broken: the os-threat copy algorithm rejects the sightings the tree serves,
    // and the flow returns 200 so the widget toasts success (docs/issues/0026).
    await page.goto(WORKBENCH, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(8_000)
    const node = widget(page).locator(NODE_SELECTOR).first()
    await node.click({ button: 'right' })
    await widget(page).getByText(/copy/i).first().click()
    await page.waitForTimeout(6_000)
    // Must be checked **inside the widget frame** — the toast lives there. A page-level check
    // passes vacuously and would falsely promote docs/issues/0026.
    await expect(widget(page).locator('text=/No content found for STIX type/i')).toHaveCount(0)
    // …and the copy must actually be acknowledged, otherwise "no error" proves nothing.
    await expect(widget(page).getByText(/copied|success|added/i).first()).toBeVisible({ timeout: 20_000 })
  })

  step('P3-S5', async ({ page }) => {
    await openComposer(page)
    const count = await page.locator('iframe').count()
    let opened = false
    for (let i = 0; i < count && !opened; i++) {
      const f = page.frameLocator('iframe').nth(i)
      const node = f.locator(NODE_SELECTOR).first()
      if (await node.count().catch(() => 0)) {
        await node.click().catch(() => {})
        await page.waitForTimeout(6_000)
        opened = (await page.locator('iframe').count()) > count
      }
    }
    expect(opened, 'left-select opened a form frame').toBeTruthy()
  })

  step('P3-S6', async ({ page }) => {
    await page.goto(WORKBENCH, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(8_000)
    const nodes = widget(page).locator(NODE_SELECTOR)
    expect(await nodes.count()).toBeGreaterThan(1)
    await nodes.nth(0).click()
    await nodes.nth(1).click()
    await nodes.nth(1).click({ button: 'right' })
    await widget(page).getByText(/create sro/i).first().click()
    await expect(widget(page).getByText(/related-to/i).first()).toBeVisible({ timeout: 30_000 })
  })

  step('P3-S7', async ({ page }) => {
    await page.goto(WORKBENCH, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(8_000)
    const nodes = widget(page).locator(NODE_SELECTOR)
    await nodes.nth(0).click()
    await nodes.nth(1).click()
    await nodes.nth(1).click({ button: 'right' })
    await widget(page).getByText(/create connection/i).first().click()
    await expect(widget(page).getByText(/created_by_ref/i).first()).toBeVisible({ timeout: 30_000 })
  })

  step('P3-S8', async ({ page }) => {
    await page.goto(WORKBENCH, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(8_000)
    const nodes = widget(page).locator(NODE_SELECTOR)
    const before = await nodes.count()
    await nodes.first().click({ button: 'right' })
    await widget(page).getByText(/^\s*remove\s*$/i).first().click()
    await page.waitForTimeout(8_000)
    expect(await nodes.count(), 'object removed after refresh').toBeLessThan(before)
  })

  step('P3-S9', async ({ page }) => {
    await page.goto(WORKBENCH, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(8_000)
    await widget(page).locator(NODE_SELECTOR).first().click({ button: 'right' })
    await expect(widget(page).getByText(/promote/i).first()).toBeVisible({ timeout: 15_000 })
  })

  step('P3-S10', async ({ page }) => {
    await openComposer(page)
    await page.getByRole('button', { name: /new object/i }).first().click()
    await expect(page.locator('.modal, [role="dialog"]').first()).toBeVisible({ timeout: 30_000 })
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
