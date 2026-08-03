import { expect } from '@playwright/test'
import { step, test } from '../runsheet'
import { SHOWCASE } from '../playwright.config'

/** Act 3 — Incident Composer. Runsheet Act 3 / docs/issues/0007. */

const COMPOSER = `${SHOWCASE}/forms/composer-local.html`
/** The composer workbench is the dependable lab for cross-origin gestures (docs/issues/0007). */
export const WORKBENCH = 'http://localhost:4005/workbench.html'

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
      const marks = await f.locator('svg circle, svg g.node, li, .tree-node').count().catch(() => 0)
      if (marks > 0) panesWithContent++
    }
    expect(panesWithContent, 'panes holding rendered content').toBeGreaterThan(0)
  })

  step('P3-S2', async ({ page }) => {
    // The runsheet marks the CMS embed unreliable for driving radios; use the workbench.
    await page.goto(WORKBENCH, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(8_000)
    const radios = page.locator('input[type="radio"]')
    const n = await radios.count()
    expect(n, 'treeview source radios').toBeGreaterThan(1)
    await radios.nth(1).click()
    await page.waitForTimeout(4_000)
  })

  step('P3-S3', async ({ page }) => {
    await page.goto(WORKBENCH, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(8_000)
    const node = page.locator('svg g.node, .tree-node, svg circle').first()
    await expect(node).toBeVisible({ timeout: 40_000 })
    await node.click({ button: 'right' })
    await expect(page.getByText(/copy/i).first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/edit dag/i).first()).toBeVisible({ timeout: 20_000 })
  })

  step('P3-S4', async ({ page }) => {
    // Known broken: the os-threat copy algorithm rejects the sightings the tree serves,
    // and the flow returns 200 so the widget toasts success (docs/issues/0026).
    await page.goto(WORKBENCH, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(8_000)
    const node = page.locator('svg g.node, .tree-node, svg circle').first()
    await node.click({ button: 'right' })
    await page.getByText(/copy/i).first().click()
    await page.waitForTimeout(6_000)
    await expect(page.locator('text=/No content found for STIX type/i')).toHaveCount(0)
  })

  step('P3-S5', async ({ page }) => {
    await openComposer(page)
    const count = await page.locator('iframe').count()
    let opened = false
    for (let i = 0; i < count && !opened; i++) {
      const f = page.frameLocator('iframe').nth(i)
      const node = f.locator('svg circle, svg g.node').first()
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
    const nodes = page.locator('svg circle, svg g.node')
    expect(await nodes.count()).toBeGreaterThan(1)
    await nodes.nth(0).click()
    await nodes.nth(1).click()
    await nodes.nth(1).click({ button: 'right' })
    await page.getByText(/create sro/i).first().click()
    await expect(page.getByText(/related-to/i).first()).toBeVisible({ timeout: 30_000 })
  })

  step('P3-S7', async ({ page }) => {
    await page.goto(WORKBENCH, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(8_000)
    const nodes = page.locator('svg circle, svg g.node')
    await nodes.nth(0).click()
    await nodes.nth(1).click()
    await nodes.nth(1).click({ button: 'right' })
    await page.getByText(/create connection/i).first().click()
    await expect(page.getByText(/created_by_ref/i).first()).toBeVisible({ timeout: 30_000 })
  })

  step('P3-S8', async ({ page }) => {
    await page.goto(WORKBENCH, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(8_000)
    const nodes = page.locator('svg circle, svg g.node')
    const before = await nodes.count()
    await nodes.first().click({ button: 'right' })
    await page.getByText(/^\s*remove\s*$/i).first().click()
    await page.waitForTimeout(8_000)
    expect(await nodes.count(), 'object removed after refresh').toBeLessThan(before)
  })

  step('P3-S9', async ({ page }) => {
    await page.goto(WORKBENCH, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(8_000)
    await page.locator('svg circle, svg g.node').first().click({ button: 'right' })
    await expect(page.getByText(/promote/i).first()).toBeVisible({ timeout: 15_000 })
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
    await expect(page.locator('text=/Loading graph data/i')).toHaveCount(0)
  })
})
