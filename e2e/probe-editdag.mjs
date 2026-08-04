/**
 * #26 — Tree RMB "Edit DAG": does choosing it put the DAG into the force graph?
 *
 * Criterion (issue #26): "Selecting the menu option causes the DAG to appear in the force graph."
 * Route exists in the runtime: POST /os-triage/rmb-tree/edit-DAG--to-unattached
 *
 * Right-clicks the node **icon**, not the row group — only the icon carries the menu handler
 * (docs/issues/0043).
 */
import { chromium } from '@playwright/test'

const BASE = 'https://cms.typerefinery.localhost:8101'
const COMPOSER = `${BASE}/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html`
const FLOW = 'http://localhost:8111'

const count = async (label) => {
  const r = await fetch(`${FLOW}/viz-data/unattached-split`)
  const j = await r.json()
  const promo = (j.promo?.nodes || []).length
  const scratch = (j.scratch?.nodes || []).length
  console.log(`  ${label}: promo=${promo} scratch=${scratch} total=${promo + scratch}`)
  return { promo, scratch, total: promo + scratch }
}

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()

const posts = []
page.on('request', r => { if (r.method() === 'POST' && /rmb-tree|edit-DAG/i.test(r.url())) posts.push(r.url()) })
page.on('response', async r => {
  if (r.request().method() === 'POST' && /edit-DAG/i.test(r.url())) {
    console.log('  >>> edit-DAG response:', r.status(), (await r.text().catch(() => '')).slice(0, 200))
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

console.log('unattached BEFORE:')
const before = await count('before')

await page.goto(COMPOSER, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(12_000)

const wf = page.frameLocator('iframe[src*="widgetdevcomposer"], iframe[src*="4005"]').first()
const icon = wf.locator('svg.tree_svg').locator('image').first()
await icon.waitFor({ state: 'visible', timeout: 60_000 })
await icon.click({ button: 'right' })
await page.waitForTimeout(1500)

const items = await wf.locator('text=/edit dag/i').count()
console.log('menu "Edit DAG" items visible:', items)
if (!items) { console.log('RESULT: menu item not found'); await browser.close(); process.exit(0) }

await wf.locator('text=/edit dag/i').first().click()
await page.waitForTimeout(12_000)

console.log('unattached AFTER:')
const after = await count('after')
console.log('POSTs seen:', posts.length ? posts.join(', ') : '(none)')
console.log(`DELTA total: ${after.total - before.total}`)
await page.screenshot({ path: 'editdag-after.png' })
await browser.close()
