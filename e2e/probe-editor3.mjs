/** Open the table component's dialog in the WebSight editor and capture the save request. */
import { chromium } from '@playwright/test'

const BASE = 'https://cms.typerefinery.localhost:8101'
const PAGE_PATH = '/content/typerefinery-showcase/pages/os-triage/pages/incidents'
const EDITOR = `${BASE}/apps/websight/index.html${PAGE_PATH}::editor`
const VALUE = 'https://flow.typerefinery.localhost:8101/viz-data/table-all-incidents-shaped'

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()

const mut = []
page.on('request', r => { if (r.method() !== 'GET') mut.push({ m: r.method(), u: r.url().split('?')[0], b: (r.postData() || '').slice(0, 400) }) })

await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
const user = page.locator('[data-testid="login-form-username"]')
if (await user.isVisible({ timeout: 20_000 }).catch(() => false)) {
  await user.click(); await user.pressSequentially('wsadmin', { delay: 30 })
  const pw = page.locator('[data-testid="login-form-password"]')
  await pw.click(); await pw.pressSequentially('wsadmin', { delay: 30 })
  await page.locator('#login-form button[type="submit"]').click()
  await page.waitForURL(u => !/login\.html/.test(u.toString()), { timeout: 60_000 })
}
await page.goto(EDITOR, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(12_000)

// Locate the iframe element in the parent, and the table's rect inside it, then click in page coords.
const iframeBox = await page.locator('iframe').first().boundingBox()
const cf = page.frames().find(f => f.url().includes('/content/') && f.url().includes('incidents'))
const rect = await cf.evaluate(() => {
  const el = document.querySelector('.bootstrap-table') || document.querySelector('table')
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.x, y: r.y, w: r.width, h: r.height, scrollY: window.scrollY }
})
console.log('iframeBox:', JSON.stringify(iframeBox), '\nrect in frame:', JSON.stringify(rect))
if (!rect || !iframeBox) { console.log('cannot locate table'); await browser.close(); process.exit(0) }

const x = iframeBox.x + rect.x + Math.min(rect.w / 2, 300)
const y = iframeBox.y + rect.y + 20
console.log('clicking page coords', x.toFixed(0), y.toFixed(0))

await page.mouse.click(x, y)
await page.waitForTimeout(2500)
await page.screenshot({ path: 'probe3-click.png' })
await page.mouse.dblclick(x, y)
await page.waitForTimeout(6000)
await page.screenshot({ path: 'probe3-dblclick.png' })

const state = await page.evaluate(() => ({
  names: [...document.querySelectorAll('input[name],textarea[name],select[name]')].map(i => i.getAttribute('name')).slice(0, 50),
  dialogs: [...document.querySelectorAll('[role="dialog"],[class*="modal"]')].length,
  headings: [...document.querySelectorAll('h1,h2,h3,[class*="title"]')].map(h => (h.textContent || '').trim().slice(0, 40)).filter(Boolean).slice(0, 15),
}))
console.log('state:', JSON.stringify(state).slice(0, 1500))

const field = page.locator('input[name="coldStartDataSource"]').first()
if (await field.count()) {
  console.log('>>> field present, filling')
  await field.click(); await field.fill('')
  await field.pressSequentially(VALUE, { delay: 8 })
  const save = page.locator('button:has-text("Save"), button:has-text("Apply")').last()
  console.log('save buttons:', await page.locator('button:has-text("Save"), button:has-text("Apply")').count())
  await save.click({ timeout: 15_000 }).catch(e => console.log('save failed:', e.message))
  await page.waitForTimeout(6000)
  await page.screenshot({ path: 'probe3-saved.png' })
}

console.log('=== mutating requests:')
for (const c of mut) console.log(`  ${c.m} ${c.u}\n     ${c.b.slice(0, 250)}`)
await browser.close()
