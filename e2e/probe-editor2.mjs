/** Click the table component in the editor and find how its dialog is opened. */
import { chromium } from '@playwright/test'

const BASE = 'https://cms.typerefinery.localhost:8101'
const PAGE_PATH = '/content/typerefinery-showcase/pages/os-triage/pages/incidents'
const EDITOR = `${BASE}/apps/websight/index.html${PAGE_PATH}::editor`

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()

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

const cf = page.frames().find(f => f.url().includes('/content/') && f.url().includes('incidents'))
console.log('content frame:', !!cf)

// Where is the table on screen?
const box = await cf.locator('table').first().boundingBox().catch(() => null)
console.log('table box:', JSON.stringify(box))

// Editor overlays live in the PARENT document; click through at the table's position.
if (box) {
  const x = box.x + box.width / 2, y = box.y + Math.min(40, box.height / 2)
  await page.mouse.click(x, y)
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'probe2-after-click.png' })

  const ui = await page.evaluate(() => {
    const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
    return {
      buttons: [...document.querySelectorAll('button,[role="button"],a[title]')].filter(vis).slice(0, 30)
        .map(b => ({ t: (b.textContent || '').trim().slice(0, 28), title: b.getAttribute('title') || '',
                     aria: b.getAttribute('aria-label') || '', cls: (b.className || '').toString().slice(0, 50) })),
      selectedMarkers: [...document.querySelectorAll('[class*="selected"],[class*="highlight"],[class*="overlay"]')].filter(vis).slice(0, 8)
        .map(e => ({ tag: e.tagName, cls: (e.className || '').toString().slice(0, 70) })),
    }
  })
  console.log(JSON.stringify(ui, null, 1).slice(0, 3000))

  // Try double-click to open the dialog directly.
  await page.mouse.dblclick(x, y)
  await page.waitForTimeout(5000)
  await page.screenshot({ path: 'probe2-after-dblclick.png' })
  const dlg = await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input[name],textarea[name],select[name]')]
      .map(i => i.getAttribute('name')).slice(0, 40)
    const modals = [...document.querySelectorAll('[role="dialog"],[class*="modal"],[class*="Dialog"]')].length
    return { inputs, modals }
  })
  console.log('after dblclick ->', JSON.stringify(dlg).slice(0, 1200))
}
await browser.close()
