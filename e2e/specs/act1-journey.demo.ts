import { expect, test } from '@playwright/test'
import { SHOWCASE } from '../playwright.config'

/**
 * Act 1 as ONE continuous journey, for a single video.
 *
 * The runsheet suite records **one video per step**, because Playwright creates a context per test.
 * That is right for regression review — you can pull up P1-S7 on its own — but it cannot produce
 * something to play end to end. This file is the other half: one test, one context, one video that
 * walks the whole act in demo order.
 *
 * ⚠️ This is a **demo**, not a regression test. It asserts enough to fail loudly if the journey is
 * broken, but its job is to be watchable: it moves at a human pace and narrates each beat into the
 * trace. The runsheet steps remain the source of truth for whether Act 1 *works*.
 *
 * Kept out of the regression suite by the `demo` project (`testMatch: /.*\.demo\.ts/`), so a normal
 * run neither doubles in length nor gains an unaccounted step. Run it with:
 *
 *   ./node_modules/.bin/playwright test --project=demo
 *
 * ⚠️ **P1-S8 is deliberately excluded.** That step forces the create API to fail so the UI's error
 * handling can be checked — a necessary regression assertion and a terrible demo beat. Ask for it
 * as a closing scene if you want to show graceful failure; it is not part of the happy path.
 *
 * ⚠️ **"+ Create → Task" is deliberately avoided.** The dropdown offers it and creating a Task
 * silently does nothing (alpha-launch docs/issues/0089). The journey uses Incident, which works.
 */

const INCIDENTS = `${SHOWCASE}/pages/incidents.html`

/** Hold a beat so a viewer can register what just happened. */
const beat = (page: any, ms = 2_500) => page.waitForTimeout(ms)

/** Narrate into the trace and the console, so the recording is self-describing. */
async function scene(page: any, title: string) {
  // eslint-disable-next-line no-console
  console.log(`  ▸ ${title}`)
  await test.step(title, async () => {
    await beat(page, 800)
  })
}

const dropdownItem = (page: any, label: RegExp) =>
  page.locator('.dropdown-menu .dropdown-item').filter({ hasText: label }).first()

const createIncidentFrame = (page: any) => page.frameLocator('iframe[src*="createincident"]').first()

