/**
 * docs/issues/0057 obs 81 + obs 83 — does the added Object Marking row actually SHOW itself?
 *
 * The two cosmetics are the whole of what keeps 0057 open, and both were observed by hand on
 * 2026-08-11, before several rounds of form work. Before fixing them, check they still reproduce —
 * three separate items this week turned out to be already-settled once measured.
 *
 * obs 83: "the added row lands below the fold with no scroll-to or highlight, so a presenter
 *          clicking Object Marking sees nothing happen."
 * obs 81: "the remove control renders as an ~8px blue underlined × floating below-left of the field."
 *
 * ⚠️ Measures the row's position **relative to the scrolling container**, not just
 * `isVisible()` — Playwright counts an element below the fold as visible, which is exactly the trap
 * that would report this defect as absent. The question is whether a human sees it appear.
 *
 *     node e2e/probe-0057-added-row-visibility.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const CMS = 'https://cms.typerefinery.localhost:8101'
const FORM =
  '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms/identity-forms/identity-create.html'
const STATE = 'C:/Users/denis/WebstormProjects/alpha-launch/typerefinery-websight/e2e/.auth/cms.json'
const OUT = process.argv[2] || null

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1280, height: 800 },
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()
await page.goto(CMS + FORM, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)

const addButton = page.locator('button[title="Object Marking"], button[data-label*="Object Marking" i]').first()
if (!(await addButton.count())) {
  console.log('FAIL - the Object Marking control was not found; form may not have loaded')
  await browser.close()
  process.exit(1)
}

const rows = () => page.locator('[name="object_marking_refs"], [name^="object_marking_refs"]:visible')
const before = await rows().count()

const scrollTopBefore = await page.evaluate(() => window.scrollY)
await addButton.scrollIntoViewIfNeeded()
const btnBox = await addButton.boundingBox()
await addButton.click()
await page.waitForTimeout(2500)

const after = await rows().count()
console.log(`rows ${before} -> ${after}`)
if (after <= before) {
  console.log('FAIL - no row was added; cannot measure visibility')
  await browser.close()
  process.exit(1)
}

const added = rows().last()
const box = await added.boundingBox()
const vp = page.viewportSize()
const scrollTopAfter = await page.evaluate(() => window.scrollY)

/**
 * The honest question: after the click, is the new row inside the visible viewport?
 * boundingBox() is viewport-relative in Playwright, so y within [0, height] means on screen.
 */
const onScreen = box && box.y >= 0 && box.y + box.height <= vp.height
const partially = box && box.y < vp.height && box.y + box.height > 0

console.log(`viewport            : ${vp.width} x ${vp.height}`)
console.log(`add button y        : ${btnBox ? Math.round(btnBox.y) : '?'}`)
console.log(`added row y         : ${box ? Math.round(box.y) : '?'}  height ${box ? Math.round(box.height) : '?'}`)
console.log(`page scrolled by    : ${scrollTopAfter - scrollTopBefore}px (${scrollTopBefore} -> ${scrollTopAfter})`)
console.log(`row fully on screen : ${onScreen}`)
console.log(`row partly on screen: ${partially}`)

// obs 81 — what does the remove control look like?
const addedRow = added.locator('xpath=ancestor::*[@state="new"][1]')
const rm = addedRow.locator('.composite-remove-item, button[aria-label*="remove" i], [data-action="remove-item"]').first()
if (await rm.count()) {
  const rbox = await rm.boundingBox()
  const style = await rm.evaluate((el) => {
    const s = getComputedStyle(el)
    return { fontSize: s.fontSize, color: s.color, textDecoration: s.textDecorationLine, text: el.textContent.trim().slice(0, 12) }
  })
  console.log(`\nremove control      : ${rbox ? `${Math.round(rbox.width)}x${Math.round(rbox.height)}px at y ${Math.round(rbox.y)}` : 'no box'}`)
  console.log(`   font ${style.fontSize} · colour ${style.color} · decoration ${style.textDecoration} · text ${JSON.stringify(style.text)}`)
} else {
  console.log('\nremove control      : NONE FOUND on the added row')
}

if (OUT) {
  fs.mkdirSync(OUT, { recursive: true })
  await page.screenshot({ path: `${OUT}/0057-added-row.png`, fullPage: false })
  console.log(`\nscreenshot: ${OUT}/0057-added-row.png`)
}

await browser.close()
console.log(`\nobs 83 ${onScreen ? 'does NOT reproduce — the row is on screen' : 'REPRODUCES — the row is off screen after the click'}`)
process.exit(onScreen ? 0 : 1)
