/** P3-S4 triage: does right-click open the Copy menu on the Composer page, and on which node? */
import { chromium } from '@playwright/test'

const BASE = 'https://cms.typerefinery.localhost:8101'
const COMPOSER = `${BASE}/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html`

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()

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
const treeNodes = wf.locator('svg.tree_svg').locator('image, g.node, circle')
const n = await treeNodes.count()
console.log('tree pane node candidates:', n)

for (let i = 0; i < Math.min(n, 6); i++) {
  const el = treeNodes.nth(i)
  const box = await el.boundingBox().catch(() => null)
  const tag = await el.evaluate(e => e.tagName + ' ' + (e.getAttribute('class') || '') + ' | href=' + (e.getAttribute('href') || e.getAttribute('xlink:href') || '').slice(-28)).catch(() => '?')
  console.log(`  [${i}] ${tag} box=${box ? `${Math.round(box.width)}x${Math.round(box.height)}` : 'null'}`)
}

// Try right-click on each of the first few and see if a Copy menu item appears.
for (let i = 0; i < Math.min(n, 5); i++) {
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(500)
  const el = treeNodes.nth(i)
  await el.click({ button: 'right', timeout: 10_000 }).catch(e => console.log(`  [${i}] right-click failed: ${e.message.slice(0, 60)}`))
  await page.waitForTimeout(1500)
  const copyCount = await wf.getByText(/^\s*copy\s*$/i).count().catch(() => -1)
  const anyMenu = await wf.locator('[class*="menu"], [class*="context"]').count().catch(() => -1)
  console.log(`  [${i}] after right-click -> exact-Copy items: ${copyCount}, menu-ish elements: ${anyMenu}`)
  if (copyCount > 0) { console.log(`  >>> node ${i} DOES open the Copy menu`); break }
}

// What text is present in the widget frame at all?
const texts = await wf.locator('body').innerText().catch(() => '')
console.log('=== widget frame text (first 400):', texts.replace(/\s+/g, ' ').slice(0, 400))
await browser.close()
