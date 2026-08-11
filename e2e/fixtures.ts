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

const TASK_CREATE = `${SHOWCASE}/forms/stixorm-forms/stix-forms/sdo-forms/task-forms/task-create.html`

/** The types the Composer treats as promotable (panel.promo.js / decisions 0007, 0010). */
const PROMOTABLE = ['task', 'impact', 'event', 'sighting', 'attack-flow', 'x-oca-behavior']

/** Ids of promotable objects currently in unattached context, across both panes. */
export async function promotableIds(request: any): Promise<string[]> {
  const res = await request.get(`${FLOW_BASE}/viz-data/unattached-split`, { timeout: 60_000 })
  if (!res.ok()) return []
  const j = await res.json().catch(() => ({} as any))
  const all = [...(j.promo?.nodes ?? []), ...(j.scratch?.nodes ?? [])]
  return all.filter((n: any) => PROMOTABLE.includes(n?.type)).map((n: any) => n.id)
}

/**
 * Ensure at least one promotable object exists that this run created, and return its id.
 *
 * docs/issues/0086. A step that promotes **consumes** its fixture, and promotion takes the target
 * *and its sub-graph* — measured at ~9 objects (docs/issues/0087). Measured 2026-08-11 there are only
 * **3** promotable objects in the whole unattached context, so a consuming step would exhaust them in
 * three runs. Seed rather than borrow.
 *
 * 🔑 Seeding also makes the assertion exact. A freshly created task has **no references**, so its
 * sub-graph is itself and promoting it should remove exactly **one** object — which is why 0087's
 * "do not assert a count" caveat does not apply to a seeded object.
 *
 * Uses the same create-form path as `ensureScratch`, for the same reason: the UI path is the one the
 * suite proves works, so the fixture cannot silently diverge from it.
 */
export async function ensurePromotable(page: any, request: any): Promise<string | null> {
  const before = new Set(await promotableIds(request))

  await page.goto(TASK_CREATE, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(4_000)

  const name = page.locator('input[name="name"], input[name="name "]').first()
  if (!(await name.isVisible().catch(() => false))) return null
  // Typed, not set programmatically — the same rule P0-S5 follows for the CMS login.
  await name.click()
  await name.pressSequentially(`Promote fixture ${new Date().toISOString().slice(11, 19)}`, { delay: 20 })
  await page.getByRole('button', { name: /save|create/i }).first().click()
  await page.waitForTimeout(6_000)

  const after = await promotableIds(request)
  const fresh = after.filter((id) => !before.has(id))
  // Return only an id THIS call created, so a step promoting it cannot eat demo data by accident.
  return fresh[0] ?? null
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

/**
 * Find a source/target pair the connection-types oracle actually approves.
 *
 * docs/issues/0077 — P3-S7 skipped more often than it asserted (6 of 10 runs), because whatever
 * `selectAcrossPanes` happened to click usually had no valid connection field between the two
 * objects. Measured 2026-08-11: of 24 arbitrary pairs, **3 (13%)** offered a field — and every
 * viable one had an **identity** target. So random selection cannot cover #24's completion leg.
 *
 * This asks the same endpoint the modal's field list comes from and returns EVERY pair it approves,
 * best-first, so the caller can try the next one when a node turns out to be unclickable.
 *
 * ⚠️ Returning only the first was not enough. Measured 2026-08-11: a chosen node was overlapped by
 * another in the same pane —
 *     <image id="email-addr--b0708db8…"> intercepts pointer events
 * — so the click timed out even though the element was "visible, enabled and stable". The old
 * random selection never hit this because clickAnyNode simply skipped past unclickable candidates;
 * selecting a SPECIFIC node removed that escape hatch. Hence a list.
 */
export async function choosePairWithConnectionField(
  request: any,
  maxProbes = 30,
  wanted = 4,
): Promise<Array<{ sourceId: string; targetId: string; fields: string[] }>> {
  const res = await request.get(`${FLOW_BASE}/viz-data/unattached-split`, { timeout: 60_000 })
  if (!res.ok()) return []
  const j = await res.json().catch(() => ({} as any))
  const nodes = [...(j.promo?.nodes ?? []), ...(j.scratch?.nodes ?? [])].filter((n: any) => n && n.original)

  // Identity targets are the ones that ever work, so try them first rather than burning probes.
  const targets = nodes.filter((n: any) => String(n.id).startsWith('identity--'))
  const sources = nodes.filter((n: any) => !String(n.id).startsWith('identity--'))
  let probes = 0
  const found: Array<{ sourceId: string; targetId: string; fields: string[] }> = []

  for (const target of targets) {
    for (const source of sources) {
      if (source.id === target.id || probes >= maxProbes) continue
      probes++
      const r = await request.post(`${FLOW_BASE}/os-triage/rmb-force/get-connection-types`, {
        data: { source: source.original, target: target.original },
        timeout: 30_000,
      })
      if (!r.ok()) continue
      const body = await r.json().catch(() => ({} as any))
      const fields = Array.isArray(body.connection_field_list) ? body.connection_field_list : []
      if (fields.length) {
        found.push({ sourceId: source.id, targetId: target.id, fields })
        if (found.length >= wanted) return found
      }
    }
  }
  return found
}
