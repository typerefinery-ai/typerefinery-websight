import { expect, request } from '@playwright/test'
import { step, test, observe } from '../runsheet'
import { FLOW_BASE, SHOWCASE } from '../playwright.config'

/** Act 1 — the "All Incidents" table. Runsheet Act 1 / docs/issues/0005. */

const INCIDENTS = `${SHOWCASE}/pages/incidents.html`

/**
 * The "+ Create" dropdown's entries, scoped so they cannot be confused with the sidebar.
 *
 * The menu renders as `DIV.dropdown-menu.dropdownMenu` (gaining `.show` when open) containing
 * `DIV.dropdown-item` entries — Incident · Note · Artifact · Task. The left sidebar *also* has an
 * item reading "Incident" (`LI.list-group-item`, in the nav list Artifacts · Dashboard · Incidents
 * · Incident · Notes · Options · Tags · Tasks), and it is **always visible**.
 *
 * A bare `getByText(/^\s*Incident\s*$/i)` therefore matched the sidebar, which broke these steps in
 * two different ways:
 *   - **P1-S4/S5/S6** clicked the sidebar link and navigated away instead of opening the modal.
 *   - **P1-S3** asserted "the dropdown item is visible" against the sidebar item, so it **passed
 *     vacuously** — it never demonstrated that the dropdown opened at all.
 *
 * Earlier attempts to scope by container looked for `a, li, button` children and found nothing:
 * the entries are `DIV`s.
 */
const dropdownItem = (page: any, label: RegExp) =>
  page.locator('.dropdown-menu .dropdown-item').filter({ hasText: label }).first()

/**
 * The Create Incident form's frame, scoped **by src**.
 *
 * These steps used `frameLocator('iframe').first()`, which held only while the incidents table
 * rendered nothing. Once the table paints rows (docs/issues/0029, fixed 2026-08-04) the page
 * carries an earlier, empty iframe, so `.first()` selects that instead and the steps time out
 * looking for form fields that are in the *second* frame. Observed order after the fix:
 *
 *   iframes: ["", ".../os-triage/forms/createincident.html"]
 *
 * Naming the frame keeps the step honest whatever else the page grows. Same class of harness
 * fragility as docs/issues/0043 — a locator that only worked because the page was empty.
 */
const createIncidentFrame = (page: any) =>
  page.frameLocator('iframe[src*="createincident"]').first()

/**
 * Submit an item modal. Its buttons ("Cancel" / "Save Changes") live on the **modal chrome in the
 * host page**, not inside the form iframe — the same arrangement the composer's modals use. The
 * frame is kept as a fallback for any form that renders its own submit.
 */
async function submitModal(page: any, frame: any) {
  const pageButton = page.getByRole('button', { name: /save changes|^save$|^create$/i }).first()
  if (await pageButton.count()) {
    await pageButton.click()
    return
  }
  await frame.getByRole('button', { name: /save|create/i }).first().click()
}

