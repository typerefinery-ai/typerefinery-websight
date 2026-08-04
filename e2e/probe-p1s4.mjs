/** P1-S4 triage: does Create -> Incident still open the modal now the table renders rows? */
import { chromium } from '@playwright/test'

const BASE = 'https://cms.typerefinery.localhost:8101'
const PAGE = `${BASE}/content/typerefinery-showcase/pages/os-triage/pages/incidents.html`
const WAIT = Number(process.argv[2] || 20000)   // settle time before interacting

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()
const logs = []
page.on('console', m => { const t = m.text(); if (/table|dropdown|modal|cold start/i.test(t)) logs.push(t.slice(0, 150)) })

await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
const u = page.locator('[data-testid="login-form-username"]')
if (await u.isVisible({ timeout: 20_000 }).catch(() => false)) {
  await u.click(); await u.pressSequentially('wsadmin', { delay: 30 })
  const p = page.locator('[data-testid="login-form-password"]')
  await p.click(); await p.pressSequentially('wsadmin', { delay: 30 })
  await page.locator('#login-form button[type="submit"]').click()
  await page.waitForURL(x => !/login\.html/.test(x.toString()), { timeout: 60_000 })
}
await page.goto(PAGE, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
console.log(`settling ${WAIT}ms before interacting...`)
await page.waitForTimeout(WAIT)

console.log('rows rendered:', await page.locator('tbody tr').count())

// 1. open the dropdown
await page.getByRole('button', { name: /create/i }).first().click()
await page.waitForTimeout(1500)
const items = page.locator('.dropdown-menu .dropdown-item')
console.log('dropdown items:', await items.count(), '->', (await items.allInnerTexts()).map(t => t.trim()).join(' | '))

// 2. choose Incident
const incident = items.filter({ hasText: /^\s*Incident\s*$/i }).first()
console.log('Incident item count:', await incident.count())
await incident.click({ timeout: 15_000 }).catch(e => console.log('click failed:', e.message.slice(0, 80)))
await page.waitForTimeout(6000)

// 3. did a modal appear?
const state = await page.evaluate(() => {
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
  const modals = [...document.querySelectorAll('.modal, [role="dialog"], [class*="modal"]')]
  return {
    modalTotal: modals.length,
    modalVisible: modals.filter(vis).length,
    modalClasses: modals.slice(0, 4).map(m => (m.className || '').toString().slice(0, 60)),
    iframes: [...document.querySelectorAll('iframe')].map(f => (f.getAttribute('src') || '').slice(-60)),
    dropdownOpen: !!document.querySelector('.dropdown-menu.show'),
  }
})
console.log('after click ->', JSON.stringify(state, null, 1))
console.log('=== console logs:'); for (const l of logs.slice(0, 14)) console.log('  ', l)
await page.screenshot({ path: `p1s4-probe-${WAIT}.png` })
await browser.close()
