import { expect, request, test } from '@playwright/test'
import { SHOWCASE, FLOW_BASE } from '../playwright.config'

/**
 * Act 5 as ONE continuous journey, for a single video.
 *
 * Companion to act1-journey.demo.ts and act2-journey.demo.ts — see act1 for why a whole act has to
 * be one test (one context = one video) and why demo journeys live in the `demo` project rather
 * than the runsheet suite.
 *
 * Every locator here is lifted from `specs/05-forms.spec.ts` rather than re-derived. Acts 1 and 2
 * each cost three or four failed recordings to learn that lesson: the regression spec's selectors
 * already encode which traps are real (Choices.js hiding native selects, template rows that are
 * invisible by design, remove controls that belong to a different widget).
 *
 * Scene order is the story a presenter tells, not the step numbering:
 *   structure (P5-S1) → vocabulary (P5-S5) → rich references (P5-S6) → add/remove a row (P5-S7)
 *   → create for real (P5-S3) → the form refuses junk (P5-S8) → cancel (P5-S2)
 *
 * Run with:  ./node_modules/.bin/playwright test --project=demo --grep "Act 5"
 */

const FORMS = `${SHOWCASE}/forms/stixorm-forms`
const IDENTITY_CREATE = `${FORMS}/stix-forms/sdo-forms/identity-forms/identity-create.html`

const beat = (page: any, ms = 2_500) => page.waitForTimeout(ms)

async function scene(page: any, title: string) {
  // eslint-disable-next-line no-console
  console.log(`  ▸ ${title}`)
  await test.step(title, async () => {
    await beat(page, 800)
  })
}

