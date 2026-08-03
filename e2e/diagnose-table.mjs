/**
 * Diagnostic for docs/issues/0029 — why does the Incidents table not render?
 *
 * Opens the page with the saved CMS session and reports what the component
 * actually got: its authored config, the TMS topic it subscribes to, whether any
 * payload is cached, and what the console said.
 */
import { chromium } from '@playwright/test'
import * as path from 'path'

const BASE = process.env.CMS_BASE || 'http://localhost:8113'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/pages/incidents.html'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await browser.newContext({ ignoreHTTPSErrors: true })
const page = await ctx.newPage()

// Log in fresh — a stored session does not survive a CMS restart, and an expired one
// silently lands on the login page and makes every finding below meaningless.
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 90000 })
if (page.url().includes('login')) {
  await page.locator('[data-testid="login-form-username"]').click()
  await page.locator('[data-testid="login-form-username"]').pressSequentially('wsadmin', { delay: 40 })
  await page.locator('[data-testid="login-form-password"]').click()
  await page.locator('[data-testid="login-form-password"]').pressSequentially('wsadmin', { delay: 40 })
  await page.locator('#login-form button[type="submit"]').click()
  await page.waitForURL((u) => !u.toString().includes('login'), { timeout: 60000 })
}

const console_ = []
page.on('console', (m) => console_.push(`${m.type()}: ${m.text().slice(0, 200)}`))
page.on('pageerror', (e) => console_.push(`pageerror: ${String(e).slice(0, 200)}`))
const ws = []
page.on('websocket', (s) => {
  ws.push(`OPEN ${s.url()}`)
  s.on('framereceived', (f) => ws.push(`RECV ${String(f.payload).slice(0, 160)}`))
  s.on('framesent', (f) => ws.push(`SENT ${String(f.payload).slice(0, 160)}`))
})

await page.goto(BASE + PAGE, { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForTimeout(20000)

const report = await page.evaluate(() => {
  const tables = document.querySelectorAll('table')
  const widgets = document.querySelectorAll('[class*="table"], [data-model], [id*="table"]')
  const models = []
  document.querySelectorAll('[data-model]').forEach((el) => {
    models.push({ id: el.id, cls: el.className, model: (el.getAttribute('data-model') || '').slice(0, 600) })
  })
  return {
    url: location.href,
    title: document.title,
    tableCount: tables.length,
    tableLikeElements: widgets.length,
    localStorageKeys: Object.keys(localStorage),
    tableKeyPayloadLengths: Object.keys(localStorage)
      .filter((k) => k.startsWith('table'))
      .map((k) => ({ k, len: (localStorage.getItem(k) || '').length })),
    dataModels: models.slice(0, 6),
    bodyTextStart: document.body.innerText.slice(0, 300),
    tables: Array.from(tables).map((t) => {
      const b = t.getBoundingClientRect()
      return {
        rows: t.querySelectorAll('tbody tr').length,
        headerCells: Array.from(t.querySelectorAll('thead th')).map((h) => h.textContent.trim()).slice(0, 8),
        rect: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) },
        visible: b.width > 0 && b.height > 0,
        text: t.innerText.replace(/\s+/g, ' ').slice(0, 160),
      }
    }),
    tableWidgetConfigs: Array.from(document.querySelectorAll('[data-model]'))
      .map((el) => el.getAttribute('data-model') || '')
      .filter((m) => m.includes('"componentName":"table"'))
      .map((m) => {
        try {
          const j = JSON.parse(m)
          return {
            id: j.id,
            path: j.path,
            dataSource: j.dataSource,
            websocketTopic: j.websocketTopic,
            websocketHost: j.websocketHost,
            flowapi_topic: j.flowapi_topic,
            flowapi_flowstreamid: j.flowapi_flowstreamid,
          }
        } catch {
          return { unparsed: m.slice(0, 200) }
        }
      }),
  }
})

console.log('=== PAGE REPORT ===')
console.log(JSON.stringify(report, null, 1))
console.log('=== WEBSOCKET (first 25) ===')
console.log(ws.slice(0, 25).join('\n') || '(no websocket activity)')
console.log('=== CONSOLE (first 40) ===')
console.log(console_.slice(0, 40).join('\n') || '(silent)')

await browser.close()
