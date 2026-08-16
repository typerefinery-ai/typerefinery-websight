/**
 * docs/issues/0108 — the Identity CREATE form arrives pre-populated, so a new object silently
 * inherits `roles: SOC`, `sectors: agriculture`, `identity_class: individual` and a `created_by_ref`.
 *
 * 0108 was measured on 2026-08-11 and left two questions open that only a live read can settle, and
 * both have moved since:
 *
 *   Q1 "is `created_by_ref: Extended-Identity` a real default, or Choices.js rendering the first
 *       candidate as if selected?" — docs/issues/0156 has since put a BLANK first row in every
 *       single-value select that has no authored default (select/clientlibs/functions.js:481), which
 *       is exactly the mechanism 0108 suspected. So this may already be gone.
 *   Q2 "do the other 28 create forms carry the same defaults?" — only identity-create was exercised.
 *
 * This reads what the DOM actually holds on a clean load, and separates the two causes rather than
 * inferring: a value that is authored shows up as an <option selected> or an input `value=` in the
 * SERVED HTML, whereas a widget artefact appears only in the live DOM. Both are reported per field.
 *
 * `type` and `spec_version` are genuine system constants — 0108's own guard says they must STAY
 * filled, so a fix cannot be "blank everything".
 *
 *     node e2e/probe-0108-create-defaults.mjs                 # identity-create
 *     FORMS=all node e2e/probe-0108-create-defaults.mjs       # every create form in the index
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const BASE = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms`
const STATE = path.join(__dirname, '.auth', 'cms.json')
const CONSTANTS = new Set(['type', 'spec_version'])

// `create-forms.json` is the same index `check-create-forms.mjs` reads — absolute content paths,
// no `.html`. Reuse it rather than reconstructing the paths from type names, which would silently
// skip any form whose folder does not follow the pattern.
const FORMS =
  process.env.FORMS === 'all'
    ? JSON.parse(fs.readFileSync(path.join(__dirname, 'create-forms.json'), 'utf8')).forms.map((p) => `${CMS}${p}.html`)
    : ['stix-forms/sdo-forms/identity-forms/identity-create.html']

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()

const report = []
for (const rel of FORMS) {
  const url = rel.startsWith('http') ? rel : `${BASE}/${rel}`
  console.log(`\n=== ${rel.split('/').slice(-1)[0]} ===`)

  // The SERVED html — authored state, before any script runs.
  const served = await (await ctx.request.get(url)).text().catch(() => '')

  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(4_000)

  const fields = await page.evaluate(() => {
    const out = []
    for (const el of document.querySelectorAll('input, select, textarea')) {
      const name = el.name || el.id || '(anon)'
      if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') continue
      let value = ''
      let placeholderRow = false
      if (el.tagName === 'SELECT') {
        const opt = el.selectedOptions[0]
        value = opt ? (opt.textContent || '').trim() : ''
        placeholderRow = !!(opt && (opt.dataset.placeholder === 'true' || opt.value === ''))
        if (placeholderRow) value = ''
      } else if (el.type === 'radio' || el.type === 'checkbox') {
        // ⚠️ `el.value` on a radio/checkbox is the CONTROL's value, not the user's selection — an
        // unselected "No" radio still reports "false". Reading it as data is the false alarm this
        // suite has already produced once (see the P1-S4 note in specs/02-overview.spec.ts). Only a
        // CHECKED control carries a value.
        value = el.checked ? (el.value || 'on').trim() : ''
      } else {
        value = (el.value || '').trim()
      }
      // A composite carries its group's whole state in one input whose value is a JSON object
      // (`base_required`, `object`, `extensions`, …). Those are plumbing, not fields the user fills,
      // and counting them as "pre-populated" is the presence-vs-quality trap docs/issues/0048 is
      // about. Classify them and read INSIDE them instead — an empty-string key in there is the
      // thing 0108 actually cares about.
      const carrier = /^[[{]/.test(value)
      const visible = !!el.offsetParent && getComputedStyle(el).visibility !== 'hidden'
      out.push({ name, tag: el.tagName, value, placeholderRow, carrier, visible })
    }
    return out
  })

  // What the carriers say about the leaf keys — the payload that would be submitted.
  const payload = {}
  for (const f of fields.filter((x) => x.carrier)) {
    try {
      const parsed = JSON.parse(f.value)
      if (parsed && typeof parsed === 'object') for (const [k, v] of Object.entries(parsed)) payload[k] = v
    } catch {
      /* not JSON after all */
    }
  }
  const emptyStringKeys = Object.entries(payload).filter(([, v]) => v === '').map(([k]) => k)
  const nullKeys = Object.entries(payload).filter(([, v]) => v === null).map(([k]) => k)
  const valuedKeys = Object.entries(payload)
    .filter(([k, v]) => v !== '' && v !== null && !CONSTANTS.has(k))
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
  console.log(`  carrier payload keys: ${Object.keys(payload).length}`)
  console.log(`    empty string ("") : ${emptyStringKeys.join(', ') || '(none)'}`)
  console.log(`    null              : ${nullKeys.join(', ') || '(none)'}`)
  console.log(`    CARRYING A VALUE  : ${valuedKeys.join(', ') || '(none — good)'}`)

  const filled = fields.filter((f) => f.value)
  const unexpected = filled.filter((f) => !CONSTANTS.has(f.name) && !f.carrier)
  const constants = filled.filter((f) => CONSTANTS.has(f.name))

  for (const f of unexpected) {
    // Authored default vs widget artefact: an authored value is in the served markup.
    const authoredSelected = new RegExp(`<option[^>]*selected[^>]*>\\s*${f.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(served)
    const authoredValue = new RegExp(`name=["']${f.name}["'][^>]*value=["']${f.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(served)
    f.origin = authoredSelected || authoredValue ? 'AUTHORED in served html' : 'live DOM only (widget artefact)'
  }

  console.log(`  fields: ${fields.length} · filled: ${filled.length} · system constants: ${constants.map((c) => c.name).join(', ') || '(none)'}`)
  if (!unexpected.length) console.log('  ✅ no non-constant field arrives with a value')
  for (const f of unexpected) console.log(`  ⚠️ ${f.name.padEnd(22)} = ${JSON.stringify(f.value).padEnd(24)} ${f.origin}`)

  // 0108's guard: a fix must not be "blank everything".
  const missingConstants = [...CONSTANTS].filter((c) => !constants.some((f) => f.name === c) && fields.some((f) => f.name === c))
  if (missingConstants.length) console.log(`  ⚠️ system constant(s) NOT pre-filled: ${missingConstants.join(', ')} — these SHOULD be`)

  report.push({ form: rel, fields: fields.length, filled: filled.length, constants: constants.map((c) => c.name), unexpected, payload, emptyStringKeys, valuedKeys })
}

console.log('\n--- 0108 acceptance ---')
const bad = report.filter((r) => r.unexpected.length)
console.log(`  forms with a non-constant pre-filled field: ${bad.length}/${report.length}`)
for (const r of bad) console.log(`    ${r.form.split('/').slice(-1)[0]}: ${r.unexpected.map((u) => u.name).join(', ')}`)

fs.writeFileSync(path.join(__dirname, 'probe-0108-create-defaults.json'), JSON.stringify(report, null, 2))
console.log('  written: e2e/probe-0108-create-defaults.json')
await browser.close()
