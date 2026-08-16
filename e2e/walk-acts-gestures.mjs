/**
 * Gesture walk in **headed** Chrome — executes the Acts' headline interactions and reports
 * PASS / FAIL per step, so a validation run is not appearance-only.
 *
 * ⚠️ Driven by Playwright (`headless: false`) because docs/issues/0161's bridge outage now covers
 * clicks AND keystrokes, so the Claude-in-Chrome bridge cannot reach past the CMS login.
 *
 *     node e2e/walk-acts-gestures.mjs <outdir>
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const OUT = process.argv[2] || '.'
const P = '/content/typerefinery-showcase/pages/os-triage'

const results = []
const record = (step, verdict, note) => {
  results.push({ step, verdict, note })
  console.log(`${verdict.padEnd(5)} ${step.padEnd(7)} ${note}`)
}

/**
 * Run one gesture in isolation. ⚠️ A walk must report EVERY step: the first version let a timeout
 * throw and abort the run after P1-S3, so Acts 2 and 3 went unreported and the walk looked like it
 * had simply stopped rather than found something.
 */
const step = async (name, fn) => {
  try {
    await fn()
  } catch (e) {
    record(name, 'FAIL', 'threw: ' + String(e.message).split('\n')[0].slice(0, 88))
  }
}

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

