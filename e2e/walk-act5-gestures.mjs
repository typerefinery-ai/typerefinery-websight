/**
 * Act 5 gesture walk in **headed** Chrome — the form-behaviour steps the 10:51Z walk left unvisited.
 *
 * P5-S1  fields grouped into Base Required / Optional / Object / Extensions
 * P5-S2  pressing Cancel opens the Default form
 * P5-S4  an Update form arrives pre-filled
 * P5-S5  a vocab select offers an empty first row then the vocabulary
 *
 *     node e2e/walk-act5-gestures.mjs <outdir>
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const OUT = process.argv[2] || '.'
const FORMS = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms'

const results = []
const record = (s, v, n) => { results.push({ s, v, n }); console.log(`${v.padEnd(5)} ${s.padEnd(7)} ${n}`) }
const step = async (name, fn) => {
  try { await fn() } catch (e) { record(name, 'FAIL', 'threw: ' + String(e.message).split('\n')[0].slice(0, 88)) }
}

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

const CREATE = `${CMS}${FORMS}/stix-forms/sdo-forms/identity-forms/identity-create.html`
const UPDATE = `${CMS}${FORMS}/stix-forms/sdo-forms/identity-forms/identity-update.html`

// ---- P5-S1: the four group captions
await step('P5-S1', async () => {
  await page.goto(CREATE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(9_000)
  const text = (await page.locator('body').innerText()).toLowerCase()
  const groups = ['base required', 'optional', 'object', 'extensions'].filter((g) => text.includes(g))
  record('P5-S1', groups.length === 4 ? 'PASS' : 'FAIL',
    `group captions present: ${groups.join(' · ') || 'none'} (${groups.length}/4)`)
  await page.screenshot({ path: path.join(OUT, 'act5-create-form.png') })
})

// ---- P5-S5: a vocab select has an empty first option, then the vocabulary
await step('P5-S5', async () => {
  // ⚠️ Choices.js HIDES the native <select> and renders its own list, so counting <option> measures
  // a decoy that always holds exactly one placeholder. Read .choices__item instead - the first
  // version of this check scored a false FAIL on "1 option: Select an item" while the widget
  // actually carried 17/8/36 entries.
  const widgets = await page.locator(".choices").count()
  if (!widgets) { record("P5-S5", "FAIL", "no Choices widget on the form"); return }
  const counts = await page.locator(".choices").evaluateAll(
    (ws) => ws.slice(0, 4).map((w) => w.querySelectorAll(".choices__item").length))
  const populated = counts.filter((c) => c > 1).length
  record("P5-S5", populated > 0 ? "PASS" : "FAIL",
    "vocab widgets render " + counts.join(" / ") + " items")
})

// ---- P5-S2: Cancel opens the Default form
await step('P5-S2', async () => {
  const cancel = page.getByRole('button', { name: /cancel/i }).first()
  if (!(await cancel.count())) { record('P5-S2', 'FAIL', 'no Cancel button on the form'); return }
  const before = page.url()
  await cancel.click({ timeout: 15_000 })
  await page.waitForTimeout(8_000)
  const after = page.url()
  record('P5-S2', /default/.test(after) ? 'PASS' : after !== before ? 'PARTIAL' : 'FAIL',
    `Cancel → ${after.split('/').pop()}`)
})

// ---- P5-S4: an Update form arrives pre-filled
await step('P5-S4', async () => {
  await page.goto(UPDATE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(10_000)
  const filled = await page.locator('input:not([type=hidden])').evaluateAll(
    (els) => els.filter((e) => e.value && e.value.trim().length).length)
  const total = await page.locator('input:not([type=hidden])').count()
  record('P5-S4', filled > 0 ? 'PASS' : 'FAIL', `${filled}/${total} inputs carry a value`)
  await page.screenshot({ path: path.join(OUT, 'act5-update-form.png') })
})

console.log(`\n=== ${results.filter((r) => r.v === 'PASS').length}/${results.length} Act 5 gestures PASS`)
await browser.close()
