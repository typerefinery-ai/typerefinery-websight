/**
 * decision 0031 — verify an incident created through the CMS form now carries `labels` and
 * `object_marking_refs` instead of a prose description, and that the create still SUCCEEDS.
 *
 * ⚠️ Success is not the 200. This chain answers HTTP 200 while the algorithm crashes
 * (docs/issues/0142), so this reads the response body and, on error, the algorithm log — adding a
 * property the STIX class does not accept is exactly how 0142 and 0093 failed invisibly.
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SHOWCASE = 'https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage'
const STORAGE = path.join(__dirname, '.auth', 'cms.json')
const FLOW = 'http://localhost:8111'
const TAG = `Probe 0031 ${new Date().toISOString().slice(11, 19)}`

const rows = async () => {
  const r = await fetch(`${FLOW}/viz-data/table-all-incidents`).catch(() => null)
  return r && r.ok ? r.json() : []
}
const before = await rows()
console.log(`incidents before: ${before.length}`)

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  storageState: fs.existsSync(STORAGE) ? STORAGE : undefined,
  viewport: { width: 1600, height: 1000 },
})
const page = await ctx.newPage()
const posts = []
page.on('response', async (res) => {
  if (res.request().method() !== 'POST') return
  const body = await res.text().catch(() => '')
  if (/"error"\s*:\s*"?true/i.test(body)) posts.push(body)
})

await page.goto(`${SHOWCASE}/pages/incidents.html`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(6_000)
await page.getByRole('button', { name: /create/i }).first().click()
await page.waitForTimeout(1_500)
await page.getByText(/^Incident$/i).first().click()
await page.waitForTimeout(4_000)

const frame = page.frameLocator('iframe').first()
const type = async (name, value) => {
  const f = frame.locator(`input[name="${name}"], input[name="${name} "]`).first()
  if (await f.isVisible().catch(() => false)) { await f.click(); await f.pressSequentially(value, { delay: 15 }); return true }
  return false
}
console.log('incidenttitle:', await type('incidenttitle', TAG))
console.log('casetitle    :', await type('casetitle', 'phishing, urgent'))
const tlp = frame.locator('select[name="tlp"], select[name="tlp "]').first()
if (await tlp.count()) {
  const opts = await tlp.locator('option').evaluateAll((o) => o.map((x) => x.value).filter(Boolean))
  console.log('tlp options  :', opts.join(', ') || '(none)')
  if (opts.includes('amber')) await tlp.selectOption('amber').catch(() => {})
  else if (opts.length) await tlp.selectOption(opts[0]).catch(() => {})
}
await frame.getByRole('button', { name: /save|create/i }).first().click().catch(() => {})
await page.waitForTimeout(10_000)
await browser.close()

const after = await rows()
console.log(`incidents after : ${after.length}`)
if (posts.length) {
  console.log(`\n🔴 ${posts.length} POST(s) answered 200-with-error:true`)
  const log = /"log"s*:s*"([^"]+)"/.exec(posts[0])?.[1]
  if (log && fs.existsSync(log)) {
    const lines = fs.readFileSync(log, 'utf8').split('\n')
    const i = lines.findIndex((l) => /Traceback/.test(l))
    ;(i >= 0 ? lines.slice(i) : lines.slice(-10)).forEach((l) => {
      const m = /check_io:\d+ - (.*)$/.exec(l)
      if (m && m[1].trim()) console.log('   ' + m[1])
    })
  }
}
const mine = after.find((r) => String(r.name || '').includes(TAG))
if (!mine) { console.log('\n⚠️ the new incident was not found — nothing to inspect'); process.exit(0) }
const o = mine.original || {}
console.log('\ncreated incident:')
console.log('  name                :', JSON.stringify(o.name))
console.log('  labels              :', JSON.stringify(o.labels))
console.log('  object_marking_refs :', JSON.stringify(o.object_marking_refs))
console.log('  description         :', JSON.stringify(o.description))
