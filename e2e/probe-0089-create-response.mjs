// What does a create form's POST actually return, and does the Save button submit at all?
//
// alpha-launch docs/issues/0089. Two different silent failures were measured:
//   event  - POST returns 200 and creates nothing
//   task   - no POST is made at all
// probe-0086-seed-types.mjs captured statuses only. This captures the response BODY (which
// distinguishes "the API rejected it politely" from "the save leg is not wired") and, for a form
// that does not submit, what the Save button actually is.
//
// Usage: node probe-0089-create-response.mjs <type> [group]

import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const here = path.dirname(fileURLToPath(import.meta.url))
const SHOWCASE = 'https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage'
const STORAGE = path.join(here, '.auth', 'cms.json')

const type = process.argv[2] || 'event'
const group = process.argv[3] || 'sdo-forms'
const url = `${SHOWCASE}/forms/stixorm-forms/stix-forms/${group}/${type}-forms/${type}-create.html`

const browser = await chromium.launch({ channel: 'chrome' })
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  storageState: fs.existsSync(STORAGE) ? STORAGE : undefined,
})
const page = await ctx.newPage()

const bodies = []
page.on('response', async (r) => {
  if (r.request().method() !== 'POST') return
  const u = r.url().replace(/^https?:\/\/[^/]+/, '')
  let body = ''
  try {
    body = (await r.text()).slice(0, 900)
  } catch {
    body = '(body unavailable)'
  }
  bodies.push({ url: u, status: r.status(), body })
})

const consoleErrors = []
page.on('console', (m) => {
  if (m.type() === 'error' || /error|fail|invalid|required/i.test(m.text()))
    consoleErrors.push(`[${m.type()}] ${m.text().slice(0, 200)}`)
})
page.on('pageerror', (e) => consoleErrors.push(`[pageerror] ${String(e).slice(0, 200)}`))

await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(4_000)

const name = page.locator('input[name="name"], input[name="name "]').first()
console.log(`type=${type}  name field visible: ${await name.isVisible().catch(() => false)}`)
if (await name.isVisible().catch(() => false)) {
  await name.click()
  await name.pressSequentially(`Diag ${type} ${new Date().toISOString().slice(11, 19)}`, { delay: 20 })
}

// What IS the save control? For a form that never submits, this is the question.
const save = page.getByRole('button', { name: /save|create/i }).first()
const saveInfo = await save
  .evaluate((el) => ({
    tag: el.tagName,
    type: el.getAttribute('type'),
    disabled: el.hasAttribute('disabled'),
    cls: (el.getAttribute('class') || '').slice(0, 90),
    form: el.getAttribute('form'),
    onclick: el.getAttribute('onclick') ? 'yes' : 'no',
  }))
  .catch(() => null)
console.log('save control:', JSON.stringify(saveInfo))

await save.click().catch((e) => console.log('save click failed:', String(e).slice(0, 120)))
await page.waitForTimeout(9_000)

console.log(`\nPOST responses (${bodies.length}):`)
for (const b of bodies) {
  console.log(`  ${b.status}  ${b.url.slice(0, 110)}`)
  if (b.body) console.log(`     body: ${b.body.replace(/\s+/g, ' ').slice(0, 500)}`)
}
if (!bodies.length) console.log('  (no POST was made)')

console.log(`\nconsole errors / warnings (${consoleErrors.length}):`)
consoleErrors.slice(0, 10).forEach((e) => console.log('  ' + e))

await browser.close()
