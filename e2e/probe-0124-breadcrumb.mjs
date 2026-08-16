/**
 * docs/issues/0124 (and 0123) — the docx shows a breadcrumb band on every full page
 * ("OS-Triage → My Incidents", image2). `author-0123-breadcrumb.mjs` authored ONE breadcrumbs
 * component into the SHARED header, so every os-triage page should carry a crumb trail.
 *
 * The served HTML contains breadcrumb markup on all four Act pages — but markup is not a rendering
 * (docs/issues/0057), and a hierarchy-derived component with nothing to derive renders an empty band.
 * 0124 still lists "Breadcrumb band" as an unticked slice, so which is it?
 *
 * Read the DOM: the element, whether it is painted, and what text it actually shows.
 *
 *     node e2e/probe-0124-breadcrumb.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const BASE = `${CMS}/content/typerefinery-showcase/pages/os-triage`
const STATE = path.join(__dirname, '.auth', 'cms.json')

const PAGES = [
  ['Act 1 incidents', `${BASE}/pages/incidents.html`],
  ['Act 2 overview', `${BASE}/forms/overview-local.html`],
  ['Act 3 composer', `${BASE}/forms/composer-local.html`],
  ['Act 4 navigator', `${BASE}/pages/attack-navigator.html`],
]

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()

const rows = []
for (const [name, url] of PAGES) {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(3_000)
  const r = await page.evaluate(() => {
    const el = document.querySelector('[class*="breadcrumb"], nav[aria-label*="readcrumb"]')
    if (!el) return { present: false }
    const box = el.getBoundingClientRect()
    return {
      present: true,
      tag: el.tagName,
      cls: (el.className || '').slice(0, 60),
      text: (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
      items: el.querySelectorAll('li, a').length,
      painted: box.width > 0 && box.height > 0,
      size: `${Math.round(box.width)}×${Math.round(box.height)}`,
    }
  })
  rows.push({ name, ...r })
  console.log(
    `${name.padEnd(16)} present=${String(r.present).padEnd(5)} painted=${String(r.painted ?? '-').padEnd(5)} ` +
      `items=${String(r.items ?? '-').padEnd(3)} size=${String(r.size ?? '-').padEnd(9)} text=${JSON.stringify(r.text ?? '')}`,
  )
}

console.log('\n--- verdict ---')
const painted = rows.filter((r) => r.painted && r.text)
if (painted.length === rows.length) {
  console.log('  ✅ every Act page shows a crumb trail — 0124\'s "Breadcrumb band" slice is DONE')
} else if (rows.every((r) => r.present)) {
  console.log(`  ◐ the component is on every page but only ${painted.length}/${rows.length} render text.`)
  console.log('    A hierarchy-derived breadcrumb with nothing to derive paints an empty band — the')
  console.log('    slice is authored but not DELIVERING, which is 0057\'s distinction, not a missing node.')
} else {
  console.log('  ❌ the component is missing on some pages')
}

fs.writeFileSync(path.join(__dirname, 'probe-0124-breadcrumb.json'), JSON.stringify(rows, null, 2))
console.log('  written: e2e/probe-0124-breadcrumb.json')
await browser.close()
