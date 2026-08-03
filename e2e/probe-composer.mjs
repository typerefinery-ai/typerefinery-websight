/** Probe the Composer page's frames so Acts 3 steps target the right pane. */
import { chromium } from '@playwright/test'

const BASE = process.env.CMS_BASE || 'http://localhost:8113'
const COMPOSER = '/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage()

await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 90000 })
if (page.url().includes('login')) {
  await page.locator('[data-testid="login-form-username"]').click()
  await page.locator('[data-testid="login-form-username"]').pressSequentially('wsadmin', { delay: 40 })
  await page.locator('[data-testid="login-form-password"]').click()
  await page.locator('[data-testid="login-form-password"]').pressSequentially('wsadmin', { delay: 40 })
  await page.locator('#login-form button[type="submit"]').click()
  await page.waitForURL((u) => !u.toString().includes('login'), { timeout: 60000 })
}

await page.goto(BASE + COMPOSER, { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForTimeout(25000)

console.log('iframes on page:', await page.locator('iframe').count())
for (const [i, f] of page.frames().entries()) {
  try {
    const info = await f.evaluate(() => ({
      title: document.title,
      heading: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 120),
      images: document.querySelectorAll('svg image').length,
      gnodes: document.querySelectorAll('svg g.node').length,
      svgs: document.querySelectorAll('svg').length,
      inputs: document.querySelectorAll('input,select,textarea').length,
    }))
    console.log(`frame[${i}] ${f.url().slice(0, 95)}`)
    console.log('   ', JSON.stringify(info))
  } catch (e) {
    console.log(`frame[${i}] ${f.url().slice(0, 60)} -> ${String(e).slice(0, 70)}`)
  }
}
await browser.close()