// ---------- Act 1 ----------
await page.goto(`${CMS}${P}/pages/incidents.html`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('tbody tr', { timeout: 40_000 })
await page.waitForTimeout(3_000)

const rows = await page.locator('tbody tr').count()
record('P1-S1', rows > 0 ? 'PASS' : 'FAIL', `table renders ${rows} incident row(s)`)

/**
 * P1-SEARCH — the toolbar search beat the demo run card now tells the presenter to perform:
 * *"filter to one incident, then clear it."*
 *
 * ⚠️ It is walked here because the run card recommends it. Instructions a presenter will follow on
 * stage get exercised, not inferred — the same rule that caught the stale Acts 2/3 guidance earlier
 * today. P1-S1 asserts this in the suite; this is the by-hand, headed-Chrome counterpart.
 *
 * ⚠️ Targets the TOOLBAR box specifically (`name="case"` / the mockup's `Incident 1` placeholder),
 * never "an input" — the page carries a second, separate table filter that already worked, and a
 * loose locator would report success from the control that was never broken (docs/issues/0110).
 */
await step('P1-SEARCH', async () => {
  const box = page.locator('input[name="case"], input[placeholder="Incident 1"]').first()
  if (!(await box.count())) { record('P1-SEARCH', 'FAIL', 'toolbar search box not on the page'); return }
  const name = (await page.locator('tbody tr td:nth-child(2)').first().innerText()).trim()
  const term = name.split(/\s+/).filter((w) => w.length > 3)[0]
  if (!term) { record('P1-SEARCH', 'NOT-EXERCISED', `no usable term in "${name}"`); return }

  // The field emits on `change`, so the value must be COMMITTED — typing alone proves nothing.
  await box.fill(term)
  await box.press('Enter')
  await page.waitForTimeout(2_500)
  const filtered = await page.locator('tbody tr').count()

  await box.fill('')
  await box.press('Enter')
  await page.waitForTimeout(2_500)
  const restored = await page.locator('tbody tr').count()

  const ok = filtered < rows && filtered > 0 && restored === rows
  record('P1-SEARCH', ok ? 'PASS' : 'FAIL',
    `"${term}": ${rows} → ${filtered} → ${restored} rows` +
    (ok ? ' (filters, and clearing restores)' : ' — expected fewer-then-restored'))
})

// P1-S3 — Enter in the toolbar search must NOT open the create modal (the implicit-submit
// regression caught 2026-08-16; fixed by type="button" on non-submit buttons, live since 0044).
// The + Create dropdown is hidden per 0044's runbook (docx has no dropdown), so the old
// dropdown assertion is retired — the create journey belongs to New Incident (P1-S4).
await step('P1-S3', async () => {
  const box = page.locator('input[name="case"], input[placeholder="Incident 1"]').first()
  await box.fill('')
  await box.press('Enter')
  await page.waitForTimeout(2_000)
  const hijacked = await page.locator('.modal.show').count()
  const createHidden = (await page.locator('button[data-label="Create"]:visible').count()) === 0
  record('P1-S3', hijacked === 0 && createHidden ? 'PASS' : 'FAIL',
    `Enter-in-search opens no modal (${hijacked === 0 ? 'ok' : 'HIJACKED'}); + Create hidden (${createHidden ? 'ok' : 'still visible'})`)
})

// P1-S4 — the New Incident button opens the create modal (docx P1's control; 0044 runbook)
await step('P1-S4', async () => {
  await page.locator('button[data-label="New Incident"]').first().click({ timeout: 15000 })
  await page.waitForTimeout(6_000)
  const modalUp = await page.locator('.modal.show').count()
  const modalSrc = await page.locator('.modal.show iframe').first().getAttribute('src').catch(() => null)
  record('P1-S4', modalUp > 0 ? 'PASS' : 'FAIL', 'New Incident modal ' + (modalUp ? 'opened -> ' + String(modalSrc).split('/').pop() : 'did not open'))
})
await page.keyboard.press('Escape').catch(() => {})
await page.waitForTimeout(1_500)

// P1-S7 — row click drill-in (decision 0037 Option 1)
await page.goto(`${CMS}${P}/pages/incidents.html`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('tbody tr', { timeout: 40_000 })
await page.waitForTimeout(2_500)
const before = page.url()
await page.locator('tbody tr').first().locator('td').nth(1).click()
await page.waitForTimeout(8_000)
const after = page.url()
record('P1-S7', after !== before ? 'PASS' : 'FAIL',
  `row click → ${after !== before ? after.split('/').pop() : 'no navigation'}`)

// ---------- Act 2 ----------
await page.goto(`${CMS}${P}/forms/overview-local.html`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(18_000)
const viz = page.frameLocator('iframe[src*="widgetdevoverview"]').first()
const gnodes = await viz.locator('image, g.node').count().catch(() => 0)
record('P2-S1', gnodes > 1 ? 'PASS' : 'FAIL', `force graph renders ${gnodes} nodes`)

const formSrcNow = async () =>
  await page.locator('iframe[src*="stixorm-forms"]').first().getAttribute('src').catch(() => null)
// ⚠️ Wrapped in step(): on 2026-08-15 a 0-node graph (docs/issues/0177) made this click
// time out UNWRAPPED, aborting the walk after P2-S1 so Acts 2/3 went unreported — the
// exact failure mode the step() comment above warns about.
await step('P2-S5', async () => {
  const beforeForm = await formSrcNow()
  await viz.locator('image, g.node').first().click()
  let opened = null
  for (let i = 0; i < 90; i++) {
    const s = await formSrcNow()
    if (s && s !== beforeForm) { opened = s; break }
    await page.waitForTimeout(300)
  }
  record('P2-S5', opened ? 'PASS' : 'FAIL',
    `left-select → ${opened ? opened.split('stixorm-forms/')[1] : 'form did not change'}`)
})
await page.screenshot({ path: path.join(OUT, 'gesture-act2-after-select.png') })

// ---------- Act 3 ----------
await page.goto(`${CMS}${P}/forms/composer-local.html`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(20_000)
const comp = page.frameLocator('iframe[src*="widgetdevcomposer"]').first()
const promo = await comp.locator('svg.promo_svg image, svg.promo_svg g.node').count().catch(() => 0)
const scratch = await comp.locator('svg.scratch_svg image, svg.scratch_svg g.node').count().catch(() => 0)
record('P3-S1', promo > 0 ? 'PASS' : 'FAIL', `panes render — Promotable ${promo}, Scratch ${scratch}`)

await step('P3-S5', async () => {
  const beforeC = await formSrcNow()
  await comp.locator('svg.promo_svg image, svg.promo_svg g.node').first().click()
  let openedC = null
  for (let i = 0; i < 90; i++) {
    const s = await formSrcNow()
    if (s && s !== beforeC) { openedC = s; break }
    await page.waitForTimeout(300)
  }
  record('P3-S5', openedC ? 'PASS' : 'FAIL',
    `left-select → ${openedC ? openedC.split('stixorm-forms/')[1] : 'form did not change'}`)
})
await page.screenshot({ path: path.join(OUT, 'gesture-act3-after-select.png') })

console.log(`\n=== ${results.filter((r) => r.verdict === 'PASS').length}/${results.length} gestures PASS`)
await browser.close()
