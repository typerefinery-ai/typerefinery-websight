/**
 * docs/issues/0111 — the New Object dropdown renders below the viewport.
 *
 * Two things this settles, because the issue's measurement came from a **523 px-tall viewport** in a
 * manual run and the demo runs at **1600×1000**:
 *
 *   1. Is the menu still mispositioned at the demo viewport, or was it only a small-window artefact?
 *   2. Does the proposed fix actually work?
 *
 * PROPOSED CAUSE. `.dropdown-menu` is `position: absolute`, so it is placed against the nearest
 * POSITIONED ancestor. The button component ships no `.dropdown` wrapper — Bootstrap's usual
 * container, and what normally makes that ancestor the button's own parent — so where the menu lands
 * depends on the host page's markup. On the header, `+ Create` works; on the Composer page nothing
 * near the button is positioned, so the menu resolves against a distant ancestor.
 *
 * The fix (committed in `clientlibs/clientlibs-header/dropdown.js`) sets the button's parent to
 * `position: relative` and caps the menu at `60vh` with internal scroll. That is a **clientlib**, so
 * it needs a CMS deploy to take effect — this probe applies the identical change at runtime to prove
 * the mechanism now, rather than asserting it will work.
 *
 *     node e2e/probe-0111-dropdown-anchoring.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SHOWCASE = 'https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage'
const COMPOSER = `${SHOWCASE}/forms/composer-local.html`
const STORAGE = path.join(__dirname, '.auth', 'cms.json')
const VIEWPORTS = [
  { width: 1600, height: 1000, label: 'demo (playwright.config)' },
  { width: 1280, height: 523, label: "the manual run's window (0111's original measurement)" },
]

const browser = await chromium.launch()

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: fs.existsSync(STORAGE) ? STORAGE : undefined,
    viewport: { width: vp.width, height: vp.height },
  })
  const page = await ctx.newPage()
  console.log(`\n=== ${vp.width}×${vp.height} — ${vp.label} ===`)
  await page.goto(COMPOSER, { waitUntil: 'domcontentloaded', timeout: 120_000 })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(8_000)

  const btn = page.locator('button:has-text("New Object"), [title*="New Object" i]').first()
  if (!(await btn.count())) {
    console.log('  New Object button not found on this page — nothing to measure')
    await ctx.close()
    continue
  }
  const btnBox = await btn.boundingBox()
  console.log(`  button box   : ${JSON.stringify(btnBox)}`)
  console.log(`  button above the fold: ${btnBox ? btnBox.y + btnBox.height <= vp.height : 'n/a'}`)

  const measure = async (label) => {
    await btn.click({ force: true }).catch(() => {})
    await page.waitForTimeout(1_200)
    const m = await page.evaluate(() => {
      const el = document.querySelector('.dropdown-menu.dropdownMenu')
      if (!el) return null
      const r = el.getBoundingClientRect()
      const parent = el.parentElement
      return {
        shown: getComputedStyle(el).display !== 'none',
        items: el.querySelectorAll('.dropdown-item').length,
        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
        bottom: Math.round(r.bottom),
        parentPosition: parent ? getComputedStyle(parent).position : null,
        offsetParent: el.offsetParent ? (el.offsetParent.tagName + '.' + (el.offsetParent.className || '').split(' ')[0]) : null,
      }
    })
    console.log(`  [${label}] ${m ? JSON.stringify(m) : '<no .dropdown-menu in the DOM>'}`)
    if (m) {
      const insideX = m.x >= 0 && m.x + m.w <= vp.width
      const insideY = m.y >= 0 && m.bottom <= vp.height
      const nearButton = btnBox ? Math.abs(m.x - btnBox.x) < 200 : null
      console.log(`  [${label}] fully inside viewport: ${insideX && insideY}   anchored near the button: ${nearButton}`)
    }
    // close again
    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(400)
    return m
  }

  const before = await measure('BEFORE')

  // Apply exactly what the committed clientlib change does.
  await page.evaluate(() => {
    const menu = document.querySelector('.dropdown-menu.dropdownMenu')
    if (!menu) return
    const anchor = menu.parentElement
    if (anchor && getComputedStyle(anchor).position === 'static') anchor.style.position = 'relative'
    menu.style.maxHeight = '60vh'
    menu.style.overflowY = 'auto'
  })

  const after = await measure('AFTER FIX')

  if (before && after) {
    console.log(`  => moved from (${before.x},${before.y}) to (${after.x},${after.y}); height ${before.h} -> ${after.h}`)
  }
  await ctx.close()
}

await browser.close()
