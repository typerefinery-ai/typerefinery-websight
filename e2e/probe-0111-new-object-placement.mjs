/**
 * docs/issues/0111 — is the Composer's New Object button (and its menu) still below the fold?
 *
 * 0111 measured this on 2026-08-11 in a **523 px-tall** viewport: button at the very bottom, menu
 * box `x:0, y:510, h:497` — bottom edge 1007 px, ~484 px below the fold. Both numbers are from a
 * viewport half the height of the demo's, and several layout changes have landed since, so
 * re-measure before working on it. Three items this week turned out to be already settled once
 * measured.
 *
 * Reports **viewport-relative** geometry, not `isVisible()` — Playwright counts an element below
 * the fold as visible, which is exactly the oracle that would report this defect as absent
 * (docs/issues/0100's failure class, and the same trap probe-0057-added-row-visibility.mjs avoids).
 *
 *     node e2e/probe-0111-new-object-placement.mjs [outdir]
 */
import { chromium } from '@playwright/test'
import fs from 'fs'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const CMS = 'https://cms.typerefinery.localhost:8101'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html'
const STATE = 'C:/Users/denis/WebstormProjects/alpha-launch/typerefinery-websight/e2e/.auth/cms.json'
const OUT = process.argv[2] || null
const VW = Number(process.env.VW || 1280)
const VH = Number(process.env.VH || 800)

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: VW, height: VH },
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()
await page.goto(CMS + PAGE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(12000)

const inView = (b) => (b ? b.y >= 0 && b.y + b.height <= VH : false)
const report = (label, b) =>
  console.log(
    `${label.padEnd(22)} ${b ? `x ${Math.round(b.x)} y ${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)}` : '(no box)'}` +
      `   ${b ? (inView(b) ? 'IN VIEW' : `OFF SCREEN (fold at ${VH})`) : ''}`,
  )

console.log(`viewport ${VW} x ${VH}\n`)

// The button carries its label; match on text rather than a class that may have changed.
let btn = page.locator('button:has-text("New Object"), a:has-text("New Object"), [title*="New Object" i]').first()
if (!(await btn.count())) {
  // It may live inside the composer iframe.
  for (const f of page.frames()) {
    const c = f.locator('button:has-text("New Object"), a:has-text("New Object"), [title*="New Object" i]').first()
    if (await c.count()) { btn = c; console.log(`(found inside frame ${f.url().slice(0, 70)})`); break }
  }
}
if (!(await btn.count())) {
  console.log('FAIL - no "New Object" control found on the page or in any frame')
  await browser.close()
  process.exit(2)
}

const bBox = await btn.boundingBox()
report('New Object button', bBox)

const pageH = await page.evaluate(() => document.documentElement.scrollHeight)
console.log(`document height       ${pageH}px  (viewport ${VH}px)`)

await btn.scrollIntoViewIfNeeded().catch(() => {})
await btn.click({ force: true }).catch((e) => console.log('click failed: ' + e.message.slice(0, 60)))
await page.waitForTimeout(1500)

/** The menu: 0111 measured it anchored at x=0 rather than under the pointer. */
const menu = page.locator('.dropdown-menu.show, [role="menu"]:visible, .contextmenu:visible, ul:visible:has(li)').first()
const mBox = (await menu.count()) ? await menu.boundingBox() : null
report('menu after click', mBox)
if (mBox) console.log(`menu anchored at x=${Math.round(mBox.x)} ${mBox.x < 5 ? '(FAR LEFT — not under the pointer)' : ''}`)

if (OUT) {
  fs.mkdirSync(OUT, { recursive: true })
  await page.screenshot({ path: `${OUT}/0111-new-object.png` })
  console.log(`\nscreenshot: ${OUT}/0111-new-object.png`)
}

await browser.close()
const bad = !inView(bBox) || (mBox && !inView(mBox))
console.log(`\n0111 ${bad ? 'REPRODUCES at this viewport' : 'does NOT reproduce at this viewport'}`)
process.exit(bad ? 1 : 0)
