/**
 * docs/issues/0046 — capture what the Create Connection modal actually POSTs.
 *
 * The save leg cannot be authored against an assumed payload: on the SRO form the equivalent detail
 * decided everything (`relationship_type: null` produced a 200-with-error-body and a silent no-op).
 * This drives P3-S7 through the UI and prints the request body verbatim.
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
    console.log('\n=== POST', r.url().slice(-80))
    console.log('BODY:', (r.postData() || '(none)').slice(0, 1500))
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
console.log('modal frame:', modal ? 'found' : 'NONE')
if (modal) {
  const fields = await modal.locator('input, select').evaluateAll((els) =>
    els.filter((e) => e.type !== 'hidden').map((e) => ({ n: e.getAttribute('name'), v: String(e.value).slice(0, 60) })),
  )
  console.log('modal fields:', JSON.stringify(fields, null, 1))

  // Pick a connection field, the way a user must — an unset one is what made the SRO form no-op.
  const choices = modal.locator('.choices').first()
  if (await choices.count()) {
    await choices.click()
    const opt = modal.locator('.choices__list--dropdown .choices__item').first()
    if (await opt.count()) {
      console.log('choosing field:', (await opt.innerText()).trim())
      await opt.click()
    }
  }
}

const submit = page.getByRole('button', { name: /save changes|^save$|^create$|^ok$|apply/i }).first()
if (await submit.count()) {
  await submit.click().catch(() => {})
  await page.waitForTimeout(9000)
}
await b.close()
