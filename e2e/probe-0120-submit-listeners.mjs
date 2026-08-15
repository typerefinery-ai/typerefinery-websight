/**
 * docs/issues/0120 — CONFIRM (or refute) submit-listener accumulation on the live build.
 *
 * Counts jQuery submit handlers on the form element after load, then after a real create
 * submission, using jQuery's internal event registry. Growth across a submit = confirmed.
 * ⚠️ Creates one junk identity in unattached context — run reset-demo-data.mjs --apply after.
 *
 *     node e2e/probe-0120-submit-listeners.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const FORM = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms/identity-forms/identity-create.html'

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()
await page.goto(`${CMS}${FORM}`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('input[name="name"]', { timeout: 40_000 })
await page.waitForTimeout(5_000)

const countHandlers = () =>
  page.evaluate(() => {
    const forms = [...document.querySelectorAll('form, [component="form"], .form')]
    const jq = window.jQuery
    if (!jq || !jq._data) return { error: 'no jQuery._data' }
    let best = null
    for (const f of forms) {
      const ev = jq._data(f, 'events')
      if (ev && ev.submit) best = { el: f.className.slice(0, 40), submit: ev.submit.length }
    }
    return best || { error: 'no element with submit handlers found' }
  })

const before = await countHandlers()
console.log('after load     :', JSON.stringify(before))

await page.fill('input[name="name"]', '0120 listener probe (junk, reset after)')
await page.click('button:has-text("Create"), input[type="submit"], button[type="submit"]')
await page.waitForTimeout(6_000)

const after1 = await countHandlers()
console.log('after 1st submit:', JSON.stringify(after1))

const grew = before && after1 && !before.error && !after1.error && after1.submit > before.submit
console.log(
  grew
    ? `🔴 CONFIRMED — submit handlers grew ${before.submit} → ${after1.submit} across one submit`
    : `(no growth measured: ${JSON.stringify({ before, after1 })} — either fixed, or the re-init path did not fire)`
)
await browser.close()
