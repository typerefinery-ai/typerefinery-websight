/**
 * P3-S6 / #23 — does Create SRO actually CREATE the relationship?
 *
 * The runsheet's Expected result says "the relationship is created across the two panes", but the
 * automated step only asserts the modal opens pre-filled with `related-to`. Those are different
 * claims, and docs/issues/0046 showed a wired form whose flow merely echoes the request.
 *
 * `sro-constraints` IS flow-wired (flowapi_httproute present), unlike foreign-key-connections, so
 * this may genuinely save. Measure rather than assume.
 */
import { chromium } from '@playwright/test'

const BASE = 'https://cms.typerefinery.localhost:8101'
const COMPOSER = `${BASE}/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html`
const FLOW = 'http://localhost:8111'

const snapshot = async (label) => {
  const j = await (await fetch(`${FLOW}/viz-data/unattached-split`)).json()
  const all = [...(j.promo?.nodes || []), ...(j.scratch?.nodes || [])]
  const rels = all.filter(n => String(n.id || '').startsWith('relationship--'))
  console.log(`  ${label}: ${all.length} objects, ${rels.length} relationships`)
  return { total: all.length, rels: rels.map(r => r.id) }
}

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()
const posts = []
page.on('response', async r => {
  if (r.request().method() === 'POST' && !/j_security_check|resolve-/.test(r.url())) {
    posts.push(`${r.status()} ${r.url().split('?')[0].slice(-60)} :: ${(await r.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 120)}`)
  }
})

await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
const u = page.locator('[data-testid="login-form-username"]')
if (await u.isVisible({ timeout: 20_000 }).catch(() => false)) {
  await u.click(); await u.pressSequentially('wsadmin', { delay: 30 })
  const p = page.locator('[data-testid="login-form-password"]')
  await p.click(); await p.pressSequentially('wsadmin', { delay: 30 })
  await page.locator('#login-form button[type="submit"]').click()
  await page.waitForURL(x => !/login\.html/.test(x.toString()), { timeout: 60_000 })
}

console.log('BEFORE:')
const before = await snapshot('before')

await page.goto(COMPOSER, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(12_000)

const wf = page.frameLocator('iframe[src*="widgetdevcomposer"], iframe[src*="4005"]').first()
const promo = wf.locator('svg.promo_svg').locator('image').first()
const scratch = wf.locator('svg.scratch_svg').locator('image').first()
await promo.waitFor({ state: 'visible', timeout: 60_000 })
await promo.click(); await page.waitForTimeout(800)
await scratch.click(); await page.waitForTimeout(800)
await scratch.click({ button: 'right' }); await page.waitForTimeout(1500)
await wf.locator('text=/create sro/i').first().click()
await page.waitForTimeout(8000)

// The modal mounts in its own frame; confirm it is pre-filled (what P3-S6 asserts today).
const modal = page.frameLocator('iframe[src*="sro-constraints"]').first()
const relatedVisible = await wf.getByText(/related-to/i).first().isVisible().catch(() => false)
console.log('modal shows related-to (what P3-S6 asserts):', relatedVisible)

// Now do the part P3-S6 never does: submit it.
const submit = page.getByRole('button', { name: /save changes|^save$|^create$|^ok$|apply/i }).first()
console.log('submit buttons on host:', await page.getByRole('button', { name: /save changes|^save$|^create$|^ok$|apply/i }).count())
await submit.click({ timeout: 15_000 }).catch(e => console.log('submit failed:', e.message.slice(0, 70)))
await page.waitForTimeout(12_000)

console.log('AFTER:')
const after = await snapshot('after')
console.log('\nPOST responses:'); for (const p of posts) console.log('  ', p)
const newRels = after.rels.filter(r => !before.rels.includes(r))
console.log(`\nnew relationships: ${newRels.length}`, newRels.slice(0, 3))
console.log(`RESULT: ${newRels.length > 0 ? 'CREATES the relationship ✅' : 'does NOT create a relationship ❌'}`)
await browser.close()
