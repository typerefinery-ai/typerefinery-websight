/**
 * docs/issues/0104 — why does a wired, configured, working notification surface reach nobody?
 *
 * Established in tick 3: the composer has 36 showNotification call sites (incl. "Promoted into the
 * incident" and "Object removed"), Toastify is bundled, the notifications config is present and
 * fully enabled in BOTH options payloads, and the surface RENDERS when called on the dev server.
 * Yet the manual run saw nothing.
 *
 * Three untested hypotheses were left:
 *   (1) options arrive async, so early calls hit the wrapper's SILENT early-return
 *   (2) Toastify appends to the IFRAME's document.body and positions gravity:top/position:right in
 *       the IFRAME's coordinate space - so a toast can render correctly and still be off-screen
 *   (3) clipping / z-index
 *
 * The discriminator: call the wrapper on the EMBEDDED composer and measure whether a .toastify node
 * (a) exists and (b) is inside the viewport. A node that exists but sits outside separates (2)/(3)
 * from (1) immediately.
 *
 *     node e2e/probe-0104-embedded-toast.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const URL = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html`

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1500, height: 950 },
  ignoreHTTPSErrors: true,
  storageState: path.join(__dirname, '.auth', 'cms.json'),
})
const page = await context.newPage()
await page.goto(URL, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(30000)

const iframeLoc = page.locator('iframe[src*="widgetdevcomposer"]')
const handle = await iframeLoc.elementHandle()
const frame = handle ? await handle.contentFrame() : null
const iframeBox = await iframeLoc.boundingBox()
if (!frame || !iframeBox) {
  console.error('FAIL - could not reach the composer widget iframe.')
  await browser.close()
  process.exit(1)
}
console.log(`iframe box: x=${Math.round(iframeBox.x)} y=${Math.round(iframeBox.y)} ${Math.round(iframeBox.width)}x${Math.round(iframeBox.height)}`)
console.log(`page viewport: 1500x950`)

// H1 check: is the wrapper's config actually populated in the embedded context?
const cfg = await frame.evaluate(() => {
  const u = window.Widgets?.Panel?.Utils
  return {
    utilsPresent: !!u,
    hasShowNotification: typeof u?.showNotification === 'function',
    notifications: u?.options?.notifications ?? null,
    toastifyLoaded: typeof window.Toastify === 'function',
    toastsAlready: document.querySelectorAll('.toastify').length,
  }
})
console.log(`\n--- H1: config present in the embedded widget? ---`)
console.log(JSON.stringify(cfg, null, 2))

if (!cfg.hasShowNotification) {
  console.error('FAIL - wrapper not reachable; cannot continue.')
  await browser.close()
  process.exit(1)
}

// Fire a success through the WRAPPER - the exact path product code uses.
await frame.evaluate(() => {
  window.Widgets.Panel.Utils.showNotification('success', 'probe 0104 - embedded success path')
})
await page.waitForTimeout(2500)

// H2/H3: does a node exist, and where is it relative to the iframe AND the page viewport?
const after = await frame.evaluate(() => {
  const nodes = [...document.querySelectorAll('.toastify')]
  return nodes.map((n) => {
    const r = n.getBoundingClientRect()
    const cs = getComputedStyle(n)
    return {
      text: n.innerText.trim().slice(0, 40),
      frameRel: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      display: cs.display, visibility: cs.visibility, opacity: cs.opacity, zIndex: cs.zIndex,
      position: cs.position,
    }
  })
})

console.log(`\n--- after calling the wrapper: ${after.length} .toastify node(s) ---`)
for (const t of after) {
  const pageX = Math.round(iframeBox.x + t.frameRel.x)
  const pageY = Math.round(iframeBox.y + t.frameRel.y)
  const insideIframe =
    t.frameRel.x >= 0 && t.frameRel.y >= 0 &&
    t.frameRel.x <= iframeBox.width && t.frameRel.y <= iframeBox.height
  const insideViewport = pageX >= 0 && pageY >= 0 && pageX <= 1500 && pageY <= 950
  console.log(`  "${t.text}"`)
  console.log(`     frame-rel  ${t.frameRel.x},${t.frameRel.y}  ${t.frameRel.w}x${t.frameRel.h}`)
  console.log(`     page-abs   ${pageX},${pageY}`)
  console.log(`     css        display=${t.display} visibility=${t.visibility} opacity=${t.opacity} z=${t.zIndex} pos=${t.position}`)
  console.log(`     inside iframe box: ${insideIframe}   inside page viewport: ${insideViewport}`)
}

console.log('\n=== VERDICT ===')
if (after.length === 0) {
  console.log('No toast node was created even though the wrapper was called directly.')
  console.log('=> H1 (silent early-return / config) is the live cause in the embedded context.')
} else {
  const t = after[0]
  const pageY = iframeBox.y + t.frameRel.y
  const visibleCss = t.display !== 'none' && t.visibility !== 'hidden' && Number(t.opacity) > 0
  const onScreen = pageY >= 0 && pageY <= 950 && iframeBox.x + t.frameRel.x <= 1500
  console.log(`node exists: yes | css-visible: ${visibleCss} | on-screen: ${onScreen}`)
  if (visibleCss && onScreen) console.log('=> The toast IS rendered and on-screen here. None of H1/H2/H3 reproduces - the manual run needs re-observing.')
  else if (visibleCss && !onScreen) console.log('=> H2 confirmed: the toast renders correctly but lands outside the visible area.')
  else console.log('=> H3 confirmed: the toast exists but is hidden by CSS.')
}

await browser.close()
