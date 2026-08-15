/**
 * 0177 diagnosis — why does the Overview render 0 nodes after a reboot when every service
 * is healthy and current_incident is set?
 *
 * probe-overview-data-source.mjs saw ZERO flow-ish HTTP responses, so the data path either
 * (a) never starts, or (b) rides the TMS websocket where an HTTP response listener is blind.
 * This probe watches ALL of it: console, page errors, failed requests, and websocket
 * frames (TMS :8112), across the host page AND its iframes.
 *
 *     node e2e/probe-0177-overview-wiring.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html'

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

const consoleLines = []
page.on('console', (m) => {
  const t = m.type()
  if (t === 'error' || t === 'warning') consoleLines.push(`[${t}] ${m.text().slice(0, 220)}`)
})
page.on('pageerror', (e) => consoleLines.push(`[pageerror] ${String(e).slice(0, 220)}`))
page.on('requestfailed', (r) =>
  consoleLines.push(`[reqfail] ${r.failure()?.errorText} ${r.url().slice(0, 160)}`))

const wsLog = []
page.on('websocket', (ws) => {
  wsLog.push(`OPEN ${ws.url()}`)
  ws.on('framesent', (f) => wsLog.push(`>> ${String(f.payload).slice(0, 200)}`))
  ws.on('framereceived', (f) => wsLog.push(`<< ${String(f.payload).slice(0, 200)}`))
  ws.on('close', () => wsLog.push(`CLOSE ${ws.url()}`))
})

await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(25_000)

// P2-S5 leg: click a node and watch what the click emits (or fails to).
const viz = page.frameLocator('iframe[src*="widgetdevoverview"]').first()
const nodeCount = await viz.locator('image, g.node').count().catch(() => 0)
console.log(`nodes visible: ${nodeCount}`)
const allConsole = []
page.on('console', (m) => allConsole.push(`[${m.type()}] ${m.text().slice(0, 200)}`))
if (nodeCount) {
  await viz.locator('image, g.node').first().click().catch((e) => console.log('click threw: ' + e.message))
  await page.waitForTimeout(12_000)
  const formSrc = await page.locator('iframe[src*="stixorm-forms"]').first().getAttribute('src').catch(() => null)
  console.log(`form iframe src after click: ${formSrc}`)
  console.log('--- console lines after click mentioning open/select/form/topic ---')
  for (const l of allConsole.filter((x) => /open|select|form|topic|stixorm/i.test(x)).slice(0, 30)) console.log(l)
}

console.log('=== console/pageerror/reqfail (errors+warnings only) ===')
for (const l of consoleLines.slice(0, 60)) console.log(l)
console.log(`\n=== websockets: ${wsLog.length} events ===`)
for (const l of wsLog.slice(0, 80)) console.log(l)

const iframes = page.frames().map((f) => f.url().slice(0, 130))
console.log(`\n=== frames: ${iframes.length} ===`)
for (const u of iframes) console.log(u)

await browser.close()
