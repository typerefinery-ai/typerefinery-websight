/**
 * User report 2026-08-13: "when I select an object on overview-local.html it is slow to load".
 *
 * Measures WHERE the time goes between clicking a node and the Update form being usable:
 *   t0 click -> t1 form iframe src changes -> t2 iframe finishes loading -> t3 fields are populated
 * and records every network request the form makes, with durations, so the slow phase is identified
 * rather than guessed.
 *
 *     node e2e/probe-overview-select-latency.mjs
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

const reqs = new Map()
const done = []
page.on('request', (r) => reqs.set(r, Date.now()))
page.on('requestfinished', (r) => {
  const t0 = reqs.get(r)
  if (t0 === undefined) return
  done.push({ ms: Date.now() - t0, url: r.url(), method: r.method() })
})

await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(16_000)

const formSrc = async () =>
  await page.locator('iframe[src*="stixorm-forms"]').first().getAttribute('src').catch(() => null)

const before = await formSrc()
console.log(`form iframe before: ${String(before).split('stixorm-forms/')[1] ?? before}`)

const widget = page.frameLocator('iframe[src*="widgetdevoverview"], iframe[src*="4008"]').first()
const node = widget.locator('image, g.node').first()
await node.waitFor({ timeout: 30_000 })

done.length = 0
const t0 = Date.now()
await node.click()

// t1 — the host swaps the form iframe's src
let t1 = null
for (let i = 0; i < 120; i++) {
  const s = await formSrc()
  if (s && s !== before) { t1 = Date.now(); break }
  await page.waitForTimeout(250)
}

// t3 — the form actually has values in it
let t3 = null, fields = 0
const form = page.frameLocator('iframe[src*="stixorm-forms"]').first()
for (let i = 0; i < 240; i++) {
  fields = await form.locator('input:not([type=hidden])').evaluateAll(
    (els) => els.filter((e) => e.value && e.value.trim().length).length).catch(() => 0)
  if (fields > 0) { t3 = Date.now(); break }
  await page.waitForTimeout(250)
}

console.log(`\n--- timings from the click ---`)
console.log(`  t1  form src changed        : ${t1 ? ((t1 - t0) / 1000).toFixed(1) + ' s' : 'NEVER'}`)
console.log(`  t3  first populated field   : ${t3 ? ((t3 - t0) / 1000).toFixed(1) + ' s' : 'NEVER'}  (${fields} fields)`)
console.log(`  form now: ${String(await formSrc()).split('stixorm-forms/')[1]}`)

const slow = done.filter((d) => d.ms > 300).sort((a, b) => b.ms - a.ms)
console.log(`\n--- requests after the click: ${done.length} total, ${slow.length} over 300ms ---`)
slow.slice(0, 14).forEach((d) => console.log(`  ${String(d.ms).padStart(6)} ms  ${d.method} ${d.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 96)}`))

const total = done.reduce((a, d) => a + d.ms, 0)
console.log(`\nsum of all request durations: ${(total / 1000).toFixed(1)} s (serial time if nothing overlaps)`)

await browser.close()
