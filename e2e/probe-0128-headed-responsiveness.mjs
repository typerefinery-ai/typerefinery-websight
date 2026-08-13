/**
 * docs/issues/0128 — the "one headed run" that issue asks for before it is rescoped.
 *
 * 0128 was filed from a manual session in which Chrome reported the renderer **unresponsive 13
 * times, 30 s each**, always while a force simulation ran. Profiling later could not reproduce it
 * (longest main-thread task 159 ms) and pointed at the **CDP screenshot capture** as the culprit
 * rather than the product — `Page.captureScreenshot` blocking is not the same thing as a page a user
 * cannot interact with. Its status says: *"rescope pending one headed run."*
 *
 * So: headed Chrome, no screenshot capture during the window, and measure the thing that actually
 * matters to an audience — **is the main thread responsive while the graph settles?**
 *
 * Method: a `requestAnimationFrame` heartbeat in the TOP page (the document the presenter clicks)
 * records the gap between frames. A frozen renderer shows up as a multi-second gap; smooth rendering
 * sits near 16 ms. Reported as the worst gaps, not an average, because a single 30 s stall is the
 * complaint and an average would hide it.
 *
 * ⚠️ Measures the top page deliberately. The graph lives in a cross-origin iframe which Chrome may
 * put in its own process — but the presenter's clicks land on the top document, so that is where
 * "frozen" is defined for this purpose.
 *
 *     node e2e/probe-0128-headed-responsiveness.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const P = '/content/typerefinery-showcase/pages/os-triage/forms'
const MAP = path.join(
  __dirname, '..', '..', 'typerefinery', 'services', 'fastapi', 'generated', 'os-triage',
  'context_mem', 'context_map.json',
)
console.log(`current_incident: ${JSON.parse(fs.readFileSync(MAP, 'utf8')).current_incident}`)

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  storageState: path.join(__dirname, '.auth', 'cms.json'),
  viewport: { width: 1600, height: 1000 },
})

// Install the heartbeat before any page script runs, so the load window is covered from the start.
await ctx.addInitScript(() => {
  window.__gaps = []
  let last = performance.now()
  const tick = () => {
    const now = performance.now()
    window.__gaps.push(now - last)
    last = now
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})

const page = await ctx.newPage()

const measure = async (label, url, settleMs) => {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 })
  await page.waitForTimeout(settleMs)
  const r = await page.evaluate(() => {
    const g = window.__gaps || []
    const sorted = [...g].sort((a, b) => b - a)
    return {
      frames: g.length,
      worst: sorted.slice(0, 5).map((x) => Math.round(x)),
      over1s: g.filter((x) => x > 1000).length,
      over250: g.filter((x) => x > 250).length,
    }
  })
  console.log(`\n=== ${label}`)
  console.log(`   frames sampled      : ${r.frames}`)
  console.log(`   worst gaps (ms)     : ${r.worst.join(', ')}`)
  console.log(`   gaps > 250 ms       : ${r.over250}`)
  console.log(`   gaps > 1 s (freeze) : ${r.over1s}`)
  // Also prove the page takes input at the end of the window.
  const t = Date.now()
  await page.evaluate(() => document.title)
  console.log(`   round-trip to page after settle: ${Date.now() - t} ms`)
  return r
}

const ov = await measure('Act 2 — Overview (27 nodes)', `${CMS}${P}/overview-local.html`, 30_000)
const co = await measure('Act 3 — Composer (3 panes, most nodes)', `${CMS}${P}/composer-local.html`, 30_000)

/**
 * ⚠️ 0128's WORST report was not a page load — it was *"two consecutive 30 s freezes, 60 s of
 * continuous unresponsiveness, immediately after switching the Composer treeview radio."* Loading
 * both graph pages cleanly does not answer that, so exercise the specific trigger before drawing any
 * conclusion about the issue. Downgrading a High on evidence that never touched its strongest claim
 * would be exactly the kind of partial verification this project keeps catching.
 */
const radios = page.frameLocator('iframe[src*="widgetdevcomposer"]').first().locator('input[type="radio"]')
let radio = { worst: [0], over1s: 0, switched: false }
if ((await radios.count().catch(() => 0)) > 1) {
  await page.evaluate(() => { window.__gaps = [] })
  await radios.nth(3).click({ force: true })
  await page.waitForTimeout(30_000)
  radio = await page.evaluate(() => {
    const g = window.__gaps || []
    const sorted = [...g].sort((a, b) => b - a)
    return { frames: g.length, worst: sorted.slice(0, 5).map((x) => Math.round(x)), over1s: g.filter((x) => x > 1000).length, switched: true }
  })
  console.log('\n=== Act 3 — after switching the treeview radio (0128\'s worst reported trigger)')
  console.log(`   frames sampled      : ${radio.frames}`)
  console.log(`   worst gaps (ms)     : ${radio.worst.join(', ')}`)
  console.log(`   gaps > 1 s (freeze) : ${radio.over1s}`)
} else {
  console.log('\n⚠️ treeview radios not found — the 60 s trigger was NOT exercised; say so rather than imply it passed')
}

const worst = Math.max(...ov.worst, ...co.worst, ...radio.worst)
const freezes = ov.over1s + co.over1s + radio.over1s
console.log(`\nworst single frame gap across both pages: ${Math.round(worst)} ms`)
console.log(freezes === 0
  ? '✅ NO freeze — the main thread never stalled beyond 1 s while the graphs settled'
  : `🔴 ${freezes} gap(s) over 1 s — the renderer did stall`)
console.log('⚠️ Headed Chrome, no CDP screenshot capture during the window — the condition 0128 asks for.')
await browser.close()
