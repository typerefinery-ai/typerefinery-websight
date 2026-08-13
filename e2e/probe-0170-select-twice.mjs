/**
 * docs/issues/0170 — does caching the HEAD probe remove the duplicate render?
 *
 * Selects TWO nodes of the SAME type in one session and times both. The first pays the probe; the
 * second should skip it and be roughly one render faster.
 *
 *     node e2e/probe-0170-select-twice.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html'

const browser = await chromium.launch({ channel: 'chrome' })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

let heads = 0
page.on('request', (r) => { if (r.method() === 'HEAD') heads++ })
const skips = []
page.on('console', (m) => { if (/skipping the HEAD probe/.test(m.text())) skips.push(m.text()) })

await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(16_000)

const widget = page.frameLocator('iframe[src*="widgetdevoverview"], iframe[src*="4008"]').first()
const nodes = widget.locator('image, g.node')
await nodes.first().waitFor({ timeout: 30_000 })
const total = await nodes.count()
console.log(`graph nodes: ${total}`)

const formSrc = async () =>
  await page.locator('iframe[src*="stixorm-forms"]').first().getAttribute('src').catch(() => null)

const select = async (i, label) => {
  const before = await formSrc()
  const headsBefore = heads
  const t0 = Date.now()
  await nodes.nth(i).click()
  let t1 = null
  for (let k = 0; k < 160; k++) {
    const s = await formSrc()
    if (s && s !== before) { t1 = Date.now(); break }
    await page.waitForTimeout(200)
  }
  const secs = t1 ? ((t1 - t0) / 1000).toFixed(1) : 'NEVER'
  console.log(`${label}: form appeared in ${secs} s   (HEAD requests during: ${heads - headsBefore})`)
  await page.waitForTimeout(2500)
  return t1 ? (t1 - t0) / 1000 : null
}

// A -> B -> A. Two different nodes are likely two different TYPES, hence two different form URLs,
// so the cache cannot apply on the second. Revisiting A is what actually exercises it.
const a = await select(0, 'selection 1 (node A, cold)')
await select(1, 'selection 2 (node B, cold)')
const b = await select(0, 'selection 3 (node A again - should hit the cache)')

console.log(`\nHEAD requests total     : ${heads}`)
console.log(`cache-skip log lines    : ${skips.length}`)
if (a && b) console.log(`delta (1st - 2nd)       : ${(a - b).toFixed(1)} s`)

await browser.close()
