/**
 * docs/issues/0109 — what the reference picker actually shows, before and after the label fix.
 *
 * The property read-back in `fix-0109-picker-label.mjs` proves the authored value landed; it does not
 * prove the user sees anything different (docs/issues/0057's lesson). This reads the rendered picker:
 * the `<option>` texts (what the CLOSED field shows), and the bold headings inside the open dropdown
 * (what the ROWS show) — the two halves 0109 is about, which have different fixes.
 *
 *     node e2e/probe-0109-picker-rows.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const FORM = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms/identity-forms/identity-create.html`
const STATE = path.join(__dirname, '.auth', 'cms.json')

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()
page.on('console', (m) => {
  if (/added \d+ options|rich option rows|options from data source/.test(m.text())) console.log(`  [page] ${m.text().slice(0, 160)}`)
})

console.log('--- open identity-create ---')
await page.goto(FORM, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(4_000)

// The `<option>` text is what Choices renders in the closed field once a row is chosen.
const options = await page.evaluate(() => {
  // Choices.js re-renders around the original select, and after 0156's blank first row the
  // values are not always populated at read time — so find the field by NAME, which is authored.
  const sels = [...document.querySelectorAll('select')]
  const sel =
    sels.find((s) => /created_by_ref/i.test(s.name || s.id || '')) ||
    sels.find((s) => [...s.options].some((o) => o.value && /^identity--/.test(o.value)))
  if (!sel) return { names: sels.map((s) => s.name || s.id || '(anon)') }
  return [...sel.options].map((o) => ({ value: o.value.slice(0, 24), text: (o.textContent || '').trim() }))
})
if (!Array.isArray(options)) {
  console.log(`  ⚠️ no created_by_ref select found. selects on the page: ${JSON.stringify(options?.names)}`)
  await browser.close()
  process.exit(1)
}
const real = options.filter((o) => o.value)
console.log(`\noption texts (what the CLOSED field displays): ${real.length} candidates`)
real.slice(0, 8).forEach((o) => console.log(`  ${o.value}… -> ${JSON.stringify(o.text)}`))
console.log(`  distinct option texts: ${new Set(real.map((o) => o.text)).size}/${real.length}`)

// Open the dropdown and read the rendered rows.
const opened = await page
  .evaluate(() => {
    const box = [...document.querySelectorAll('.choices')].find((c) => c.querySelector('select'))
    if (!box) return false
    box.querySelector('.choices__inner')?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    return true
  })
  .catch(() => false)
await page.waitForTimeout(1_500)

const rows = await page.evaluate(() => {
  const items = [...document.querySelectorAll('.choices__list--dropdown .choices__item')]
  return items.slice(0, 40).map((el) => ({
    heading: (el.querySelector('strong')?.textContent || '').trim(),
    sub: (el.querySelector('small')?.textContent || '').trim().slice(0, 60),
    text: (el.textContent || '').trim().slice(0, 60),
  }))
})
console.log(`\ndropdown rows (dropdown ${opened ? 'opened' : 'NOT opened'}): ${rows.length}`)
rows.slice(0, 8).forEach((r) => console.log(`  strong=${JSON.stringify(r.heading)} sub=${JSON.stringify(r.sub)}`))
const headings = rows.map((r) => r.heading).filter(Boolean)
console.log(`  distinct bold headings: ${new Set(headings).size}/${headings.length}`)

// The decisive test, and the one 0109 actually states: pick a candidate whose name is known, then
// read what the closed field displays. Counting "distinct headings > 1" is NOT the criterion — the
// dataset has three identity classes, so that was already true while every row was still labelled by
// TYPE. The question is whether the NAME appears.
const KNOWN = /Hiroshi Tanabe|Ana Belmonte|Lena Novak|Marta Silva/
const target = rows.findIndex((r) => KNOWN.test(r.text))
let closed = null
let wantedName = null
if (target >= 0) {
  wantedName = (rows[target].text.match(KNOWN) || [])[0]
  await page.evaluate((i) => {
    const items = [...document.querySelectorAll('.choices__list--dropdown .choices__item')]
    items[i]?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    items[i]?.click()
  }, target)
  await page.waitForTimeout(1_500)
  closed = await page.evaluate(() => {
    const el = document.querySelector('.choices__list--single .choices__item')
    return el ? (el.textContent || '').trim().slice(0, 80) : null
  })
}

console.log('\n--- 0109 acceptance (as the issue states it) ---')
console.log(`  selected "${wantedName || '(no known candidate found)'}" -> closed field reads ${JSON.stringify(closed)}`)
console.log(
  `  closed field shows the candidate's NAME   : ${closed && wantedName && closed.includes(wantedName) ? 'PASS' : closed ? `FAIL (reads ${JSON.stringify(closed)})` : 'NOT MEASURED'}`,
)
console.log(
  `  row heading shows the candidate's NAME    : ${headings.some((h) => KNOWN.test(h)) ? 'PASS' : `FAIL — headings are TYPE labels (${[...new Set(headings)].join(', ')}); this is the props.heading precedence at select/clientlibs/functions.js:419, raised as decision 0045`}`,
)
console.log(`  rows still carry the '->' artefacts       : ${rows.some((r) => /->/.test(r.text)) ? 'yes (0109 option 3, unfixed)' : 'no'}`)

fs.writeFileSync(path.join(__dirname, 'probe-0109-picker-rows.json'), JSON.stringify({ options: real, rows }, null, 2))
console.log('  written: e2e/probe-0109-picker-rows.json')
await browser.close()