/** The table paints its rows asynchronously over TMS; give it room before asserting. */
async function openIncidents(page: any) {
  await page.goto(INCIDENTS, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(5_000)
}

test.describe('Act 1 — All Incidents table', () => {
  /**
   * Act 1 is **destructive**: P1-S5 and P1-S6 each create an incident, and the create API resets
   * the current incident to the new (empty) one. Acts 2 and 3 are data-gated on that incident, so
   * running the full suite in order silently starved them — Promo/Scratch came back with 0 nodes
   * and three genuinely-passing Composer steps reported red. That is the runsheet's R-1 hazard,
   * and it cost a false "regression" hunt.
   *
   * Restore whatever was current before this act, so suite order stops mattering.
   */
  let previousIncident: any = null

  test.beforeAll(async ({ request }) => {
    const res = await request.get(`${FLOW_BASE}/viz-data/overview-default-incident`).catch(() => null)
    const payload = res ? await res.json().catch(() => null) : null
    const incidentNode = (payload?.nodes || []).find((n: any) => n?.original?.type === 'incident')
    previousIncident = incidentNode || null
    if (!previousIncident) console.warn('Act 1: could not identify the current incident; skipping restore')
  })

  test.afterAll(async ({ request }) => {
    if (!previousIncident) return
    const res = await request
      .post(`${FLOW_BASE}/os-triage/incident-context/set-current`, { data: previousIncident })
      .catch(() => null)
    console.log(`Act 1 teardown: restored current incident -> ${previousIncident?.id} (${res?.status()})`)
  })

  step('P1-S1', async ({ page }) => {
    await openIncidents(page)

    const rows = page.locator('table tbody tr')
    await expect
      .poll(async () => await rows.count(), { timeout: 60_000, message: 'incident rows rendered' })
      .toBeGreaterThan(0)

    // Guards docs/issues/0025 — the whole page used to stack ~900px below the fold.
    //
    // Measure the table that actually holds the rows. Bootstrap-table renders **two** `table`
    // elements: a hidden header clone (no layout box, 0 rows) and the real body table. Taking
    // `.first()` picked the clone and asserted `not.toBeNull()` against it, which only passed
    // while the table was empty and the clone was the only one. Observed 2026-08-04:
    //   table[0] box=null rows=0   ·   table[1] 1284x1947 y=228 rows=24
    const box = await page.locator('table:has(tbody tr)').first().boundingBox()
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
    // The row's claim is "rows **live-update** over TMS **without a reload**". The old assertion
    // never triggered the flow — it checked that a `table_*` key existed and rows > 0, which says
    // nothing about updating (docs/issues/0048). Do the real thing: clear the rendered rows, trigger
    // the flow, and require them to come back **without navigating**.
    await openIncidents(page)
    const onLoad = await page.locator('tbody tr').count()
    expect(onLoad, 'rows render on load').toBeGreaterThan(0)

    await page.evaluate(() => document.querySelectorAll('tbody tr').forEach((r) => r.remove()))
    expect(await page.locator('tbody tr').count(), 'DOM cleared so a push is unambiguous').toBe(0)

    // Restarting the flow re-fires its senddata node, which now drives the live fetch chain
    // (senddata → fetchinc → maprows → TMS) rather than publishing a stale static payload — see
    // docs/issues/0005. Before that rewiring this push carried a 6-row July snapshot.
    await page.request.get(`${FLOW_BASE}/fapi/streams_restart/f210iy001bt51d/`).catch(() => {})

    await expect
      .poll(async () => await page.locator('tbody tr').count(), {
        timeout: 60_000,
        message: 'rows re-rendered over TMS without a reload',
      })
      .toBeGreaterThan(0)

    // …and the payload must be current, not the old snapshot.
    const after = await page.locator('tbody tr').count()
    observe(test.info(), 'note', `TMS push re-rendered ${after} rows (on load: ${onLoad})`)
    expect(after, 'the TMS push carries the full current row set, not a stale snapshot')
      .toBeGreaterThanOrEqual(onLoad)
  })

  step('P1-S3', async ({ page }) => {
    await openIncidents(page)
    const create = page.getByRole('button', { name: /\+?\s*create/i }).first()
    await expect(create).toBeVisible({ timeout: 30_000 })
    await create.click()
    // The dropdown is attached after the button (docs/issues/0005 — it used to be built
    // with jQuery .add(), which never inserts into the DOM).
    const item = dropdownItem(page, /^\s*Incident\s*$/i)
    await expect(item).toBeVisible({ timeout: 20_000 })
  })

  step('P1-S4', async ({ page }) => {
    await openIncidents(page)
    await page.getByRole('button', { name: /\+?\s*create/i }).first().click()
    await dropdownItem(page, /^\s*Incident\s*$/i).click()

    const frame = createIncidentFrame(page)
    await expect(frame.locator('input, select, textarea').first()).toBeVisible({ timeout: 60_000 })
    const fields = await frame.locator('input, select, textarea').count()
    expect(fields, 'Create Incident form fields').toBeGreaterThan(5)
  })

  step('P1-S5', async ({ page }) => {
    const api = await request.newContext({ ignoreHTTPSErrors: true })
    const before = await (await api.get(`${FLOW_BASE}/viz-data/table-all-incidents`)).json()

    await openIncidents(page)
    await page.getByRole('button', { name: /\+?\s*create/i }).first().click()
    await dropdownItem(page, /^\s*Incident\s*$/i).click()

    const frame = createIncidentFrame(page)
    // The Create Incident form's title field is **`incidenttitle`**, not `name` — the flow's
    // mapform node reads `form.incidenttitle` and falls back to "Untitled Incident" without it
    // (docs/flows/createincident-form-flow-f210ot001bt51d.json). Kept tolerant of the trailing
    // space seen on other authored field names (docs/issues/0013).
    const name = frame
      .locator('input[name="incidenttitle"], input[name="incidenttitle "], input[name="name"], input[name="name "]')
      .first()
    await expect(name).toBeVisible({ timeout: 60_000 })
    const incidentName = `Runsheet probe ${new Date().toISOString().slice(11, 19)}`
    await name.click()
    await name.pressSequentially(incidentName, { delay: 20 })

    // "Save Changes" belongs to the **modal chrome on the host page**, not to the form iframe —
    // the same arrangement as the composer's modals. Try the page first, fall back to the frame.
    await submitModal(page, frame)
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
    await dropdownItem(page, /^\s*Incident\s*$/i).click()
    const frame = createIncidentFrame(page)
    // The Create Incident form's title field is **`incidenttitle`**, not `name` — the flow's
    // mapform node reads `form.incidenttitle` and falls back to "Untitled Incident" without it
    // (docs/flows/createincident-form-flow-f210ot001bt51d.json). Kept tolerant of the trailing
    // space seen on other authored field names (docs/issues/0013).
    const name = frame
      .locator('input[name="incidenttitle"], input[name="incidenttitle "], input[name="name"], input[name="name "]')
      .first()
    await expect(name).toBeVisible({ timeout: 60_000 })
    await name.click()
    await name.pressSequentially(`Runsheet nav ${new Date().toISOString().slice(11, 19)}`, { delay: 20 })
    // "Save Changes" belongs to the **modal chrome on the host page**, not to the form iframe —
    // the same arrangement as the composer's modals. Try the page first, fall back to the frame.
    await submitModal(page, frame)
    // FORM_SUCCESS → modal callback → navigate. Skipped during a TotalJS busy window (0014).
    await expect(page).toHaveURL(/incident/i, { timeout: 90_000 })
  })

  step('P1-S7', async ({ page }) => {
    await openIncidents(page)
    // The row actions are **icon buttons with no text**, so getByRole(name: /open/) never matched
    // them — it only appeared to work while there were no rows to match at all. The label lives on
    // the nested icon's `title` (and in the button's data-model `label`), so target that:
    //   <button class="btn btn-sm"><i title="Open" class="pi pi-sign-in"></i></button>
    const open = page.locator('tbody tr td button:has([title="Open"])').first()
    await expect(open).toBeVisible({ timeout: 30_000 })
    await open.click()
    await expect(page).toHaveURL(/incident/i, { timeout: 60_000 })
  })

  step('P1-S8', async ({ page }) => {
    // Simulate the create failing and assert the UI says so rather than going quiet.
    //
    // ⚠️ Fail the request the **browser** actually makes. An earlier version intercepted
    // `**/stix-orm/**`, but the create chain runs server-side (browser → the form's flow route →
    // stix-orm), so that interception never touched it — the browser only calls `/stix-orm/*` for
    // vocab lookups. The test reported "no error surfaced" without having caused a failure at all.
    await openIncidents(page)
    let submitIntercepted = false
    await page.route('**/*', (route) => {
      const req = route.request()
      if (req.method() === 'POST' && /\/form\b|\/form\//.test(req.url())) {
        submitIntercepted = true
        return route.fulfill({ status: 500, body: 'forced failure' })
      }
      return route.continue()
    })
    await page.getByRole('button', { name: /\+?\s*create/i }).first().click()
    await dropdownItem(page, /^\s*Incident\s*$/i).click()
    const frame = createIncidentFrame(page)
    // The Create Incident form's title field is **`incidenttitle`**, not `name` — the flow's
    // mapform node reads `form.incidenttitle` and falls back to "Untitled Incident" without it
    // (docs/flows/createincident-form-flow-f210ot001bt51d.json). Kept tolerant of the trailing
    // space seen on other authored field names (docs/issues/0013).
    const name = frame
      .locator('input[name="incidenttitle"], input[name="incidenttitle "], input[name="name"], input[name="name "]')
      .first()
    await expect(name).toBeVisible({ timeout: 60_000 })
    await name.click()
    await name.pressSequentially('Runsheet failure probe', { delay: 20 })
    // "Save Changes" belongs to the **modal chrome on the host page**, not to the form iframe —
    // the same arrangement as the composer's modals. Try the page first, fall back to the frame.
    await submitModal(page, frame)

    // Guard the test itself: if the submit was never intercepted, a missing error message proves
    // nothing. This is the check the previous version lacked.
    await expect
      .poll(() => submitIntercepted, { timeout: 20_000, message: 'the submit request was actually failed' })
      .toBeTruthy()

    // Match only what a user can actually see. Once the table renders rows it brings ~33 hidden
    // `<span class="visually-hidden">Error</span>` nodes (bootstrap-table's a11y markup), and
    // `.first()` picked one of those and failed on "hidden" — an assertion that only worked while
    // the page was empty. Filtering to visible keeps the step honest about what is *surfaced*.
    await expect(
      page.locator('text=/error|failed|could not|unable/i').filter({ visible: true }).first(),
      'an error is surfaced in the UI',
    ).toBeVisible({ timeout: 30_000 })
  })
})
