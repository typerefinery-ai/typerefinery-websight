/**
 * decision 0035 — the deciding measurement: does the add-button row survive full NAMES, or must it
 * use the mockup's two-letter CODES?
 *
 * 0035 recommends Option 1 (render the authored `title` as visible text) and names its only real
 * risk as layout: 8 buttons at `col-lg-2`, already wrapping "5-then-2 with the yellow one stranded"
 * (docs/issues/0113). Rather than argue about it, this renders **both variants into a live page**,
 * at demo-plausible viewports, and measures what happens.
 *
 * ⚠️ Injects text at runtime only — it changes nothing in the repo and commits no styling choice.
 * The point is to make the decision on evidence, then implement once.
 *
 *     node e2e/probe-0035-addbutton-layout.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const FORM = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms/identity-forms/identity-create.html`
const STATE = path.join(__dirname, '.auth', 'cms.json')
const OUT = path.resolve(__dirname, '../../docs/runs/2026-08-12T07-45-00Z-decision-0035')

/** The mockup's codes, for the comparison variant only — NOT shipped anywhere. */
const CODES = {
  Revoked: 'RV',
  Labels: 'LB',
  Confidence: 'CO',
  Language: 'LN',
  'External References': 'ER',
  'Object Marking': 'OM',
  'Granular Markings': 'GM',
  'Identity Contact Extension': 'IC',
  Defanged: 'DF',
}

const VIEWPORTS = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1366x768', width: 1366, height: 768 },
]

const browser = await chromium.launch()

for (const vp of VIEWPORTS) {
  for (const variant of ['icons', 'names', 'codes']) {
    const ctx = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: vp.width, height: vp.height },
      ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
    })
    const page = await ctx.newPage()
    await page.goto(FORM, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(5000)

    const stats = await page.evaluate(
      ({ variant, codes }) => {
        const btns = [...document.querySelectorAll('button')].filter(
          (b) => b.getAttribute('title') && !(b.textContent || '').trim(),
        )
        if (variant !== 'icons') {
          for (const b of btns) {
            const title = b.getAttribute('title') || ''
            const label = variant === 'codes' ? codes[title] || title.slice(0, 2).toUpperCase() : title
            const span = document.createElement('span')
            span.textContent = ' ' + label
            span.style.fontSize = '0.75rem'
            b.appendChild(span)
          }
        }
        const rects = btns.map((b) => b.getBoundingClientRect())
        const rows = [...new Set(rects.map((r) => Math.round(r.top)))].sort((a, b) => a - b)
        const widest = Math.max(...rects.map((r) => r.width))
        const tallest = Math.max(...rects.map((r) => r.height))
        // Does any button's text overflow its box?
        const clipped = btns.filter((b) => b.scrollWidth > b.clientWidth + 1).length
        return {
          buttons: btns.length,
          rows: rows.length,
          rowTops: rows,
          widestPx: Math.round(widest),
          tallestPx: Math.round(tallest),
          clipped,
        }
      },
      { variant, codes: CODES },
    )

    console.log(
      `${vp.name}  ${variant.padEnd(6)}  buttons=${stats.buttons} rows=${stats.rows} widest=${stats.widestPx}px tallest=${stats.tallestPx}px clipped=${stats.clipped}`,
    )
    await page.screenshot({ path: path.join(OUT, `${vp.name}-${variant}.png`), fullPage: false })
    await ctx.close()
  }
}

await browser.close()
console.log(`\nscreenshots: ${OUT}`)
