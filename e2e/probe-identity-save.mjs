/** docs/issues/0038 — verify the fix: does Create now submit and land in unattached context? */
import { chromium } from '@playwright/test'

const BASE = process.env.CMS_BASE || 'http://localhost:8113'
const FLOW = process.env.FLOW_BASE || 'http://localhost:8111'
const FORM = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms/identity-forms/identity-create.html'
const probeName = `Probe identity 0038 ${new Date().toISOString().slice(11, 19)}`

const split = async () => (await (await fetch(`${FLOW}/viz-data/unattached-split`)).json())
const nodes = (s, k) => (s[k] && s[k].nodes) || []
const count = (s) => ({ scratch: nodes(s, 'scratch').length, promo: nodes(s, 'promo').length })

const before = count(await split())
console.log('BEFORE', JSON.stringify(before))

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await (await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 } })).newPage()
page.on('console', (m) => { if (/associated with form|will not submit|inside its form|form submit event|configured/i.test(m.text())) console.log('  console:', m.text().slice(0, 170)) })
page.on('request', (r) => { if (r.method() === 'POST' && !/security_check|resolve-/.test(r.url())) console.log('  POST →', r.url().slice(0, 125)) })
page.on('response', async (r) => {
  if (r.request().method() === 'POST' && !/security_check|resolve-/.test(r.url())) {
    let b = ''; try { b = (await r.text()).slice(0, 200) } catch {}
    console.log(`  RESPONSE ${r.status()} :: ${b.replace(/\s+/g, ' ')}`)
  }
})

await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 90000 })
if (page.url().includes('login')) {
  for (const [sel, val] of [['[data-testid="login-form-username"]', 'wsadmin'], ['[data-testid="login-form-password"]', 'wsadmin']]) {
    await page.locator(sel).click(); await page.locator(sel).pressSequentially(val, { delay: 40 })
  }
  await page.locator('#login-form button[type="submit"]').click()
  await page.waitForURL((u) => !u.toString().includes('login'), { timeout: 60000 })
}
await page.goto(BASE + FORM, { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForTimeout(6000)

const name = page.locator('input[name="name"], input[name="name "]').first()
await name.click(); await name.pressSequentially(probeName, { delay: 20 })
console.log(`--- clicking Create (name="${probeName}")`)
await page.getByRole('button', { name: /save|create/i }).first().click()
await page.waitForTimeout(12000)

const after = count(await split())
const all = await split()
const landed = [...nodes(all, 'scratch'), ...nodes(all, 'promo')].some((n) => JSON.stringify(n).includes(probeName))
console.log('AFTER ', JSON.stringify(after))
console.log(`RESULT: object landed = ${landed}  (scratch ${before.scratch}→${after.scratch}, promo ${before.promo}→${after.promo})`)
await browser.close()
