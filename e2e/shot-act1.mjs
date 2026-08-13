import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = process.argv[2] || '.'
const b = await chromium.launch({ channel: 'chrome', headless: false })
const p = await (await b.newContext({ ignoreHTTPSErrors: true,
  storageState: path.join(__dirname, '.auth', 'cms.json'), viewport: { width: 1600, height: 1000 } })).newPage()
await p.goto('https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage/pages/incidents.html',
  { waitUntil: 'domcontentloaded', timeout: 120_000 })
await p.waitForSelector('tbody tr', { timeout: 60_000 })
await p.waitForTimeout(4000)
const hdr = await p.locator('table thead th').allInnerTexts()
console.log('columns:', hdr.map(h => h.trim()).filter(Boolean).join(' | '))
const btns = await p.locator('button, a.btn, .btn').allInnerTexts()
console.log('buttons:', [...new Set(btns.map(t => t.replace(/\s+/g,' ').trim()).filter(Boolean))].slice(0,12).join(' · '))
await p.screenshot({ path: path.join(OUT, 'act1-full.png'), fullPage: false })
await b.close()
