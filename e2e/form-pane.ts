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
/**
 * Click the first node in a Composer pane that can **actually be clicked**, and return it.
 *
 * ⚠️ Not the same as `.first().click()`, and the difference is not cosmetic. The force simulation
 * settles nodes wherever it settles them, and one can end up outside the pane's viewport — measured
 * at `y = -46.68` (above) and `y = 386.6` (below) on a pane a few hundred pixels tall. Playwright
 * then retries the click for its full timeout and fails the step. Both P5-S4 and P3-S7 failed exactly
 * this way, and which node is affected changes run to run, so a step that clicks a fixed index is a
 * coin flip.
 *
 * A user is not blocked the same way — they can pan the canvas — so this is a harness concern, not a
 * reason to fail. Whether the panes *should* place nodes outside their bounds is
 * docs/issues/0065; the Overview asserts they do not (P2-S2), the Composer has no such check.
 *
 * Throws only if no candidate is clickable, so a genuine "nothing is reachable" still fails loudly.
 */
export async function clickAnyNode(nodes: Locator, opts: { candidates?: number; label?: string } = {}): Promise<Locator> {
  const count = await nodes.count()
  const limit = Math.min(count, opts.candidates ?? 8)
  const reasons: string[] = []

  for (let i = 0; i < limit; i++) {
    try {
      await nodes.nth(i).click({ timeout: 8_000 })
      return nodes.nth(i)
    } catch (error) {
      reasons.push(`${i}:${String(error).split('\n')[0].slice(0, 40)}`)
    }
  }
  throw new Error(
    `${opts.label ?? 'pane'}: none of the first ${limit} of ${count} node(s) could be clicked — ` +
      `they are probably outside the pane viewport (docs/issues/0065). Tried: ${reasons.join(' | ')}`,
  )
}

/**
 * @param opts.minFilledRatio require the candidate's form to be at least this proportion filled.
 *
 * ⚠️ docs/issues/0076 / docs/issues/0156. `isPopulated` asks the **product** question — did every
 * non-null key the object carries reach an input (`missing.length === 0`). It is satisfied by an
 * object that simply has very little in it, and the suite creates exactly those: P5-S3 saves an
 * object with only a name, and P5-S4 would then land on it and measure 4/14 fields filled.
 *
 * 🔑 That step used to pass **because the product was fabricating data** — before 0156 every Create
 * form silently set `identity_class`, `roles`, `sectors` and `created_by_ref` from the first
 * vocabulary entry, so a "blank" new object arrived with enough invented values to clear a majority.
 * Fixing the fabrication removed the padding and exposed that the ratio was never a product
 * assertion at all: it asks whether the *fixture* has substance.
 *
 * So the ratio belongs here, as a candidate gate — keep walking until a node whose form is
 * substantively filled is found — rather than as an assertion against whichever node the force
 * layout happened to put first. The step still fails when **no** candidate qualifies, and the skip
 * list says what each one was.
 */
export async function selectPopulatedNode(
  page: Page,
  nodes: Locator,
  opts: { candidates?: number; settleMs?: number; minFilledRatio?: number } = {},
): Promise<{ shape: FormShape | null; skipped: string[]; tried: number }> {
  const tried = Math.min(await nodes.count(), opts.candidates ?? 6)
  const settleMs = opts.settleMs ?? 20_000
  const minFilledRatio = opts.minFilledRatio ?? 0
  const skipped: string[] = []

  for (let i = 0; i < tried; i++) {
    // ⚠️ A node can be **un-clickable**, not just unpopulated: the force simulation places nodes at
    // whatever coordinates it settles on, and one can land outside the pane's viewport (P5-S4 failed
    // twice on a node at `y = -46.68`, with Playwright retrying for the full 30 s and reporting
    // "element is outside of the viewport").
    //
    // This loop already exists to try several candidates and record why each was rejected. An
    // un-clickable one should be another skip reason, not an exception that ends the step — the
    // previous behaviour made the whole test depend on where the simulation happened to drop node
    // zero. A user is not stuck the same way; they can pan the canvas.
    try {
      await nodes.nth(i).click({ timeout: 10_000 })
    } catch (error) {
      skipped.push(`node ${i}: not clickable (${String(error).split('\n')[0].slice(0, 60)})`)
      continue
    }
    let s: FormShape | null = null
    for (let waited = 0; waited < settleMs; waited += 1_000) {
      s = await measureFormPane(page)
      if (isPopulated(s)) break
      await page.waitForTimeout(1_000)
    }
    if (isPopulated(s)) {
      const ratio = s.total > 0 ? s.filled / s.total : 0
      if (ratio >= minFilledRatio) return { shape: s, skipped, tried }
      // Populated in the product sense (nothing the object carries is missing) but too sparse to
      // demonstrate pre-fill — typically an object the suite itself just created with one field.
      skipped.push(`${s.frame}:${s.filled}/${s.total} filled (below ${minFilledRatio})`)
      continue
    }
    skipped.push(`${s?.frame ?? '(no form frame)'}:${s?.total ?? 0} inputs`)
  }
  return { shape: null, skipped, tried }
}
