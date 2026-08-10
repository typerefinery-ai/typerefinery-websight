import { expect } from '@playwright/test'
import { FLOW_BASE, SHOWCASE } from './playwright.config'

/**
 * Shared fixture helpers.
 *
 * docs/issues/0076 — the suite is **not repeatable**: it consumes Scratch objects and never replaces
 * them. P3-S6 reclassifies one into Promotable (docs/issues/0051) and P3-S8 deletes one by design, so
 * after enough runs the pane reaches zero and P3-S8 fails with an assertion that says nothing about
 * the real cause. Measured 2026-08-11 at promo 53 / scratch 0.
 *
 * Seeding uses the **same UI path P5-S3 exercises** rather than a direct API call. That is
 * deliberate: P5-S3 is the step that proves this path writes into Scratch, so a fixture built on it
 * cannot silently diverge from the behaviour the suite claims. A hand-rolled POST could write
 * something subtly different — and docs/issues/0075 is exactly what happens when a write bypasses the
 * checks the UI performs.
 */

const IDENTITY_CREATE = `${SHOWCASE}/forms/stixorm-forms/stix-forms/sdo-forms/identity-forms/identity-create.html`

export async function scratchCount(request: any): Promise<number> {
  const res = await request.get(`${FLOW_BASE}/viz-data/unattached-split`, { timeout: 60_000 })
  if (!res.ok()) return -1
  const j = await res.json().catch(() => ({} as any))
  return (j.scratch?.nodes ?? []).length
}

/**
 * Ensure Scratch holds at least `min` objects, creating identities through the create form until it
 * does. Returns the count it ended on.
 *
 * ⚠️ Creates real demo data — that is the point, but it also means this adds to the Promo/Scratch
 * totals over time, which is the other half of 0076.
 */
export async function ensureScratch(page: any, request: any, min = 2, maxAttempts = 3): Promise<number> {
  let count = await scratchCount(request)
  for (let i = 0; count >= 0 && count < min && i < maxAttempts; i++) {
    await page.goto(IDENTITY_CREATE, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
    await page.waitForTimeout(4_000)

    const name = page.locator('input[name="name"], input[name="name "]').first()
    if (!(await name.isVisible().catch(() => false))) break
    // Typed, not set programmatically — the same rule P0-S5 follows for the CMS login.
    await name.click()
    await name.pressSequentially(`Scratch fixture ${new Date().toISOString().slice(11, 19)}`, { delay: 20 })
    await page.getByRole('button', { name: /save|create/i }).first().click()
    await page.waitForTimeout(6_000)
    count = await scratchCount(request)
  }
  return count
}

/**
 * Assert the fixture Act 3's later steps depend on, and say so in terms of the fixture rather than
 * a bare locator timeout when it is missing.
 */
export async function requireScratch(request: any, stepId: string) {
  const count = await scratchCount(request)
  expect(
    count,
    `${stepId} needs a Scratch object and the pane holds ${count}. Act 3 drains Scratch as it runs ` +
      'and nothing replenishes it - docs/issues/0076. Seed it with ensureScratch(), or repopulate ' +
      'manually with:  playwright test --grep "P5-S3". This is a missing fixture, NOT a regression ' +
      'in this step.',
  ).toBeGreaterThan(0)
}
