/** P1-S1 — what does the Incidents table actually render on a cold start now? */
import { chromium } from '@playwright/test'

const BASE = 'https://cms.typerefinery.localhost:8101'
const PAGE = `${BASE}/content/typerefinery-showcase/pages/os-triage/pages/incidents.html`

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()

const logs = []
page.on('console', m => { const t = m.text(); if (/table|cold start|waiting|dataSource/i.test(t)) logs.push(t.slice(0, 220)) })

await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
const user = page.locator('[data-testid="login-form-username"]')
if (await user.isVisible({ timeout: 20_000 }).catch(() => false)) {
  await user.click(); await user.pressSequentially('wsadmin', { delay: 30 })
  const pw = page.locator('[data-testid="login-form-password"]')
  await pw.click(); await pw.pressSequentially('wsadmin', { delay: 30 })
  await page.locator('#login-form button[type="submit"]').click()
  await page.waitForURL(u => !/login\.html/.test(u.toString()), { timeout: 60_000 })
}

await page.goto(PAGE, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(15_000)

const dom = await page.evaluate(() => {
  const t = document.querySelector('table')
  const bt = document.querySelector('.bootstrap-table')
  const rows = [...document.querySelectorAll('tbody tr')].map(r => r.innerText.trim().slice(0, 80))
  const ths = [...document.querySelectorAll('thead th')].map(h => h.innerText.trim()).filter(Boolean)
  const r = t ? t.getBoundingClientRect() : null
  return {
    hasTable: !!t, hasBootstrapTable: !!bt,
    rect: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null,
    headers: ths, rowCount: rows.length, rows: rows.slice(0, 4),
    localStorageTableKeys: Object.keys(localStorage).filter(k => k.startsWith('table_')),
  }
})
console.log(JSON.stringify(dom, null, 1))
console.log('=== relevant console logs:')
for (const l of logs.slice(0, 12)) console.log('  ', l)
await page.screenshot({ path: 'p1s1-current.png', fullPage: false })
await browser.close()
