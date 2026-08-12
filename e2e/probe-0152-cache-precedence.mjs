/**
 * docs/issues/0152 — why does the table render NOTHING once a stale payload is planted?
 *
 * P0-S9 changed failure mode after the fix deployed: it used to render the cached `Description`
 * column (cache won); now no row renders at all. That is a third outcome, so it is worth watching
 * the widget's own log lines rather than inferring from the DOM.
 *
 *     node e2e/probe-0152-cache-precedence.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const PAGE = `${CMS}/content/typerefinery-showcase/pages/os-triage/pages/incidents.html`
const STATE = path.join(__dirname, '.auth', 'cms.json')

const STALE = {
  columns: [
    { field: 'name', title: 'Name' },
    { field: 'type', title: 'Type' },
    { field: 'description', title: 'Description' },
    { field: 'id', title: 'ID' },
  ],
  data: [{ name: 'STALE CACHE ROW', type: 'Extended-Incident', description: 'Name -> STALE', id: 'incident--stale-0152' }],
}

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()

page.on('console', (m) => {
  const t = m.text()
  if (/table|cache|dataSource|0152|topic/i.test(t)) console.log(`  [${m.type()}] ${t.slice(0, 300)}`)
})
page.on('requestfailed', (r) => {
  if (/viz-data|flow/.test(r.url())) console.log(`  [REQFAIL] ${r.url()} — ${r.failure()?.errorText}`)
})
page.on('response', async (r) => {
  if (/viz-data/.test(r.url())) console.log(`  [RESP] ${r.status()} ${r.url()}`)
})

console.log('\n--- load 1: no plant (baseline) ---')
await page.goto(PAGE)
await page.waitForTimeout(8000)
console.log(`  rows: ${await page.locator('tbody tr').count()}`)
console.log(`  headers: ${(await page.locator('thead th').allInnerTexts()).map((s) => s.trim()).filter(Boolean).join(' | ')}`)

const html = await page.content()
const topic = html.match(/websocketTopic&?#?3?4?;?":?"?(table_[a-f0-9]+)/i)?.[1] ?? html.match(/(table_[a-f0-9]{32})/)?.[1]
console.log(`  topic: ${topic}`)

console.log('\n--- load 2: with a stale payload planted ---')
await page.evaluate(([k, v]) => window.localStorage.setItem(k, v), [topic, JSON.stringify(STALE)])
console.log(`  planted ${await page.evaluate((k) => window.localStorage.getItem(k)?.length ?? 0, topic)} bytes`)
await page.reload()
await page.waitForTimeout(15000)
console.log(`  rows: ${await page.locator('tbody tr').count()}`)
console.log(`  headers: ${(await page.locator('thead th').allInnerTexts()).map((s) => s.trim()).filter(Boolean).join(' | ')}`)
console.log(`  body text: ${(await page.locator('tbody').innerText()).slice(0, 200).replace(/\n/g, ' / ')}`)

await browser.close()
