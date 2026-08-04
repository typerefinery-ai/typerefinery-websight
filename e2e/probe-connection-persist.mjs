/**
 * #24 completion leg — does the connection actually PERSIST?
 *
 * 0046 made the form submit (POST 200, modal closes) by giving it flowapi_enable. A 200 is not a
 * write: docs/issues/0037 is the case where an API reported success and removed nothing. This reads
 * the Source/Target refs out of the modal, submits, then re-reads the target object from unattached
 * context and checks whether the chosen field now holds the source id.
 */
import { chromium } from '@playwright/test'

const BASE = 'https://cms.typerefinery.localhost:8101'
const COMPOSER = `${BASE}/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html`
const FLOW = 'http://localhost:8111'

const snapshot = async () => {
  const j = await (await fetch(`${FLOW}/viz-data/unattached-split`)).json()
  const all = [...(j.promo?.nodes || []), ...(j.scratch?.nodes || [])]
  const byId = {}
  for (const n of all) byId[n.id] = n
  return { count: all.length, byId }
}

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()
let submitStatus = null, submitBody = ''
page.on('response', async r => {
  if (r.request().method() === 'POST' && /foreign-key-connections/.test(r.url())) {
    submitStatus = r.status(); submitBody = (await r.text().catch(() => '')).slice(0, 300)
  }
})

await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
const u = page.locator('[data-testid="login-form-username"]')
if (await u.isVisible({ timeout: 20_000 }).catch(() => false)) {
  await u.click(); await u.pressSequentially('wsadmin', { delay: 30 })
  const p = page.locator('[data-testid="login-form-password"]')
  await p.click(); await p.pressSequentially('wsadmin', { delay: 30 })
  await page.locator('#login-form button[type="submit"]').click()
  await page.waitForURL(x => !/login\.html/.test(x.toString()), { timeout: 60_000 })
}

const before = await snapshot()
console.log('unattached before:', before.count)

await page.goto(COMPOSER, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(12_000)

const wf = page.frameLocator('iframe[src*="widgetdevcomposer"], iframe[src*="4005"]').first()
const promo = wf.locator('svg.promo_svg').locator('image').first()
const scratch = wf.locator('svg.scratch_svg').locator('image').first()
await promo.waitFor({ state: 'visible', timeout: 60_000 })
await promo.click(); await page.waitForTimeout(800)
await scratch.click(); await page.waitForTimeout(800)
await scratch.click({ button: 'right' }); await page.waitForTimeout(1500)
await wf.locator('text=/create connection/i').first().click()
await page.waitForTimeout(8000)

const modal = page.frameLocator('iframe[src*="foreign-key-connections"]').first()
// Read the pre-filled refs so we know which object to re-check afterwards.
const readVal = async (re) => {
  const inputs = modal.locator('input')
  const n = await inputs.count()
  for (let i = 0; i < n; i++) {
    const name = (await inputs.nth(i).getAttribute('name')) || ''
    const val = await inputs.nth(i).inputValue().catch(() => '')
    if (re.test(name) && val) return { name, val }
  }
  return null
}
const src = await readVal(/source/i)
const tgt = await readVal(/target/i)
console.log('source ref field:', JSON.stringify(src))
console.log('target ref field:', JSON.stringify(tgt))

await modal.locator('.choices').first().click().catch(() => {})
await page.waitForTimeout(1000)
const choice = modal.locator('.choices__list--dropdown .choices__item').first()
const chosenField = (await choice.innerText().catch(() => '?')).trim()
await choice.click().catch(() => {})
console.log('chose connection field:', chosenField)
await page.waitForTimeout(1500)

await page.getByRole('button', { name: /save changes|^save$|^create$|^ok$|apply/i }).first()
  .click({ timeout: 15_000 }).catch(e => console.log('submit failed:', e.message.slice(0, 70)))
await page.waitForTimeout(12_000)

console.log('submit response:', submitStatus, submitBody.replace(/\s+/g, ' ').slice(0, 200))

const after = await snapshot()
console.log('unattached after:', after.count)

// The criterion: the TARGET object should now carry the chosen field pointing at the SOURCE id.
const targetId = tgt?.val, sourceId = src?.val
if (targetId && after.byId[targetId]) {
  const obj = after.byId[targetId]
  const original = obj.original || obj
  const fieldVal = original[chosenField]
  console.log(`\ntarget ${targetId}`)
  console.log(`  ${chosenField} =`, JSON.stringify(fieldVal))
  console.log(`  source id      =`, JSON.stringify(sourceId))
  const ok = fieldVal && String(JSON.stringify(fieldVal)).includes(String(sourceId))
  console.log(`\nPERSISTED: ${ok ? 'YES — connection written' : 'NO — field does not hold the source id'}`)
} else {
  console.log('\ncould not re-read the target object; targetId =', targetId)
}
await browser.close()
