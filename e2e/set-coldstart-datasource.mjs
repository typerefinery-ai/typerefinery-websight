/**
 * Authors `coldStartDataSource` on the Incidents table component.
 *
 * Why a script and not curl: the Sling POST servlet returns 405 on this instance, so a content
 * property cannot be written directly (alpha-launch docs/issues/0029). The authoring dialog is
 * the supported path. This also **logs every mutating request the dialog makes**, so we learn
 * the endpoint and can script it directly next time.
 *
 * Usage:  node set-coldstart-datasource.mjs
 */
import { chromium } from '@playwright/test'

const BASE = 'https://cms.typerefinery.localhost:8101'
const PAGE_PATH = '/content/typerefinery-showcase/pages/os-triage/pages/incidents'
const EDITOR = `${BASE}/apps/websight/index.html${PAGE_PATH}::editor`
const NODE = `${PAGE_PATH}/jcr:content/rootcontainer/container1/form/container2/table`
const VALUE = 'https://flow.typerefinery.localhost:8101/viz-data/table-all-incidents-shaped'

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()

// Learn the authoring API: log every non-GET request and its status.
const calls = []
page.on('request', r => { if (r.method() !== 'GET') calls.push({ m: r.method(), u: r.url(), body: (r.postData() || '').slice(0, 300) }) })
page.on('response', async r => { if (r.request().method() !== 'GET') { const c = calls.find(x => x.u === r.url() && x.status === undefined); if (c) c.status = r.status() } })

console.log('1. login')
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
const user = page.locator('[data-testid="login-form-username"]')
if (await user.isVisible({ timeout: 20_000 }).catch(() => false)) {
  await user.click(); await user.pressSequentially('wsadmin', { delay: 40 })
  const pw = page.locator('[data-testid="login-form-password"]')
  await pw.click(); await pw.pressSequentially('wsadmin', { delay: 40 })
  await page.locator('#login-form button[type="submit"]').click()
  await page.waitForURL(u => !/login\.html/.test(u.toString()), { timeout: 60_000 })
}
console.log('   logged in ->', page.url())

console.log('2. open editor:', EDITOR)
await page.goto(EDITOR, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(8_000)

// The authored page renders in an iframe inside the editor shell.
const frames = page.frames()
console.log('   frames:', frames.length, frames.map(f => f.url().slice(0, 90)))

await page.screenshot({ path: 'coldstart-1-editor.png' })

// Find the table component in the authoring iframe and open its dialog (double-click is the
// usual "edit component" gesture in WebSight; fall back to a context menu if needed).
const target = frames.find(f => f.url().includes('incidents')) || page.mainFrame()
const table = target.locator('[data-ws-id*="table"], .table, table').first()
console.log('   table candidates:', await target.locator('[data-ws-id*="table"], .table, table').count())

if (await table.count()) {
  await table.scrollIntoViewIfNeeded().catch(() => {})
  await table.dblclick({ timeout: 20_000 }).catch(e => console.log('   dblclick failed:', e.message))
  await page.waitForTimeout(5_000)
}
await page.screenshot({ path: 'coldstart-2-afterdblclick.png' })

// Look for the dialog field by its label.
const field = page.locator('input[name="coldStartDataSource"]').first()
const found = await field.count()
console.log('3. coldStartDataSource field found:', found)

if (found) {
  await field.click()
  await field.fill('')
  await field.pressSequentially(VALUE, { delay: 10 })
  await page.screenshot({ path: 'coldstart-3-filled.png' })
  // Save — WebSight dialogs use a Save/Apply button in the dialog footer.
  const save = page.locator('button:has-text("Save"), button:has-text("Apply"), button[type="submit"]').last()
  await save.click({ timeout: 20_000 }).catch(e => console.log('   save click failed:', e.message))
  await page.waitForTimeout(6_000)
  await page.screenshot({ path: 'coldstart-4-saved.png' })
}

console.log('4. mutating requests observed:')
for (const c of calls) console.log(`   ${c.status ?? '?'} ${c.m} ${c.u}\n      body: ${c.body}`)

// Verify from the repository.
const check = await ctx.request.get(`${BASE}${NODE}.json`)
const json = await check.json().catch(() => ({}))
console.log('5. coldStartDataSource now =', JSON.stringify(json.coldStartDataSource))

await browser.close()