test('Act 1 — All Incidents: browse, create an incident, open one', async ({ page }) => {
  test.setTimeout(300_000)

  // ---- Scene 1 — the table (P1-S1, P1-S2) ---------------------------------
  await scene(page, 'Open the All Incidents page')
  await page.goto(INCIDENTS, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 90_000 }).catch(() => {})
  await beat(page, 4_000)

  const rows = page.locator('table tbody tr')
  await expect
    .poll(async () => await rows.count(), { timeout: 90_000, message: 'the incidents table paints rows' })
    .toBeGreaterThan(0)
  const rowCount = await rows.count()
  console.log(`     table shows ${rowCount} incident(s)`)
  await beat(page, 3_000)

  // ---- Scene 2 — the Create menu (P1-S3) ----------------------------------
  await scene(page, 'Open "+ Create"')
  // ⚠️ Use P1-S3's proven locator verbatim: `/\+?\s*create/i` — unanchored, optional plus.
  // The first cut of this journey wrote `/\+\s*create|^create$/i` from assumption and found
  // nothing, failing the recording at scene 2. The regression spec already knew the answer;
  // re-deriving a locator instead of reusing the one under test is how a demo drifts from the
  // thing it is meant to demonstrate.
  const createButton = page.getByRole('button', { name: /\+?\s*create/i }).first()
  await expect(createButton, 'the "+ Create" button is on the page').toBeVisible({ timeout: 30_000 })
  await createButton.click()
  await expect(dropdownItem(page, /^\s*Incident\s*$/i), 'the Create dropdown opened').toBeVisible({
    timeout: 20_000,
  })
  await beat(page, 2_500)

  // ---- Scene 3 — the Create Incident form (P1-S4) -------------------------
  await scene(page, 'Choose Incident — the modal form opens')
  await dropdownItem(page, /^\s*Incident\s*$/i).click()
  const frame = createIncidentFrame(page)
  const title = frame.locator('input[name="incidenttitle"], input[name="name"]').first()
  await expect(title, 'the Create Incident form rendered').toBeVisible({ timeout: 60_000 })
  await beat(page, 2_500)

  // ---- Scene 4 — fill and save (P1-S5) ------------------------------------
  await scene(page, 'Fill the form and save')
  // Typed rather than set programmatically — the form is React-controlled, and this is the same
  // rule P0-S5 follows for the CMS login.
  const name = `Demo incident ${new Date().toISOString().slice(11, 19)}`
  await title.click()
  await title.pressSequentially(name, { delay: 45 })
  await beat(page, 1_500)

  const save = page.getByRole('button', { name: /save changes|^save$|^create$/i }).first()
  await expect(save, 'the modal offers Save').toBeVisible({ timeout: 20_000 })
  await save.click()

  // ---- Scene 5 — it lands on the Overview (P1-S6) -------------------------
  await scene(page, 'The new incident opens in Incident Overview')
  await expect
    .poll(async () => page.url(), { timeout: 90_000, message: 'the browser moved to Incident Overview' })
    .toMatch(/overview|incident/i)
  await page.waitForLoadState('networkidle', { timeout: 90_000 }).catch(() => {})
  await beat(page, 5_000)
  console.log(`     created "${name}"`)

  // ---- Scene 6 — back to the table, open a row (P1-S7) --------------------
  await scene(page, 'Back to All Incidents, and open a row')
  await page.goto(INCIDENTS, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 90_000 }).catch(() => {})
  await beat(page, 4_000)

  // ⚠️ P1-S7's proven locator, and its reason, verbatim: the row actions are **icon buttons with no
  // text**, so `getByRole('button', { name: /open/ })` never matches —
  //     <button class="btn btn-sm"><i title="Open" class="pi pi-sign-in"></i></button>
  // The first cut of this journey used getByRole and silently skipped the beat, so P1-S7 was missing
  // from a video that claimed to show all of Act 1. That is the SECOND locator in this file I
  // re-derived instead of reusing; the regression spec had already solved both.
  const openButton = page.locator('tbody tr td button:has([title="Open"])').first()
  if (await openButton.count()) {
    await openButton.click()
    await page.waitForLoadState('networkidle', { timeout: 90_000 }).catch(() => {})
    await beat(page, 5_000)
    console.log('     opened an incident from the table')
  } else {
    // Not fatal for a demo — say so rather than failing the recording.
    console.log('     no "Open" control found on a row; skipping that beat')
  }

  // ---- Scene 7 — it fails gracefully (P1-S8) ------------------------------
  // A closing beat: force the create to fail and show the UI says so rather than going quiet.
  //
  // ⚠️ Fail the request the BROWSER actually makes. P1-S8 records that an earlier version
  // intercepted `**/stix-orm/**` and never touched anything — the create chain runs server-side
  // (browser → the form's flow route → stix-orm), so the test reported "no error surfaced" without
  // having caused a failure at all. Interception and its self-check are reused verbatim.
  await scene(page, 'And when the save fails, it says so')
  let submitIntercepted = false
  await page.route('**/*', (route) => {
    const req = route.request()
    if (req.method() === 'POST' && /\/form\b|\/form\//.test(req.url())) {
      submitIntercepted = true
      return route.fulfill({ status: 500, body: 'forced failure' })
    }
    return route.continue()
  })

  await page.goto(INCIDENTS, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 90_000 }).catch(() => {})
  await beat(page, 3_000)

  await page.getByRole('button', { name: /\+?\s*create/i }).first().click()
  await dropdownItem(page, /^\s*Incident\s*$/i).click()
  const failFrame = createIncidentFrame(page)
  const failTitle = failFrame
    .locator('input[name="incidenttitle"], input[name="incidenttitle "], input[name="name"], input[name="name "]')
    .first()
  await expect(failTitle, 'the form opened for the failure scene').toBeVisible({ timeout: 60_000 })
  await failTitle.click()
  await failTitle.pressSequentially('This save will fail', { delay: 45 })
  await beat(page, 1_500)

  await page.getByRole('button', { name: /save changes|^save$|^create$/i }).first().click()

  // Guard the scene itself: if nothing was intercepted, a calm-looking UI proves nothing.
  await expect
    .poll(() => submitIntercepted, { timeout: 20_000, message: 'the submit was actually failed' })
    .toBeTruthy()
  console.log('     submit forced to 500 — the modal should stay open with a message')
  await beat(page, 6_000)
  await page.unroute('**/*')

  await scene(page, 'End of Act 1')
  await beat(page, 2_000)
})
