/** Is the Create Connection "Connection Field List" genuinely empty, and why? */
import { chromium } from '@playwright/test'
const BASE = process.env.CMS_BASE || 'http://localhost:8113'
const COMPOSER = '/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: {width:1600,height:1000} })
const page = await ctx.newPage()
const netErr = [], consoleErr = [], reqs = []
page.on('console', m => { if (/ensureInstance|setValue|setChoices|select init|connection_field|getOptionsFromDataSource/i.test(m.text()) || m.type()==='error') consoleErr.push(m.type()+': '+m.text().slice(0,300)) })
page.on('pageerror', e => consoleErr.push('pageerror: '+String(e).slice(0,200)))
page.on('requestfailed', r => netErr.push(`${r.method()} ${r.url().slice(0,120)} -> ${r.failure()?.errorText}`))
page.on('response', async r => { const u=r.url(); if (/connection|refs|find|vocab|stix-orm/i.test(u)) reqs.push(`${r.status()} ${u.slice(0,140)}`) })

await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 90000 })
if (page.url().includes('login')) {
  await page.locator('[data-testid="login-form-username"]').click()
  await page.locator('[data-testid="login-form-username"]').pressSequentially('wsadmin', { delay: 40 })
  await page.locator('[data-testid="login-form-password"]').click()
  await page.locator('[data-testid="login-form-password"]').pressSequentially('wsadmin', { delay: 40 })
  await page.locator('#login-form button[type="submit"]').click()
  await page.waitForURL(u => !u.toString().includes('login'), { timeout: 60000 })
}
await page.goto(BASE + COMPOSER, { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForTimeout(25000)
const w = page.frameLocator('iframe[src*="widgetdevcomposer"]').first()
await w.locator('svg.promo_svg').locator('image, g.node').first().click(); await page.waitForTimeout(1200)
const scr = w.locator('svg.scratch_svg').locator('image, g.node').first()
await scr.click(); await page.waitForTimeout(1200)
await scr.click({ button: 'right' }); await page.waitForTimeout(2500)
await w.getByText(/create connection/i).first().click()
await page.waitForTimeout(14000)

const mf = page.frames().find(f => /modal-forms/.test(f.url()))
console.log('modal frame:', mf ? mf.url() : 'NOT FOUND')
if (mf) {
  console.log(JSON.stringify(await mf.evaluate(() => {
    const sels = Array.from(document.querySelectorAll('select')).map(s => ({
      name: s.name, id: s.id, cls: s.className, optionCount: s.options.length,
      options: Array.from(s.options).slice(0,10).map(o => o.text),
      outer: s.outerHTML.replace(/\s+/g,' ').slice(0,200),
    }))
    const inputs = Array.from(document.querySelectorAll('input')).map(i => ({ name: i.name, value: i.value.slice(0,60) }))
    const choicesItems = Array.from(document.querySelectorAll('.choices__item')).map(e => e.textContent.trim()).slice(0,10)
    const choicesLists = document.querySelectorAll('.choices__list').length
    return { sels, inputs, choicesItems, choicesLists, bodyLen: document.body.innerHTML.length }
  }), null, 1))
}
console.log('--- relevant responses:'); console.log(reqs.slice(0,25).join('\n') || '(none)')
console.log('--- failed requests:'); console.log(netErr.slice(0,15).join('\n') || '(none)')
console.log('--- console errors:'); console.log(consoleErr.slice(0,60).join('\n') || '(none)')
await browser.close()
