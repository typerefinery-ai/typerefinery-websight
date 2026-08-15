/**
 * docs/issues/0164 — round-trip proof: after the pattern rename, can indicator-create
 * actually produce an Indicator?
 *
 * Fills name + pattern (+ leaves pattern_type's vocab default), presses Create, and
 * verifies the object arrives in /viz-data/unattached-split. Counts indicators before
 * and after rather than trusting any HTTP status — the transport answers 200 on
 * server-side crashes (docs/issues/0026).
 *
 * ⚠️ WRITES DEMO DATA — run e2e/reset-demo-data.mjs afterwards to restore the curated
 * dataset (docs/issues/0138 ritual).
 *
 *     node e2e/probe-0164-roundtrip.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

// Node rejects the Traefik leaf certificate that Playwright's ignoreHTTPSErrors hides
// (docs/issues/0142) — needed for the unattached-split fetches below.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const FORM = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms/indicator-forms/indicator-create.html'
const SPLIT = 'https://flow.typerefinery.localhost:8101/viz-data/unattached-split'

const countIndicators = async () => {
  const res = await fetch(SPLIT)
  const body = await res.json().catch(() => null)
  const text = JSON.stringify(body || {})
  return (text.match(/"indicator--/g) || []).length
}

const before = await countIndicators()
console.log(`indicator-- occurrences in unattached-split BEFORE: ${before}`)

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

// Watch the save POST's response body — the status lies (0026), the body does not.
page.on('response', async (res) => {
  if (res.request().method() !== 'POST') return
  const body = await res.text().catch(() => '')
  console.log(`POST ${res.status()} ${res.url().slice(0, 110)}`)
  if (body) console.log(`   body: ${body.slice(0, 900)}`)
})

await page.goto(`${CMS}${FORM}`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('input[name="name"]', { timeout: 40_000 })
// vocab selects populate asynchronously — give them time before reading options
await page.waitForTimeout(10_000)
const vocabInfo = await page.evaluate(() => {
  const sels = [...document.querySelectorAll('select')].map((s) => ({
    name: s.name, options: s.options.length,
  }))
  return sels.slice(0, 12)
})
console.log('selects on form:', JSON.stringify(vocabInfo))

await page.locator('input[name="name"]').first().fill('0164 roundtrip indicator')
const pattern = page.locator('input[name="pattern"]').first()
if (!(await pattern.count())) {
  console.log('FAIL - no input named pattern on the form')
  process.exit(1)
}
await pattern.fill("[ipv4-addr:value = '203.0.113.99']")
// ⚠️ pattern_type is a Choices.js widget: the native <select> is a hidden decoy holding
// one placeholder (walk-act5-gestures.mjs P5-S5 documents the same trap). Open the
// widget that WRAPS the pattern_type select and click the real 'stix' choice item.
const widget = page.locator('.choices', { has: page.locator('select[name="pattern_type"]') }).first()
if (!(await widget.count())) {
  console.log('FAIL - no Choices widget wraps pattern_type')
  process.exit(1)
}
await widget.click()
await page.waitForTimeout(600)
const stix = widget.locator('.choices__item--choice', { hasText: 'stix' }).first()
if (await stix.count()) {
  await stix.click()
  console.log("   selected pattern_type = 'stix' via Choices widget")
} else {
  const items = await widget.locator('.choices__item').allInnerTexts()
  console.log(`   (no 'stix' choice; items: ${items.slice(0, 8).join(', ')})`)
}

const createBtn = page.locator('button:has-text("Create"), input[type="submit"]').first()
await createBtn.click()
await page.waitForTimeout(8_000)

const after = await countIndicators()
console.log(`indicator-- occurrences in unattached-split AFTER: ${after}`)
console.log(after > before ? '✅ Indicator CREATED and visible in unattached-split' : '🔴 no new indicator arrived')
await browser.close()
process.exit(after > before ? 0 : 1)
