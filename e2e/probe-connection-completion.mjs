/**
 * #24 completion leg — after choosing a connection type, does the Object Update form open with the
 * source id filled into that field?
 *
 * P3-S7 already covers the modal opening pre-filled. This exercises the half that never has been:
 * pick a field in the Connection Field List, submit, and see what happens.
 *
 * Expectation from docs/issues/0035: the foreign-key-connections modal has no `_events_` mapping, so
 * neither success nor failure reaches it. Confirming that is the point.
 */
import { chromium } from '@playwright/test'

const BASE = 'https://cms.typerefinery.localhost:8101'
const COMPOSER = `${BASE}/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html`

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()

const posts = []
page.on('response', async r => {
  if (r.request().method() === 'POST' && !/j_security_check/.test(r.url())) {
    posts.push(`${r.status()} ${r.url().split('?')[0].slice(-64)}`)
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
await page.goto(COMPOSER, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(12_000)

const wf = page.frameLocator('iframe[src*="widgetdevcomposer"], iframe[src*="4005"]').first()
// Selection order decides source/target, so pick Promo first then Scratch (as P3-S6/S7 do).
const promo = wf.locator('svg.promo_svg').locator('image').first()
const scratch = wf.locator('svg.scratch_svg').locator('image').first()
await promo.waitFor({ state: 'visible', timeout: 60_000 })
await promo.click()
await page.waitForTimeout(800)
await scratch.click()
await page.waitForTimeout(800)
await scratch.click({ button: 'right' })
await page.waitForTimeout(1500)

const menuItems = await wf.locator('text=/create connection/i').count()
console.log('menu "Create Connection" items:', menuItems)
if (!menuItems) { console.log('RESULT: menu item not found'); await browser.close(); process.exit(0) }
await wf.locator('text=/create connection/i').first().click()
await page.waitForTimeout(8000)

// The modal mounts in its own frame.
const modal = page.frameLocator('iframe[src*="foreign-key-connections"]').first()
const framesNow = page.frames().map(f => f.url().slice(-52))
console.log('frames:', JSON.stringify(framesNow, null, 0).slice(0, 400))

// Choices.js empties the native <select>, so count .choices__item
let opts = 0
for (let i = 0; i < 10; i++) {
  opts = await modal.locator('.choices__item').count().catch(() => 0)
  if (opts > 0) break
  await page.waitForTimeout(1500)
}
console.log('connection field options (.choices__item):', opts)
const labels = await modal.locator('.choices__item').allInnerTexts().catch(() => [])
console.log('options:', labels.map(s => s.trim()).filter(Boolean).slice(0, 8).join(' | '))

if (opts > 0) {
  // Open the dropdown and choose a field.
  await modal.locator('.choices').first().click().catch(e => console.log('open dropdown failed:', e.message.slice(0, 60)))
  await page.waitForTimeout(1200)
  const choice = modal.locator('.choices__list--dropdown .choices__item').first()
  const chosen = await choice.innerText().catch(() => '?')
  await choice.click().catch(e => console.log('choose failed:', e.message.slice(0, 60)))
  console.log('chose field:', chosen.trim())
  await page.waitForTimeout(2000)

  // Submit — modal chrome buttons live on the host page.
  const submit = page.getByRole('button', { name: /save changes|^save$|^create$|^ok$|apply/i }).first()
  console.log('submit buttons on host:', await page.getByRole('button', { name: /save changes|^save$|^create$|^ok$|apply/i }).count())
  await submit.click({ timeout: 15_000 }).catch(e => console.log('submit failed:', e.message.slice(0, 70)))
  await page.waitForTimeout(10_000)
}

const after = await page.evaluate(() => ({
  frames: [...document.querySelectorAll('iframe')].map(f => (f.getAttribute('src') || '').slice(-56)),
  visibleModals: [...document.querySelectorAll('.modal')].filter(m => m.getBoundingClientRect().width > 0).length,
}))
console.log('AFTER submit ->', JSON.stringify(after, null, 1))
console.log('POST responses seen:'); for (const p of posts) console.log('  ', p)
await page.screenshot({ path: 'connection-completion.png' })
await browser.close()