async function openForm(page: any) {
  await page.goto(IDENTITY_CREATE, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  await beat(page, 5_000)
}

test('Act 5 — STIX form behaviour: structure, vocabularies, references, and validation', async ({
  page,
}) => {
  test.setTimeout(420_000)
  const api = await request.newContext({ ignoreHTTPSErrors: true })

  // ---- Scene 1 — the form's structure (P5-S1) -----------------------------
  await scene(page, 'Open the Identity create form')
  await openForm(page)
  await expect(page.getByRole('button', { name: /create/i }).first()).toBeVisible({ timeout: 30_000 })
  await beat(page, 3_000)

  await scene(page, 'Base and object properties render inline; optional ones are offered by name')
  for (const field of ['name', 'description']) {
    await expect(page.locator(`[name="${field}"], [name="${field} "]`).first()).toBeVisible({
      timeout: 20_000,
    })
  }
  const optionalControls = await page
    .locator('button[title]')
    .evaluateAll((els: HTMLElement[]) => els.map((e) => e.getAttribute('title') || '').filter(Boolean))
  console.log(`     optional/extension controls offered: ${optionalControls.join(', ')}`)
  await beat(page, 3_000)

  // ---- Scene 2 — a real vocabulary, not a token list (P5-S5) ---------------
  //
  // ⚠️ Choices.js HIDES the native <select> and renders its own UI beside it. Asserting
  // visibility on the select fails against a perfectly good form, and counting its <option>s
  // returns 1 because it keeps only the selected one. Drive the Choices widget.
  await scene(page, 'Open a vocabulary field — the values come from the STIX vocabularies')
  const choices = page.locator('.choices').first()
  await expect(choices).toBeVisible({ timeout: 20_000 })
  await choices.click()
  const items = page.locator(
    '.choices__list--dropdown .choices__item, .choices__list[role="listbox"] .choices__item',
  )
  await expect
    .poll(async () => await items.count(), { timeout: 20_000, message: 'vocabulary values offered' })
    .toBeGreaterThan(1)
  console.log(`     dropdown carries ${await items.count()} vocabulary values`)
  await beat(page, 4_000)
  // Close it again so the next scene is not filmed through an open dropdown.
  await page.keyboard.press('Escape').catch(() => {})
  await beat(page, 1_500)

  // ---- Scene 3 — reference fields are rich rows (P5-S6, #62 + #83) ---------
  await scene(page, 'A reference field offers real objects — icon, heading, description')
  const refSelect = page.locator('select[name$="_ref"]').first()
  await expect(refSelect).toBeAttached({ timeout: 20_000 })
  const refWidget = page.locator('.choices').filter({ has: refSelect })
  await expect(refWidget).toBeVisible({ timeout: 20_000 })
  const rows = refWidget.locator('.choices__item--choice')
  await expect
    .poll(() => rows.count(), { timeout: 30_000, message: 'reference options load from the data source' })
    .toBeGreaterThan(0)
  const icons = await refWidget.locator('.choices__item--choice img').count()
  console.log(`     ${await rows.count()} reference rows, ${icons} carrying an icon`)
  // Open it so the rows are actually on screen for the recording — they live in a closed
  // dropdown by design, which is correct behaviour but films as nothing happening.
  await refWidget.click().catch(() => {})
  await beat(page, 5_000)
  await page.keyboard.press('Escape').catch(() => {})
  await beat(page, 1_500)

  // ---- Scene 4 — add an optional property, then take it away (P5-S7) ------
  //
  // ⚠️ The remove control must be scoped to the row just added. The form carries Choices
  // multi-selects whose own "Remove item" buttons would otherwise be clicked instead.
  await scene(page, 'Add an Object Marking row, then remove it again')
  const addButton = page
    .locator('button[title="Object Marking"], button[data-label*="Object Marking" i]')
    .first()
  await expect(addButton).toBeVisible({ timeout: 30_000 })
  const markingRows = () =>
    page.locator('[name="object_marking_refs"], [name^="object_marking_refs"]:visible')
  const before = await markingRows().count()
  await addButton.click()
  await beat(page, 3_000)
  const after = await markingRows().count()
  console.log(`     object_marking_refs rows ${before} -> ${after}`)

  if (after > before) {
    const addedRow = markingRows().last().locator('xpath=ancestor::*[@state="new"][1]')
    const rowRemove = addedRow.locator(
      '.composite-remove-item, button[aria-label*="remove" i], [data-action="remove-item"]',
    )
    if ((await rowRemove.count().catch(() => 0)) > 0) {
      await beat(page, 2_500)
      await rowRemove.first().click()
      await beat(page, 3_000)
      console.log(`     removed again — back to ${await markingRows().count()}`)
    } else {
      console.log('     no remove control scoped to the added row; leaving it in place')
    }
  }
  await beat(page, 2_000)

  // ---- Scene 5 — create an object for real (P5-S3) -------------------------
  await scene(page, 'Name the identity and create it — it lands in the unattached context')
  const unattachedCount = async () => {
    const res = await api.get(`${FLOW_BASE}/viz-data/unattached-split`, { timeout: 60_000 })
    if (!res.ok()) return -1
    const split = await res.json()
    return [...(split.scratch?.nodes ?? []), ...(split.promo?.nodes ?? [])].length
  }

  await openForm(page)
  const name = page.locator('input[name="name"], input[name="name "]').first()
  await expect(name).toBeVisible({ timeout: 30_000 })
  const probe = `Demo identity ${new Date().toISOString().slice(11, 19)}`
  await name.click()
  // Typed, not set — the demo should show a person filling the field.
  await name.pressSequentially(probe, { delay: 45 })
  await beat(page, 2_000)
  await page.getByRole('button', { name: /save|create/i }).first().click()

  const landed = async () => {
    const res = await api.get(`${FLOW_BASE}/viz-data/unattached-split`, { timeout: 60_000 })
    if (!res.ok()) return false
    const split = await res.json()
    const all = [...(split.scratch?.nodes ?? []), ...(split.promo?.nodes ?? [])]
    return all.some((n: unknown) => JSON.stringify(n).includes(probe))
  }
  await expect
    .poll(landed, { timeout: 60_000, message: `identity "${probe}" written to unattached context` })
    .toBe(true)
  console.log(`     "${probe}" is in the unattached context`)
  await beat(page, 4_000)

  // ---- Scene 6 — the form refuses junk (P5-S8) -----------------------------
  //
  // The closing beat, mirroring Act 1's: show the system declining bad input rather than ending
  // on a success. Guarded the same way — "nothing was written" is only meaningful if the submit
  // actually fired, which is exactly how this step once stayed green while Create was inert.
  await scene(page, 'Submit with the required name blank — rejected, and nothing is written')
  const countBefore = await unattachedCount()
  await openForm(page)
  let submitted = false
  page.on('request', (r: any) => {
    if (r.method() === 'POST' && /\/form\b|\/form\//.test(r.url())) submitted = true
  })
  await page.getByRole('button', { name: /save|create/i }).first().click()
  await expect
    .poll(() => submitted, { timeout: 30_000, message: 'the blank form was actually submitted' })
    .toBeTruthy()
  await beat(page, 8_000)
  const countAfter = await unattachedCount()
  console.log(`     unattached objects ${countBefore} -> ${countAfter} (submit fired: ${submitted})`)
  expect(countAfter, 'no junk object was written').toBe(countBefore)
  await beat(page, 3_000)

  // ---- Scene 7 — cancel (P5-S2) -------------------------------------------
  await scene(page, 'Cancel returns to the forms index')
  await openForm(page)
  await page.getByRole('button', { name: /cancel/i }).first().click()
  await expect(page).toHaveURL(/stixorm-forms\/default/i, { timeout: 30_000 })
  await beat(page, 3_000)

  await scene(page, 'End of Act 5')
  await beat(page, 2_000)
  await api.dispose()
})
