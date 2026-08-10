/**
 * docs/issues/0071 — print the FULL connection-save URL, then drive it directly.
 *
 * The modal posts to a CMS form path, not to the Flow route, so the save cannot be exercised
 * without either the UI or this URL. probe-connection-payload.mjs truncated it to the last 80
 * characters, which is not enough to replay.
 */
import { chromium } from '@playwright/test'
import path from 'path'

const CMS = 'https://cms.typerefinery.localhost:8101'
const COMPOSER = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html`

const b = await chromium.launch()
const ctx = await b.newContext({ ignoreHTTPSErrors: true, storageState: path.resolve('.auth/cms.json') })
const page = await ctx.newPage()

page.on('request', (r) => {
  if (r.method() === 'POST' && /foreign-key-connections/.test(r.url())) {
    console.log('FULL_URL=' + r.url())
    console.log('BODY=' + (r.postData() || '(none)'))
  }
})

await page.goto(COMPOSER, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {})
await page.waitForTimeout(12000)

const widget = page.frameLocator('iframe[src*="widgetdevcomposer"], iframe[src*="4005"]').first()
const promo = widget.locator('svg.promo_svg').locator('image')
const scratch = widget.locator('svg.scratch_svg').locator('image')
await promo.first().click()
const target = (await scratch.count()) ? scratch.first() : promo.nth(1)
await target.click()
await target.click({ button: 'right' })
await widget.getByText(/create connection/i).first().click()
await page.waitForTimeout(6000)

const modal = page.frames().find((f) => /foreign-key-connections/.test(f.url()))
console.log('MODAL_FRAME_URL=' + (modal ? modal.url() : 'NONE'))

// Submit so the POST fires and the URL is captured.
await page
  .getByRole('button', { name: /save changes|^save$|^create$|^ok$|apply/i })
  .first()
  .click()
  .catch(() => console.log('(no save button)'))
await page.waitForTimeout(4000)

await b.close()
