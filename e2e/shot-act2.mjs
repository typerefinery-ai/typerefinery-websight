import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = process.argv[2] || '.'
const b = await chromium.launch({ channel: 'chrome', headless: false })
const p = await (await b.newContext({ ignoreHTTPSErrors: true,
  storageState: path.join(__dirname, '.auth', 'cms.json'), viewport: { width: 1600, height: 1000 } })).newPage()
await p.goto('https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html',
  { waitUntil: 'domcontentloaded', timeout: 120_000 })
await p.waitForTimeout(26000)
const f = p.frames().find(fr => /widgetdevoverview/.test(fr.url()))
if (f) {
  const r = await f.evaluate(() => ({
    nodes: document.querySelectorAll('svg image').length,
    labels: [...document.querySelectorAll('svg text')].map(t => t.textContent.trim()).filter(Boolean).slice(0, 14),
  }))
  console.log('graph nodes:', r.nodes)
  console.log('labels:', r.labels.join(' · '))
}
const txt = (await p.locator('body').innerText()).replace(/\s+/g, ' ').trim()
console.log('page text:', txt.slice(0, 260))
await p.screenshot({ path: path.join(OUT, 'act2-full.png') })
await b.close()
