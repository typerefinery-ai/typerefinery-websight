/** Probe the WebSight page editor: how components are marked, and what .action endpoints exist. */
import { chromium } from '@playwright/test'

const BASE = 'https://cms.typerefinery.localhost:8101'
const PAGE_PATH = '/content/typerefinery-showcase/pages/os-triage/pages/incidents'
const EDITOR = `${BASE}/apps/websight/index.html${PAGE_PATH}::editor`

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()

const actionUrls = new Set()
page.on('request', r => { const u = r.url(); if (u.includes('.action') || u.includes('/bin/')) actionUrls.add(`${r.method()} ${u.split('?')[0]}`) })

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
await page.waitForTimeout(10_000)

for (const f of page.frames()) {
  if (!f.url().includes('/content/')) continue
  console.log('=== content frame:', f.url().slice(0, 100))
  const info = await f.evaluate(() => {
    const attrs = new Set()
    document.querySelectorAll('*').forEach(el => {
      for (const a of el.attributes) if (/^data-/.test(a.name)) attrs.add(a.name)
    })
    const tableEls = [...document.querySelectorAll('table, [class*="table"], [id*="table"]')].slice(0, 6)
      .map(el => ({ tag: el.tagName, id: el.id, cls: (el.className || '').toString().slice(0, 70),
                    data: Object.fromEntries([...el.attributes].filter(a => /^data-/.test(a.name)).map(a => [a.name, a.value.slice(0, 90)])) }))
    return { dataAttrs: [...attrs].slice(0, 40), tableEls, bodyLen: document.body.innerHTML.length }
  }).catch(e => ({ err: e.message }))
  console.log(JSON.stringify(info, null, 1).slice(0, 2500))
}

console.log('=== action/bin endpoints seen:')
for (const u of actionUrls) console.log('  ', u)
await browser.close()
