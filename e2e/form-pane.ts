import type { Frame, Locator, Page } from '@playwright/test'

/**
 * Shared measurement for "an Update form opened **populated**" — the claim P3-S5 and P5-S4 both
 * make, and which both used to under-test.
 *
 * Why this is not a one-liner:
 *
 * 1. **The empty form is not blank.** A form that has received nothing still ships the constants
 *    `type` and `spec_version` plus `{}` composite placeholders, so `values.length > 0` is true
 *    before any object is selected. P5-S4 measured 2/18 that way against a form that populated
 *    correctly a moment later.
 * 2. **The frame mounts before the payload arrives.** The host posts `FORM_LOAD` into the embed
 *    iframe, and the composites distribute into their child inputs *after* `base_required` lands.
 *    So readiness must be polled on a value only the payload can supply — the STIX `id`.
 * 3. **Not every object has a form.** Objects in the `os-threat` / `attack` / `oca` families route
 *    to a 404 page that renders zero inputs (docs/issues/0049), so "click the first node" makes a
 *    step alternate between a real assertion and a vacuous one as pane ordering varies.
 */

export const STIX_ID = /^[a-z-]+--[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export type FormShape = {
  frame: string
  filled: number
  total: number
  blanks: string[]
  missing: string[]
  id: string
  created: string
  modified: string
}

/** True once the form carries the selected object, not merely its own defaults. */
export const isPopulated = (s: FormShape | null): s is FormShape =>
  !!s && STIX_ID.test(s.id) && s.missing.length === 0

function isFormFrame(f: Frame) {
  const url = f.url()
  return /stixorm-forms|forms\//.test(url) && !/\/default(\.html)?$/.test(url)
}

/** Measure whichever form frame is currently mounted, or null if none carries fields yet. */
export async function measureFormPane(page: Page): Promise<FormShape | null> {
  for (const f of page.frames()) {
    if (!isFormFrame(f)) continue
    const shape = await f
      .locator('input')
      .evaluateAll((els: HTMLInputElement[]) => {
        // Choices.js clones a `search_terms` input per wrapped select; those are chrome, never
        // data, and counting them drags the ratio down on a perfectly good form.
        const visible = els.filter(
          (e) => e.type !== 'hidden' && !e.className.includes('choices__input'),
        )
        const val = (name: string) =>
          visible.find((e) => e.getAttribute('name') === name)?.value.trim() ?? ''
        // `{}` and `{"name":"","roles":null,…}` are the *empty* composite state, so they must not
        // count as pre-filled — that is what made the empty form look half-full.
        const isData = (e: HTMLInputElement) => {
          const v = e.value.trim()
          return v !== '' && v !== '{}' && !/^\{("[a-z_]+":(""|null),?)+\}$/.test(v)
        }
        // The real claim is "every field **the payload carries**". The payload is right there in
        // the composites, so compare the two: any key with a non-null scalar value must have
        // reached its own input.
        const missing: string[] = []
        for (const composite of ['base_required', 'object']) {
          let parsed: Record<string, unknown> = {}
          try {
            parsed = JSON.parse(val(composite) || '{}')
          } catch {
            /* not distributed yet */
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
          missing,
          id: val('id'),
          created: val('created'),
          modified: val('modified'),
        }
      })
      .catch(() => null)
    if (shape && shape.total > 0) return { ...shape, frame: f.url().split('/').pop() || '?' }
  }
  return null
}

/**
 * Left-select nodes until one opens a form that actually carries its object.
 *
 * Returns the populated shape (or null if none did) alongside `skipped` — the frames that opened
 * without the object, which is the evidence for docs/issues/0049 and belongs in the run log.
 */
export async function selectPopulatedNode(
  page: Page,
  nodes: Locator,
  opts: { candidates?: number; settleMs?: number } = {},
): Promise<{ shape: FormShape | null; skipped: string[]; tried: number }> {
  const tried = Math.min(await nodes.count(), opts.candidates ?? 6)
  const settleMs = opts.settleMs ?? 20_000
  const skipped: string[] = []

  for (let i = 0; i < tried; i++) {
    await nodes.nth(i).click()
    let s: FormShape | null = null
    for (let waited = 0; waited < settleMs; waited += 1_000) {
      s = await measureFormPane(page)
      if (isPopulated(s)) break
      await page.waitForTimeout(1_000)
    }
    if (isPopulated(s)) return { shape: s, skipped, tried }
    skipped.push(`${s?.frame ?? '(no form frame)'}:${s?.total ?? 0} inputs`)
  }
  return { shape: null, skipped, tried }
}
