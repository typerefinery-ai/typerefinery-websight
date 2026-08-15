/**
 * docs/issues/0113 (second half) — are the optional/extension ADD-BUTTONS labelled?
 *
 * 0113 recorded eight icon-only add-buttons; decision 0035 Option 1 (`7a69fc9f`) later
 * shipped named buttons per the runsheet's Act 5 row. This verifies the live state so
 * 0113 can close on evidence rather than the runsheet's say-so.
 *
 *     node e2e/probe-0113-addbutton-labels.mjs
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

const buttons = await page.evaluate(() => {
  return [...document.querySelectorAll('button')]
    .map((b) => ({ text: b.innerText.trim(), title: b.title || '', cls: b.className.slice(0, 40) }))
    .filter((b) => !/create|cancel|update/i.test(b.text || b.title))
})
const labelled = buttons.filter((b) => b.text.length > 2)
const iconOnly = buttons.filter((b) => b.text.length <= 2 && !b.title)
console.log(`buttons (excl. Create/Cancel): ${buttons.length}`)
console.log(`  with visible text >2 chars : ${labelled.length}`)
for (const b of labelled.slice(0, 10)) console.log(`    "${b.text}"`)
console.log(`  icon-only, no title        : ${iconOnly.length}`)
for (const b of iconOnly.slice(0, 8)) console.log(`    [${b.cls}]`)
console.log(labelled.length > 0 && iconOnly.length === 0
  ? '✅ add-buttons are labelled — 0113 second half verified'
  : '🔴 unlabelled buttons remain')
await browser.close()
process.exit(labelled.length > 0 && iconOnly.length === 0 ? 0 : 1)
