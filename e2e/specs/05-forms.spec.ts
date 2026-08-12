import { expect, request } from '@playwright/test'
import { step, test, observe } from '../runsheet'
import { selectPopulatedNode } from '../form-pane'
import { SHOWCASE, FLOW_BASE } from '../playwright.config'

/** Act 5 — critical STIX form behaviour. Runsheet Act 5 / docs/issues/0009. */

const FORMS = `${SHOWCASE}/forms/stixorm-forms`
const IDENTITY_CREATE = `${FORMS}/stix-forms/sdo-forms/identity-forms/identity-create.html`
const IDENTITY_UPDATE = `${FORMS}/stix-forms/sdo-forms/identity-forms/identity-update.html`
const COMPOSER = `${SHOWCASE}/forms/composer-local.html`

async function openForm(page: any, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(4_000)
}

test.describe('Act 5 — form behaviour', () => {
  step('P5-S1', async ({ page }) => {
    await openForm(page, IDENTITY_CREATE)
    await expect(page.getByRole('button', { name: /create/i }).first()).toBeVisible({ timeout: 30_000 })

    // docs/issues/0048, last Tier 2 item. The old assertion counted `.nav-item, [role="tab"],
    // button.btn-primary, button[data-group]` and required **> 2** — a loose enough net that three
    // unrelated buttons would satisfy it, and it never checked a single group *name*.
    //
    // ⚠️ It also tested the wrong thing. The runsheet row says the form "groups fields Base
    // Required / Optional / Object / Extensions", and that is the **payload** categorisation the
    // Make-Object API wants (`{base_required, base_optional, sub, object, extensions}`) — not a
    // visible grouping. Measured, the form renders:
    //   • base + object properties INLINE — type, spec_version, ID, created, modified, name,
    //     roles, sectors, identity_class, description, contact_information, created_by_ref
    //   • optional and extension properties as NAMED ADD CONTROLS — Revoked, Labels, Confidence,
    //     Language, External References, Object Marking, Granular Markings, and the extension one,
    //     Identity Contact Extension (the `add-optional-template` mechanism of docs/issues/0057).
    // So assert that structure, by name, rather than counting buttons.
    // ⚠️ Visibility is the wrong test for the select-backed ones. Choices.js **hides the native
    // element** (`<select … hidden class="… choices__i…">`) and renders its own UI, so
    // `identity_class`, `roles` and `sectors` are present-but-not-visible on a perfectly good
    // form — measured. Asserting visibility on them failed against a working build, which is the
    // same Choices trap as docs/issues/0030. Require visibility only where the field really is
    // the rendered control.
    for (const field of ['name', 'description']) {
      await expect(
        page.locator(`[name="${field}"], [name="${field} "]`).first(),
        `base/object property "${field}" is rendered inline`,
      ).toBeVisible({ timeout: 20_000 })
    }
    for (const field of ['identity_class', 'roles', 'sectors']) {
      await expect
        .poll(async () => await page.locator(`[name="${field}"], [name="${field} "]`).count(), {
          timeout: 20_000,
          message: `vocabulary property "${field}" is present (Choices hides the native select)`,
        })
        .toBeGreaterThan(0)
    }

    const optionalControls = await page
      .locator('button[title]')
      .evaluateAll((els: HTMLElement[]) => els.map((e) => e.getAttribute('title') || '').filter(Boolean))
    observe(test.info(), 'note', `optional/extension controls: ${optionalControls.join(', ')}`)

    // Optional properties, offered by name rather than dumped into the form.
    for (const control of ['Labels', 'Confidence', 'External References', 'Object Marking']) {
      expect(optionalControls, `the form offers the optional property "${control}"`).toContain(control)
    }
    // …and at least one **extension**, which is the fourth category in the row's claim and the one
    // a flat form would omit entirely.
    expect(
      optionalControls.some((t) => /extension/i.test(t)),
      `the form offers an extension property (saw: ${optionalControls.join(', ')})`,
    ).toBeTruthy()

    /**
     * The four group captions, ON SCREEN — docs/issues/0048's last open half of this step.
     *
     * ⚠️ **The comment above used to end by saying the four names were the payload categorisation
     * "not a visible grouping". That was true when it was written and is not any more:**
     * `renderGroupCaptions` (docs/issues/0113) shipped 2026-08-12 and the captions now render —
     * verified by hand in Chrome on the live Composer pane. So the half of this row's claim that was
     * genuinely unassertable has become assertable, and leaving it out would now be under-testing by
     * habit rather than by necessity.
     *
     * 🔑 **Asserted by TEXT, not by counting.** 0048's original complaint about this step was that it
     * counted controls loosely enough that three unrelated buttons satisfied it. Naming each caption
     * is the fix for that class, not a tighter count.
     *
     * ⚠️ The captions are injected **client-side**, so they are absent from the served markup — a
     * check against the HTML would silently pass on nothing (measured while probing docs/issues/0160).
     * Poll the rendered DOM.
     *
     * ⬜ `base_optional` renders as "Base Optional" where the design says "Optional" — a recorded
     * divergence (docs/issues/0113, docs/issues/0160), so match the build's wording and let the
     * divergence stay visible in the docs rather than hiding it behind a lenient regex here.
     */
    for (const caption of ['Base Required', 'Object', 'Base Optional', 'Extensions']) {
      await expect
        .poll(
          async () =>
            await page.getByText(caption, { exact: true }).count(),
          {
            timeout: 20_000,
            message: `group caption "${caption}" renders on screen (docs/issues/0113)`,
          },
        )
        .toBeGreaterThan(0)
    }
    observe(test.info(), 'note', 'group captions asserted: Base Required · Object · Base Optional · Extensions')
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
    // Assert the runsheet's actual criterion: the object lands in the current incident's
    // **unattached** context, which is what the Composer's Scratch pane reads. The previous
    // assertion only checked that an unrelated endpoint still answered 200, so it stayed green
    // through five runs while the Create button was inert (docs/issues/0038).
    const landed = async () => {
      const res = await api.get(`${FLOW_BASE}/viz-data/unattached-split`, { timeout: 60_000 })
      if (!res.ok()) return `unattached-split returned ${res.status()}`
      const split = await res.json()
      const all = [...(split.scratch?.nodes ?? []), ...(split.promo?.nodes ?? [])]
      return all.some((n: unknown) => JSON.stringify(n).includes(probe))
    }
    await expect
      .poll(landed, { timeout: 60_000, message: `identity "${probe}" written to unattached context` })
      .toBe(true)

    // docs/issues/0142 — the same save, with the Identity Contact Extension submitted, created
    // nothing: two authored field names did not match `IdentityContact`. Act 5 ran 9/9 both before
    // and after that fix, because nothing here ever submitted an extension.
    //
    // ⚠️ Assert the payload BEFORE the outcome. Merely revealing the extension's fields does not put
    // them in the request, so an "object landed" assertion downstream of a save that never carried
    // the extension passes forever. The payload check is what makes this guard impossible to pass
    // vacuously.
    const sent: string[] = []
    const failures: string[] = []
    page.on('request', (r) => { if (r.method() === 'POST') sent.push(r.postData() ?? '') })
    page.on('response', async (res) => {
      if (res.request().method() !== 'POST') return
      const body = await res.text().catch(() => '')
      if (/"error"\s*:\s*"?true/i.test(body)) {
        const log = /"log"\s*:\s*"([^"]+)"/.exec(body)?.[1]?.replace(/\\\\/g, '\\')
        failures.push(`${res.status()} ${res.url().slice(0, 110)} traceback: ${log ?? '<none>'}`)
      }
    })

    await openForm(page, IDENTITY_CREATE)
    // The extension's fields sit behind controls whose names live only in `title`
    // (docs/issues/0113).
    // ⚠️ Match `extension` ONLY. A wider `[title*="identity" i]` also matches the **Create Identity**
    // button, so the click loop submitted three empty forms, each answering 200-with-error:true
    // (`MissingPropertiesError: … (name)`) — the guard below then failed on the test's own noise
    // rather than on the product. That is also the real explanation for the spurious
    // `MissingPropertiesError` recorded as an open question in docs/issues/0142: a probe clicking
    // the Save button, not an add-button submitting the form.
    const extBtns = page.locator('[title*="extension" i]')
    const firstNameSel = 'input[name="first_name"], input[name="first_name "]'
    const n = await extBtns.count()
    for (let i = 0; i < n; i++) {
      await extBtns.nth(i).click({ timeout: 5_000 }).catch(() => {})
      await page.waitForTimeout(1_000)
      if (await page.locator(firstNameSel).first().isVisible().catch(() => false)) break
    }
    await expect(page.locator(firstNameSel).first(),
      'the Identity Contact Extension opens').toBeVisible({ timeout: 15_000 })

    const extProbe = `Runsheet identity ext ${new Date().toISOString().slice(11, 19)}`
    const extName = page.locator('input[name="name"], input[name="name "]').first()
    await extName.click()
    await extName.pressSequentially(extProbe, { delay: 20 })
    await page.getByRole('button', { name: /save|create/i }).first().click()
    await page.waitForTimeout(8_000)

    const withKeys = sent.filter((b) =>
      b.includes('extension-definition--66e2492a') &&
      /"(contact_numbers|email_addresses|social_media_accounts|email-contact|field)"/.test(b))
    expect(withKeys.length,
      'a save actually submitted the extension WITH its fields (else the checks below prove nothing)')
      .toBeGreaterThan(0)
    for (const body of withKeys) {
      expect(body, 'extension uses `email_addresses`, not the embedded type name').not.toContain('"email-contact"')
      expect(body, 'no unnamed composite serialising as the fallback key `field`').not.toContain('"field":')
    }
    // This chain answers 200 while the algorithm crashes, putting the truth in the body — so a
    // status check reads a crash as success (docs/issues/0142, docs/issues/0089).
    expect(failures, `no save answered 200-with-error:true\n    ${failures.join('\n    ')}`).toEqual([])

    await api.dispose()
  })

  step('P5-S4', async ({ page }) => {
    // ⚠️ This step used to `openForm(page, IDENTITY_UPDATE)` and assert `values > 0`. That could
    // not fail, and not for the reason the rest of docs/issues/0048 describes — a **directly
    // navigated Update form is empty by design**:
    //
    //   * the form populates in `ns.loadData`, driven either by an authored `readUrl` +
    //     query string (`ns.isDataLoadRequired`) or by the host page posting `FORM_LOAD`
    //     into the embed iframe;
    //   * `identity-update` authors **no `readUrl`** (checked in `/content`, only
    //     `flowapi_sampledata` / `flowapi_template` are set), so the query-string path is off;
    //   * so at `identity-update.html` the only non-blank inputs are the constants `type`
    //     ("identity") and `spec_version` ("2.1") plus the `{}` composite placeholders —
    //     7 of 16 "filled", none of them data. Measured 2026-08-04.
    //
    // The row says "for an **existing object**", so drive it the way the demo does: select a
    // node in the Composer (the P3-S5 path) and assert against the form frame the host populates.
    await page.goto(COMPOSER, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
    await page.waitForTimeout(12_000)

    const nodes = page
      .frameLocator('iframe[src*="widgetdevcomposer"], iframe[src*="4005"]')
      .first()
      .locator('svg.promo_svg')
      .locator('image, g.node, circle')
    await expect
      .poll(async () => await nodes.count(), { timeout: 60_000, message: 'Promo pane nodes rendered' })
      .toBeGreaterThan(0)

    // ⚠️ Do **not** just click the first promo node, and do **not** gate readiness on "some field
    // is non-blank". Both traps are encoded in `selectPopulatedNode` — see `../form-pane` for why
    // (the empty form ships its own constants; pane ordering varies; some families 404 with zero
    // inputs, docs/issues/0049). P3-S5 makes the same claim and uses the same helper.
    // ⚠️ docs/issues/0156 — `minFilledRatio` matches the ratio asserted below, so the walk keeps
    // looking for a node with substance instead of stopping at the first one that merely has
    // nothing *missing*. P5-S3 runs immediately before this step and saves an object with only a
    // name; landing on that measured 4/14 and failed. It used to pass only because Create forms
    // fabricated `identity_class`/`roles`/`sectors`/`created_by_ref` — the padding is gone, and this
    // step must find a real object rather than rely on invented values. Candidates raised from 6
    // because sparse suite-created objects are now legitimately common in the pane.
    const { shape, skipped, tried } = await selectPopulatedNode(page, nodes, {
      candidates: 10,
      minFilledRatio: 0.5,
    })
    if (skipped.length) {
      observe(test.info(), 'note', `Update forms that opened without the object: ${skipped.join(', ')}`)
    }
    expect(
      shape,
      `a promo node opened a populated Update form (tried ${tried}: ${skipped.join(', ') || 'none empty'})`,
    ).not.toBeNull()

    observe(
      test.info(),
      'note',
      `Update form pre-filled ${shape!.filled}/${shape!.total} fields for ${shape!.id}; blank: ${shape!.blanks.join(', ') || '(none)'}`,
    )
    expect(shape!.total, 'the Update form rendered its fields').toBeGreaterThan(5)
    // ⚠️ `created` / `modified` are **not** asserted unconditionally. They are SDO/SRO properties;
    // STIX SCOs (anecdote, url, user-account…) legitimately have neither, so demanding them made
    // this step flaky the moment the docs/issues/0049 fix let SCO-typed nodes resolve — the walk
    // would sometimes land on one and fail against a perfectly good form.
    //
    // Nothing is lost by dropping them: `missing` already requires that **every non-null key the
    // payload carries** reached its input, which covers created/modified exactly when the object
    // actually has them, and stays correct for the objects that do not.
    // Blanks are legitimate where the object has no value for that property (`created_by_ref`, the
    // `{}` extension composites), so the ratio is a majority check rather than 100% — the `missing`
    // gate inside selectPopulatedNode is what enforces the "every field" half.
    expect(shape!.filled / shape!.total, `most fields pre-filled (${shape!.filled}/${shape!.total})`)
      .toBeGreaterThan(0.5)
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

    // ⚠️ docs/issues/0156 — the half this step's own row promises ("**Empty** first row") and this
    // assertion never checked. A truthy `placeholder` attribute and a populated dropdown were both
    // true while every select arrived with its FIRST vocabulary value already selected — so creating
    // an identity with only a name typed stored identity_class:"individual", roles:["soc"] and
    // sectors:["agriculture"], three attributes nobody chose, persisted to disk.
    //
    // Assert on the native <select> value: Choices keeps only the selected option there, so an empty
    // value is exactly "nothing is selected". Checked across EVERY vocab select on the form, because
    // the defect was in the shared component and would otherwise be caught only where it was found.
    const emptyOnLoad = await page.evaluate(() =>
      [...document.querySelectorAll('select')]
        .filter((s) => !(s as HTMLSelectElement).multiple)
        .map((s) => ({ name: (s as HTMLSelectElement).name || '(unnamed)', value: (s as HTMLSelectElement).value }))
        .filter((s) => s.value !== ''),
    )
    expect(
      emptyOnLoad,
      'no vocab select arrives with a value already chosen — a value the user never picked is ' +
        'submitted and stored (docs/issues/0156)',
    ).toEqual([])

    const choices = page.locator('.choices').first()
    await expect(choices).toBeVisible({ timeout: 20_000 })
    await choices.click()
    const items = page.locator('.choices__list--dropdown .choices__item, .choices__list[role="listbox"] .choices__item')
    await expect
      .poll(async () => await items.count(), { timeout: 20_000, message: 'vocabulary values offered in the dropdown' })
      .toBeGreaterThan(1)

    // The row says the **full** vocabulary, "from `/stix-orm/utils/vocab/*`". A hardcoded two-item
    // list satisfies `> 1` (docs/issues/0048, Tier 2), so compare against the endpoint the row names.
    const api = await request.newContext({ ignoreHTTPSErrors: true })
    const res = await api.get(`${FLOW_BASE}/stix-orm/utils/vocab/attack-motivation-ov`, { timeout: 30_000 })
      .catch(() => null)
    if (res?.ok()) {
      const vocab = await res.json().catch(() => null)
      const vocabSize = Array.isArray(vocab) ? vocab.length : Object.keys(vocab || {}).length
      const rendered = await items.count()
      observe(test.info(), 'note', `dropdown shows ${rendered} items; a reference vocab endpoint returns ${vocabSize}`)
      // Not an equality check: this select is `roles`, not the sampled vocab. The point is that the
      // dropdown carries a real vocabulary rather than a placeholder pair.
      expect(rendered, 'the dropdown carries a real vocabulary, not a token list').toBeGreaterThan(2)
    }
    await api?.dispose()
  })

  step('P5-S6', async ({ page, request }) => {
    // #62 has two halves and they fail differently — say which, or the record just reads
    // "no icon" and the next tick re-derives it (docs/decisions/0011).
    //
    // Half 1, the DATA (#83): verified working. ⚠️ The parameters are `object_type` /
    // `object_field`; sending `{object, field}` returns a 200 with an `{"error":"true"}` envelope
    // (docs/issues/0026) that reads exactly like a regression. It is not one.
    const api = await request
    const res = await api.post(`${FLOW_BASE}/stix-orm/utils/connections`, {
      data: { object_type: 'identity', object_field: 'created_by_ref' },
      timeout: 60_000,
    })
    const candidates = await res.json()
    expect(Array.isArray(candidates), `#83 returns a candidate list (saw: ${JSON.stringify(candidates).slice(0, 120)})`)
      .toBeTruthy()
    expect(candidates.length, '#83 returns candidates for identity.created_by_ref').toBeGreaterThan(0)
    for (const key of ['icon_url', 'heading', 'description', 'tooltip']) {
      expect(candidates[0][key], `#83 candidate carries ${key}`).toBeDefined()
    }
    observe(test.info(), 'pass', `#83 data half: ${candidates.length} candidates with icon/heading/description/tooltip`)

    // Half 2, the RENDERING (decision 0011 Option 1). The reason this half was dead was not the
    // Select component: `created_by_ref` was authored as a plain **text input**, so there was no
    // option list to render at all. It is now a Select pointed at the source above
    // (e2e/author-reference-options.mjs), and the component renders icon + heading + description
    // as DOM nodes — `allowHTML` stays `false`.
    //
    // ⚠️ Assert against the **Choices wrapper**, not the `<select>`. Choices hides the native
    // element and builds its own rows beside it, so `toBeVisible()` on the select fails and the
    // icons are never inside it.
    await openForm(page, IDENTITY_CREATE)
    const refSelect = page.locator('select[name$="_ref"]').first()
    await expect(refSelect, 'a reference field is present on the form').toBeAttached({ timeout: 20_000 })
    const refWidget = page.locator('.choices').filter({ has: refSelect })
    await expect(refWidget, 'the reference field is rendered as an option list').toBeVisible({ timeout: 20_000 })

    const rows = refWidget.locator('.choices__item--choice')
    await expect
      .poll(() => rows.count(), { timeout: 30_000, message: 'reference options load from the data source' })
      .toBeGreaterThan(0)

    const icons = await refWidget.locator('.choices__item--choice img').count()
    expect(icons, 'reference rows carry an icon (#62 rendering half — see decisions/0011)').toBeGreaterThan(0)

    // ⚠️ `toBeVisible()` is wrong here: the rows live in a closed dropdown, which is exactly how a
    // select should behave. Assert they are built and carry text, not that they are on screen.
    //
    // ⚠️ docs/issues/0156 — skip the placeholder row. Since that fix every single-value select opens
    // with an empty first row ("Select an item"), so `rows.first()` is no longer a candidate: it is
    // the empty state, and it legitimately has no heading, description or tooltip. A `_ref` picker
    // must not arrive with a reference already chosen any more than a vocab select must — before the
    // fix, `created_by_ref` was being silently set to an arbitrary identity on every create.
    //
    // This narrows the locator to the first REAL candidate rather than relaxing what is asserted of
    // it: the row must still carry icon, heading, description and tooltip.
    // Choices marks the empty row with `.choices__placeholder`, so exclude it by class rather than
    // by position. Asserted below: the surviving row must still carry icon, heading, description and
    // tooltip — the requirement is unchanged, only the row it is asked of.
    const firstRow = refWidget.locator('.choices__item--choice:not(.choices__placeholder)').first()
    await expect(firstRow.locator('strong'), 'a reference row shows a heading').toHaveText(/\S/)
    await expect(firstRow.locator('small'), 'a reference row shows a description').toHaveText(/\S/)
    await expect(firstRow, 'a reference row carries the full object as a tooltip').toHaveAttribute('title', /\S/)

    observe(test.info(), 'pass', `#62 rendering half: ${await rows.count()} rich rows, ${icons} with icons`)
  })

  step('P5-S7', async ({ page }) => {
    await openForm(page, IDENTITY_CREATE)

    // ⚠️ The previous version waited for `[name$="_refs"]` to become visible and could never pass.
    // The **only** `_refs`-suffixed field a create form renders is `template_object_marking_refs`,
    // and a template row is hidden by design — so the step failed on an element that is *supposed*
    // to be invisible, and "P5-S7 is unbuilt" was never actually established (docs/issues/0057).
    //
    // The authored design is a button that instantiates the template: a control titled
    // "Object Marking" emitting `add-optional-template-once-full-width` with config
    // `template_object_marking_refs`. So the list field is what that button *produces*.
    const addButton = page.locator('button[title="Object Marking"], button[data-label*="Object Marking" i]').first()
    await expect(addButton, 'the control that adds an object-marking row').toBeVisible({ timeout: 30_000 })

    const rows = () => page.locator('[name="object_marking_refs"], [name^="object_marking_refs"]:visible')
    const before = await rows().count()
    await addButton.click()
    await page.waitForTimeout(2_000)
    const after = await rows().count()
    observe(test.info(), after > before ? 'pass' : 'note', `object_marking_refs rows ${before} -> ${after}`)
    expect(after, `clicking "Object Marking" adds a row (${before} -> ${after})`).toBeGreaterThan(before)

    // …and the list must be **removable**, which is the other half of the runsheet's claim.
    //
    // ⚠️ Do NOT match remove controls page-wide. The form carries Choices.js multi-selects whose
    // "Remove item" buttons belong to `roles`, `sectors` and `identity_class` — a first version of
    // this assertion clicked one of those and read the unchanged row count as "remove is broken".
    // Scope the search to the row that was just added (docs/issues/0057).
    // Scope to the ROW, not the input's immediate parent. `addNewItem` appends the remove control
    // to the row root (the element it marks `state="new"`), several levels above the input — an
    // earlier version scoped to `ancestor::div[1]` and reported 0 controls against a working build.
    const addedRow = rows().last().locator('xpath=ancestor::*[@state="new"][1]')
    const rowRemove = addedRow.locator('.composite-remove-item, button[aria-label*="remove" i], [data-action="remove-item"]')
    const removeCount = await rowRemove.count().catch(() => 0)
    observe(test.info(), removeCount ? 'pass' : 'note', `remove controls scoped to the added row: ${removeCount}`)
    expect(removeCount, 'the added object_marking_refs row carries its own remove control').toBeGreaterThan(0)
    await rowRemove.first().click()
    await page.waitForTimeout(2_000)
    expect(await rows().count(), 'removing takes the row away again').toBe(before)
  })

  step('P5-S8', async ({ page }) => {
    const api = await request.newContext({ ignoreHTTPSErrors: true })

    // ⚠️ This used to look for junk in `overview-default-incident`. P5-S3 (above) establishes that
    // created objects land in **unattached** context — so a junk identity would appear exactly
    // where the old assertion never looked, and the step could not fail (docs/issues/0048).
    // `toBeLessThanOrEqual` also passed on a *decrease*.
    const unattachedCount = async () => {
      const res = await api.get(`${FLOW_BASE}/viz-data/unattached-split`, { timeout: 60_000 })
      if (!res.ok()) return -1
      const split = await res.json()
      return [...(split.scratch?.nodes ?? []), ...(split.promo?.nodes ?? [])].length
    }
    const before = await unattachedCount()

    await openForm(page, IDENTITY_CREATE)
    // Submit with the required name blank — the Make-Object API must reject it and the save leg
    // must be skipped, so no junk object appears.
    //
    // Guard the test itself, the way P1-S8 does: if the submit never fired, "nothing was written"
    // is true for the wrong reason — which is exactly how this step stayed green while the Create
    // button was inert (docs/issues/0038).
    let submitted = false
    page.on('request', (r) => { if (r.method() === 'POST' && /\/form\b|\/form\//.test(r.url())) submitted = true })
    await page.getByRole('button', { name: /save|create/i }).first().click()
    await expect
      .poll(() => submitted, { timeout: 30_000, message: 'the blank form was actually submitted' })
      .toBeTruthy()

    await page.waitForTimeout(8_000)
    const after = await unattachedCount()
    expect(after, 'no junk object was written to unattached context').toBe(before)
    await api.dispose()
  })
})
