/**
 * P1-S4 — **what exactly is pre-filled on the Create Incident modal?**
 *
 * The runsheet row promises *"a **blank** Create Incident form (~21 inputs: Name, Date, Severity,
 * TLP, PAP…)"*. The step asserted only `fields > 5`, so the "blank" half went untested for as long as
 * it existed (docs/issues/0048's "partial claim" shape). Asserting it turned P1-S4 **red**: **14
 * fields arrive non-blank**.
 *
 * ⚠️ **Red is not the same as wrong.** Some of those may be legitimate — a date defaulting to today
 * is reasonable on an incident form; a *severity* chosen by nobody is docs/issues/0156 all over again,
 * on the first object a presenter creates on stage. This probe names each one and its value so the
 * two can be told apart, rather than filing a defect on a count.
 *
 *     node e2e/probe-0162-create-incident-arrives-prefilled.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const SHOWCASE = '/content/typerefinery-showcase/pages/os-triage'

const browser = await chromium.launch({ channel: 'chrome' })
const context = await browser.newContext({
  ignoreHTTPSErrors: true,
  storageState: path.join(__dirname, '.auth', 'cms.json'),
  viewport: { width: 1600, height: 1000 },
})
const page = await context.newPage()

await page.goto(`${CMS}${SHOWCASE}/pages/incidents.html`, { waitUntil: 'domcontentloaded' })
await page.getByRole('button', { name: /\+?\s*create/i }).first().click()
// Reuse the spec's own selector rather than guessing at the dropdown's markup.
await page.locator('.dropdown-menu .dropdown-item').filter({ hasText: /^\s*Incident\s*$/i }).first().click()

const frame = page.frameLocator('iframe[src*="createincident"]').first()
await frame.locator('input, select, textarea').first().waitFor({ timeout: 60_000 })
await page.waitForTimeout(4_000) // let Choices.js finish constructing its UI

const fields = await frame.locator('input, select, textarea').evaluateAll((els) =>
  els.map((e) => ({
    tag: e.tagName.toLowerCase(),
    name: e.getAttribute('name') || '(unnamed)',
    type: e.getAttribute('type') || '',
    cls: String(e.className || '').slice(0, 28),
    value: String(e.value ?? '').trim(),
    // For a <select>, is the selected option the FIRST one? That is 0156's exact signature.
    firstOptionSelected:
      e.tagName.toLowerCase() === 'select' ? e.selectedIndex === 0 : null,
    optionCount: e.tagName.toLowerCase() === 'select' ? e.options.length : null,
  })),
)

const visible = fields.filter((f) => f.type !== 'hidden' && !f.cls.includes('choices__input'))
const nonBlank = visible.filter((f) => f.value !== '' && f.value !== '{}')

console.log(`total fields ${fields.length} · non-hidden ${visible.length} · NON-BLANK ${nonBlank.length}\n`)
console.log('NON-BLANK on open:')
for (const f of nonBlank) {
  const sel = f.firstOptionSelected === null ? '' : ` [select, ${f.optionCount} options, firstSelected=${f.firstOptionSelected}]`
  console.log(`  ${f.name.padEnd(18)} ${f.tag.padEnd(8)} = ${JSON.stringify(f.value).slice(0, 60)}${sel}`)
}
// 🔑 For radios/checkboxes `.value` is the OPTION's value, present by construction — it says nothing
// about selection. The only meaningful "pre-filled" question for them is whether one is CHECKED.
const checkables = await frame.locator('input[type="radio"], input[type="checkbox"]').evaluateAll((els) =>
  els.map((e) => ({ name: e.getAttribute('name') || '?', value: e.value, checked: e.checked })),
)
const checked = checkables.filter((c) => c.checked)
console.log(`\ncheckable inputs ${checkables.length} · CHECKED ${checked.length}`)
for (const c of checked) console.log(`  CHECKED  ${c.name} = ${c.value}`)
if (!checked.length) console.log('  (none checked — no severity/TLP/PAP chosen for the user)')

console.log('\nBLANK on open:')
for (const f of visible.filter((f) => !nonBlank.includes(f))) {
  console.log(`  ${f.name.padEnd(18)} ${f.tag}`)
}

await browser.close()
