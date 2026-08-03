import { expect, request } from '@playwright/test'
import { step, test, observe } from '../runsheet'
import { FLOW_BASE, SHOWCASE } from '../playwright.config'

/** Act 1 — the "All Incidents" table. Runsheet Act 1 / docs/issues/0005. */

const INCIDENTS = `${SHOWCASE}/pages/incidents.html`

/** The table paints its rows asynchronously over TMS; give it room before asserting. */
async function openIncidents(page: any) {
  await page.goto(INCIDENTS, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(5_000)
}

test.describe('Act 1 — All Incidents table', () => {
  step('P1-S1', async ({ page }) => {
    await openIncidents(page)

    const rows = page.locator('table tbody tr')
    await expect
      .poll(async () => await rows.count(), { timeout: 60_000, message: 'incident rows rendered' })
      .toBeGreaterThan(0)

    // Guards docs/issues/0025 — the whole page used to stack ~900px below the fold.
    const box = await page.locator('table').first().boundingBox()
    expect(box, 'table has a layout box').not.toBeNull()
    expect(box!.y, 'table is above the fold').toBeLessThan(1000)

    // Not a failure of this step, but this is where docs/issues/0027 shows itself:
    // in-app created incidents display the type label instead of their own name.
    const text = await rows.allInnerTexts()
    const mislabelled = text.filter((t) => t.includes('Incident Extension')).length
    if (mislabelled > 0) {
      observe(
        test.info(),
        'note',
        `docs/issues/0027 visible here — ${mislabelled}/${text.length} rows read "Incident Extension" instead of the incident name`,
      )
    }
  })

  step('P1-S2', async ({ page }) => {
    await openIncidents(page)
    const before = await page.locator('table tbody tr').count()
    // The rows are published over TMS by flow f210iy001bt51d. Without triggering the flow
    // we can at least assert the page holds a live TMS payload rather than a static table.
    const stored = await page.evaluate(() =>
      Object.keys(window.localStorage).filter((k) => k.startsWith('table_')),
    )
    expect(stored.length, 'a TMS table payload is cached on the page').toBeGreaterThan(0)
    expect(before).toBeGreaterThan(0)
  })

  step('P1-S3', async ({ page }) => {
    await openIncidents(page)
    const create = page.getByRole('button', { name: /\+?\s*create/i }).first()
    await expect(create).toBeVisible({ timeout: 30_000 })
    await create.click()
    // The dropdown is attached after the button (docs/issues/0005 — it used to be built
    // with jQuery .add(), which never inserts into the DOM).
    const item = page.getByText(/^\s*Incident\s*$/i).first()
    await expect(item).toBeVisible({ timeout: 20_000 })
  })

  step('P1-S4', async ({ page }) => {
    await openIncidents(page)
    await page.getByRole('button', { name: /\+?\s*create/i }).first().click()
    await page.getByText(/^\s*Incident\s*$/i).first().click()

    const frame = page.frameLocator('iframe').first()
    await expect(frame.locator('input, select, textarea').first()).toBeVisible({ timeout: 60_000 })
    const fields = await frame.locator('input, select, textarea').count()
    expect(fields, 'Create Incident form fields').toBeGreaterThan(5)
  })

  step('P1-S5', async ({ page }) => {
    const api = await request.newContext({ ignoreHTTPSErrors: true })
    const before = await (await api.get(`${FLOW_BASE}/viz-data/table-all-incidents`)).json()

    await openIncidents(page)
    await page.getByRole('button', { name: /\+?\s*create/i }).first().click()
    await page.getByText(/^\s*Incident\s*$/i).first().click()

    const frame = page.frameLocator('iframe').first()
    const name = frame.locator('input[name="name"], input[name="name "]').first()
    await expect(name).toBeVisible({ timeout: 60_000 })
    const incidentName = `Runsheet probe ${new Date().toISOString().slice(11, 19)}`
    await name.click()
    await name.pressSequentially(incidentName, { delay: 20 })

    await frame.getByRole('button', { name: /save|create/i }).first().click()
    // The create leg is fire-and-forget; poll the endpoint rather than the UI.
    await expect
      .poll(
        async () => {
          const rows = await (await api.get(`${FLOW_BASE}/viz-data/table-all-incidents`)).json()
          return rows.length
        },
        { timeout: 90_000, message: 'incident count grows after create' },
      )
      .toBeGreaterThan(before.length)
    await api.dispose()
  })

  step('P1-S6', async ({ page }) => {
    await openIncidents(page)
    await page.getByRole('button', { name: /\+?\s*create/i }).first().click()
    await page.getByText(/^\s*Incident\s*$/i).first().click()
    const frame = page.frameLocator('iframe').first()
    const name = frame.locator('input[name="name"], input[name="name "]').first()
    await expect(name).toBeVisible({ timeout: 60_000 })
    await name.click()
    await name.pressSequentially(`Runsheet nav ${new Date().toISOString().slice(11, 19)}`, { delay: 20 })
    await frame.getByRole('button', { name: /save|create/i }).first().click()
    // FORM_SUCCESS → modal callback → navigate. Skipped during a TotalJS busy window (0014).
    await expect(page).toHaveURL(/incident/i, { timeout: 90_000 })
  })

  step('P1-S7', async ({ page }) => {
    await openIncidents(page)
    const open = page.getByRole('button', { name: /^open$/i }).first()
    await expect(open).toBeVisible({ timeout: 30_000 })
    await open.click()
    await expect(page).toHaveURL(/incident/i, { timeout: 60_000 })
  })

  step('P1-S8', async ({ page }) => {
    // Simulate the create API failing and assert the UI says so rather than going quiet.
    await openIncidents(page)
    await page.route('**/stix-orm/**', (route) => route.fulfill({ status: 500, body: 'forced failure' }))
    await page.getByRole('button', { name: /\+?\s*create/i }).first().click()
    await page.getByText(/^\s*Incident\s*$/i).first().click()
    const frame = page.frameLocator('iframe').first()
    const name = frame.locator('input[name="name"], input[name="name "]').first()
    await expect(name).toBeVisible({ timeout: 60_000 })
    await name.click()
    await name.pressSequentially('Runsheet failure probe', { delay: 20 })
    await frame.getByRole('button', { name: /save|create/i }).first().click()
    await expect(
      page.locator('text=/error|failed|could not|unable/i').first(),
      'an error is surfaced in the UI',
    ).toBeVisible({ timeout: 30_000 })
  })
})
