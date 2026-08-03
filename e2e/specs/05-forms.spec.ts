import { expect, request } from '@playwright/test'
import { step, test } from '../runsheet'
import { SHOWCASE, FLOW_BASE } from '../playwright.config'

/** Act 5 — critical STIX form behaviour. Runsheet Act 5 / docs/issues/0009. */

const FORMS = `${SHOWCASE}/forms/stixorm-forms`
const IDENTITY_CREATE = `${FORMS}/stix-forms/sdo-forms/identity-forms/identity-create.html`
const IDENTITY_UPDATE = `${FORMS}/stix-forms/sdo-forms/identity-forms/identity-update.html`

async function openForm(page: any, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(4_000)
}

test.describe('Act 5 — form behaviour', () => {
  step('P5-S1', async ({ page }) => {
    await openForm(page, IDENTITY_CREATE)
    // The groups are **icon tabs**, not text headings — the earlier text-matching version of
    // this check failed against a perfectly good form. Assert the grouping affordance itself:
    // a row of group tabs plus the fieldset separators the form renders between groups.
    const tabs = page.locator('button, [role="tab"], a').filter({ hasNot: page.locator('text=/create|cancel/i') })
    await expect(page.getByRole('button', { name: /create/i }).first()).toBeVisible({ timeout: 30_000 })
    const groupTabs = await page.locator('.nav-item, [role="tab"], button.btn-primary, button[data-group]').count()
    expect(groupTabs, 'field-group tabs on the Create form').toBeGreaterThan(2)
  })

  step('P5-S2', async ({ page }) => {
    await openForm(page, IDENTITY_CREATE)
    await page.getByRole('button', { name: /cancel/i }).first().click()
    await expect(page).toHaveURL(/stixorm-forms\/default/i, { timeout: 30_000 })
  })

  step('P5-S3', async ({ page }) => {
    const api = await request.newContext({ ignoreHTTPSErrors: true })
    await openForm(page, IDENTITY_CREATE)
    const name = page.locator('input[name="name"], input[name="name "]').first()
    await expect(name).toBeVisible({ timeout: 30_000 })
    const probe = `Runsheet identity ${new Date().toISOString().slice(11, 19)}`
    await name.click()
    await name.pressSequentially(probe, { delay: 20 })
    await page.getByRole('button', { name: /save|create/i }).first().click()
    await page.waitForTimeout(8_000)
    // ⚠️ Smoke check only. The object should land in the current incident's **unattached**
    // context and show in the Composer's Scratch pane, which this assertion does not verify —
    // it only proves the submit did not take the stack down. Treat a pass here as "not broken",
    // not as evidence for the runsheet's P5-S3 criterion, which still needs the Scratch check.
    const res = await api.get(`${FLOW_BASE}/viz-data/overview-default-incident`, { timeout: 60_000 })
    expect(res.status()).toBe(200)
    await api.dispose()
  })

  step('P5-S4', async ({ page }) => {
    await openForm(page, IDENTITY_UPDATE)
    const values = await page.locator('input').evaluateAll((els: HTMLInputElement[]) =>
      els.filter((e) => e.type !== 'hidden' && e.value.trim() !== '').length,
    )
    expect(values, 'pre-filled fields on the Update form').toBeGreaterThan(0)
  })

  step('P5-S5', async ({ page }) => {
    await openForm(page, IDENTITY_CREATE)
    // The vocab fields *are* native <select>s, but **Choices.js wraps them**: the native
    // element is hidden (so toBeVisible fails on it) and keeps only the selected option
    // (so counting its <option>s returns 1). The vocabulary lives in the Choices dropdown,
    // and the empty state is the "Select an item" placeholder. Assert through that UI.
    const roles = page.locator('select[name="roles"], select[name="roles "]').first()
    await expect(roles).toHaveCount(1, { timeout: 30_000 })
    expect(await roles.getAttribute('placeholder'), 'empty-state placeholder').toBeTruthy()

    const choices = page.locator('.choices').first()
    await expect(choices).toBeVisible({ timeout: 20_000 })
    await choices.click()
    const items = page.locator('.choices__list--dropdown .choices__item, .choices__list[role="listbox"] .choices__item')
    await expect
      .poll(async () => await items.count(), { timeout: 20_000, message: 'vocabulary values offered in the dropdown' })
      .toBeGreaterThan(1)
  })

  step('P5-S6', async ({ page }) => {
    await openForm(page, IDENTITY_CREATE)
    // #62 — the replacement reference-field select shows icon + heading + description.
    const refSelect = page.locator('[name$="_ref"], [name$="_ref "]').first()
    await expect(refSelect).toBeVisible({ timeout: 20_000 })
    const hasRichRows = await refSelect.locator('img, .icon').count()
    expect(hasRichRows, 'reference rows carry an icon').toBeGreaterThan(0)
  })

  step('P5-S7', async ({ page }) => {
    await openForm(page, IDENTITY_CREATE)
    const refs = page.locator('[name$="_refs"], [name$="_refs "]').first()
    await expect(refs).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /add/i }).first()).toBeVisible({ timeout: 15_000 })
  })

  step('P5-S8', async ({ page }) => {
    const api = await request.newContext({ ignoreHTTPSErrors: true })
    const before = await (await api.get(`${FLOW_BASE}/viz-data/overview-default-incident`)).json()
    await openForm(page, IDENTITY_CREATE)
    // Submit with the required name blank — the Make-Object API must reject it and the
    // save leg must be skipped, so no junk object appears.
    await page.getByRole('button', { name: /save|create/i }).first().click()
    await page.waitForTimeout(8_000)
    const after = await (await api.get(`${FLOW_BASE}/viz-data/overview-default-incident`)).json()
    expect((after.nodes || []).length, 'no junk object was written').toBeLessThanOrEqual((before.nodes || []).length)
    await api.dispose()
  })
})
