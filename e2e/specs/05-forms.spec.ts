import { expect, request } from '@playwright/test'
import { step, test, observe } from '../runsheet'
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

    // The frame mounts *before* the host posts FORM_LOAD, and the empty form already ships two
    // non-blank constants (`type`, `spec_version`) plus `{}` composite placeholders. So a
    // "filled > 0" gate is satisfied instantly by the empty state and this measured 2/18 against
    // a form that populated correctly a moment later. Gate on a value only the payload can
    // supply — the STIX `id` — and only then take the ratio.
    const measure = async () => {
      for (const f of page.frames()) {
        const url = f.url()
        if (!/stixorm-forms|forms\//.test(url) || /\/default(\.html)?$/.test(url)) continue
        const shape = await f
          .locator('input')
          .evaluateAll((els: HTMLInputElement[]) => {
            // Choices.js clones a `search_terms` input per wrapped select; those are chrome,
            // never data, and counting them drags the ratio down on a perfectly good form.
            const visible = els.filter(
              (e) => e.type !== 'hidden' && !e.className.includes('choices__input'),
            )
            const val = (name: string) =>
              visible.find((e) => e.getAttribute('name') === name)?.value.trim() ?? ''
            // `{}` and `{"name":"","roles":null,…}` are the *empty* composite state, so they
            // must not count as pre-filled — that is what made the empty form look half-full.
            const isData = (e: HTMLInputElement) => {
              const v = e.value.trim()
              return v !== '' && v !== '{}' && !/^\{("[a-z_]+":(""|null),?)+\}$/.test(v)
            }
            // The row's real claim is "every field **the payload carries**". The payload is
            // right there in the `object` / `base_required` composites, so compare the two:
            // any key with a non-null value must have reached its own input.
            const missing: string[] = []
            for (const composite of ['base_required', 'object']) {
              let parsed: Record<string, unknown> = {}
              try {
                parsed = JSON.parse(val(composite) || '{}')
              } catch {
                /* not ready yet */
              }
              for (const [k, v] of Object.entries(parsed)) {
                if (v === null || v === '' || typeof v === 'object') continue
                if (visible.some((e) => e.getAttribute('name') === k) && val(k) === '') missing.push(k)
              }
            }
            return {
              filled: visible.filter(isData).length,
              total: visible.length,
              blanks: visible.filter((e) => !isData(e)).map((e) => e.getAttribute('name') || '?').slice(0, 8),
              id: val('id'),
              created: val('created'),
              modified: val('modified'),
              missing,
            }
          })
          .catch(() => null)
        if (shape && shape.total > 0) return { ...shape, frame: url.split('/').pop() }
      }
      return null
    }

    // ⚠️ Do **not** just click the first promo node. The pane's ordering varies between runs, and
    // some object families open an Update form that renders **zero inputs** — `anecdote-update.html`
    // was measured empty on 2026-08-04, the same shape as docs/issues/0049. Clicking blind made this
    // step alternate between a real assertion and a vacuous one. Walk the pane until a node opens a
    // form that actually carries the object, and record the empty ones as evidence for 0049.
    const STIX_ID = /^[a-z-]+--[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    const empties: string[] = []
    let shape: Awaited<ReturnType<typeof measure>> = null
    const candidates = Math.min(await nodes.count(), 6)
    for (let i = 0; i < candidates; i++) {
      await nodes.nth(i).click()
      // The frame mounts before FORM_LOAD arrives and the composites distribute into their child
      // inputs after `base_required` lands, so wait for the settled state rather than sampling once.
      // A miss here is not a failure — it means this node's family has no usable Update form, which
      // is the thing worth recording.
      let s: typeof shape = null
      for (let waited = 0; waited < 20_000; waited += 1_000) {
        s = await measure()
        if (s && STIX_ID.test(s.id) && s.missing.length === 0) break
        await page.waitForTimeout(1_000)
      }
      if (s && STIX_ID.test(s.id) && s.missing.length === 0) {
        shape = s
        break
      }
      empties.push(`${s?.frame ?? '(no form frame)'}:${s?.total ?? 0} inputs`)
    }
    if (empties.length) {
      observe(test.info(), 'note', `Update forms that opened without the object: ${empties.join(', ')}`)
    }
    expect(shape, `a promo node opened a populated Update form (tried ${candidates}: ${empties.join(', ') || 'none empty'})`)
      .not.toBeNull()
    shape = shape!
    observe(
      test.info(),
      'note',
      `Update form pre-filled ${shape.filled}/${shape.total} fields for ${shape.id}; blank: ${shape.blanks.join(', ') || '(none)'}`,
    )
    expect(shape.total, 'the Update form rendered its fields').toBeGreaterThan(5)
    // The identifying fields must all come from the object, not from form defaults.
    expect(shape.created, 'created is pre-filled from the object').toBeTruthy()
    expect(shape.modified, 'modified is pre-filled from the object').toBeTruthy()
    // Blanks are legitimate where the object has no value for that property (`created_by_ref`,
    // the `{}` extension composites), so the ratio is a majority check rather than 100% — the
    // `missing` poll above is what enforces the "every field" half.
    expect(shape.filled / shape.total, `most fields pre-filled (${shape.filled}/${shape.total})`)
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
