/**
 * docs/issues/0113 — which composites should carry a group caption?
 *
 * The issue's Option 1 assumes the four groups (Base Required / Optional / Object / Extensions) are
 * the composites on a form. They are not: the rendered `identity-create` carries **12** composite
 * inputs, including `external_references`, `granular_markings` and one named literally `field`.
 * Captioning every composite would put headings on nested sub-structures.
 *
 * The candidate discriminator is **structural, not domain**: a composite is a *group* when it has no
 * composite ancestor inside the form. This measures whether that rule selects exactly the four
 * groups, on several forms, before any component change is written.
 *
 *     node e2e/probe-0113-composite-nesting.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const BASE = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms`
const STATE = path.join(__dirname, '.auth', 'cms.json')

const FORMS = [
  `${BASE}/sdo-forms/identity-forms/identity-create.html`,
  `${BASE}/sdo-forms/identity-forms/identity-update.html`,
  `${BASE}/sdo-forms/sequence-forms/sequence-update.html`,
  `${BASE}/sco-forms/url-forms/url-update.html`,
]

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()

for (const url of FORMS) {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4000)

  const rows = await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input[iscompositevalue="true"]')]
    return inputs.map((el) => {
      // Walk up looking for another composite input's container. The composite renders
      // `<input iscompositevalue>` followed by `<div template>` holding its children, so an ancestor
      // `div[template]` means this composite is nested inside another one.
      let depth = 0
      for (let p = el.parentElement; p; p = p.parentElement) {
        if (p.matches('div[template]')) depth++
      }
      return { name: el.getAttribute('name') || '(none)', nestingDepth: depth }
    })
  })

  const groups = rows.filter((r) => r.nestingDepth === 0)
  const nested = rows.filter((r) => r.nestingDepth > 0)
  console.log(`\n${url.split('/').slice(-1)[0]}  — ${rows.length} composite(s)`)
  console.log(`  depth 0 (would be captioned): ${groups.map((g) => g.name).join(', ') || '(none)'}`)
  console.log(`  nested (would not):           ${nested.map((n) => `${n.name}@${n.nestingDepth}`).join(', ') || '(none)'}`)
}

await browser.close()
