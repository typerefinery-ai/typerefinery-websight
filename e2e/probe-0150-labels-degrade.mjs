/**
 * docs/issues/0150 — post-deploy verification of the "degrade to free text" fix.
 *
 * 0150: the **Labels** optional property is authored as a `vocab` select whose
 * `readOptionsFromDataSource` is empty, so it renders as a `<select>` with zero options — nothing can
 * be chosen and the property can never be filled. Option 1 (`degradeToFreeText` in the generic Select:
 * when no options source exists, fall back to a free-text control) shipped in the 2026-08-16 02:20Z
 * bundle deploy, and decision 0044's record names "0150's tags loop" as a verification still owed.
 *
 * The check has to be what the USER can do, not whether a property changed:
 *   - the Labels control must be reachable, and
 *   - it must accept a value the user types.
 *
 * A `<select>` with zero options fails both; a degraded free-text control passes both.
 *
 *     node e2e/probe-0150-labels-degrade.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const FORM = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms/identity-forms/identity-update.html`
const STATE = path.join(__dirname, '.auth', 'cms.json')

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()
const logs = []
page.on('console', (m) => {
  const t = m.text()
  if (/degrade|free.?text|options source|0150|labels/i.test(t)) logs.push(`[${m.type()}] ${t.slice(0, 200)}`)
})

await page.goto(FORM, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(5_000)

// ⚠️ Labels is an OPTIONAL property: it is not on the form until the user clicks its chip, which
// emits BUTTON_CLICK -> add-optional-template-once-half-width -> template_labels. A first run looked
// for `[name="labels"]` on a freshly loaded form, found nothing, and reported NOT MEASURED — the
// control was never absent, it was simply never asked for. Click the chip first; that is the user's
// path and the one 0150's "tags loop" describes.
const chip = page.locator('[title="Labels"]').first()
if (await chip.count()) {
  await chip.click({ force: true }).catch(() => {})
  await page.waitForTimeout(2_500)
  console.log('clicked the Labels chip')
} else {
  console.log('⚠️ no Labels chip found — the optional property cannot be added at all')
}

// The Labels control: find it by the field name, whatever element it ended up as.
const found = await page.evaluate(() => {
  const els = [...document.querySelectorAll('[name="labels"], [name="Labels"]')]
  return els.map((el) => ({
    tag: el.tagName,
    type: el.getAttribute('type') || '',
    options: el.tagName === 'SELECT' ? el.options.length : null,
    visible: !!el.offsetParent,
    readonly: el.hasAttribute('readonly'),
  }))
})

console.log(`controls named "labels": ${found.length}`)
for (const f of found) console.log(`  <${f.tag}${f.type ? ' type=' + f.type : ''}> options=${f.options} visible=${f.visible} readonly=${f.readonly}`)

let typed = null
if (found.length) {
  // The real test: can a user put a value in it?
  typed = await page
    .evaluate(() => {
      const el = document.querySelector('[name="labels"], [name="Labels"]')
      if (!el) return null
      if (el.tagName === 'SELECT') return { kind: 'select', options: el.options.length, canChoose: el.options.length > 0 }
      el.focus()
      el.value = ''
      return { kind: 'input', canType: !el.readOnly && !el.disabled }
    })
    .catch(() => null)
  if (typed && typed.kind === 'input' && typed.canType) {
    // type for real rather than setting .value (the workspace rule for the CMS login applies here too:
    // a programmatic value is not evidence a user could enter one)
    await page.fill('[name="labels"]', 'phishing/email').catch(() => {})
    typed.value = await page.inputValue('[name="labels"]').catch(() => '')
  }
}

console.log(`\ncontrol behaviour: ${JSON.stringify(typed)}`)
for (const l of logs.slice(0, 6)) console.log(`  ${l}`)

console.log('\n--- 0150 acceptance ---')
if (!found.length) {
  console.log('  ⬜ NOT MEASURED — no control named "labels" on this form; check the per-form inventory')
} else if (typed?.kind === 'input' && typed.value) {
  console.log(`  ✅ PASS — Labels degraded to a free-text control and accepted a typed value (${JSON.stringify(typed.value)})`)
} else if (typed?.kind === 'select' && !typed.canChoose) {
  console.log('  ❌ FAIL — still a <select> with zero options: the property still cannot be filled')
} else if (typed?.kind === 'select') {
  console.log(`  ◐ a <select> with ${typed.options} option(s) — it gained a vocabulary rather than degrading; not 0150's Option 1 but not broken`)
} else {
  console.log('  ⬜ INCONCLUSIVE — control found but neither path measured cleanly')
}

fs.writeFileSync(path.join(__dirname, 'probe-0150-labels-degrade.json'), JSON.stringify({ found, typed, logs }, null, 2))
console.log('  written: e2e/probe-0150-labels-degrade.json')
await browser.close()
