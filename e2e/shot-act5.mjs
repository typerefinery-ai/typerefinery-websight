import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = process.argv[2] || '.'
const CMS = 'https://cms.typerefinery.localhost:8101'
const P = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms/identity-forms/identity-create.html'
const b = await chromium.launch({ channel: 'chrome', headless: false })
const p = await (await b.newContext({ ignoreHTTPSErrors: true,
  storageState: path.join(__dirname, '.auth', 'cms.json'), viewport: { width: 1600, height: 1000 } })).newPage()
await p.goto(CMS + P, { waitUntil: 'domcontentloaded', timeout: 120_000 })
await p.waitForTimeout(12000)
const groups = await p.locator('legend, .group-title, h2, h3, .card-header').allInnerTexts()
console.log('group captions:', [...new Set(groups.map(t=>t.replace(/\s+/g,' ').trim()).filter(Boolean))].join(' | '))
const labels = await p.locator('label').allInnerTexts()
console.log('field labels:', [...new Set(labels.map(t=>t.replace(/\s+/g,' ').trim()).filter(Boolean))].slice(0,20).join(' · '))
const btns = await p.locator('button').allInnerTexts()
console.log('buttons:', [...new Set(btns.map(t=>t.replace(/\s+/g,' ').trim()).filter(Boolean))].slice(0,12).join(' · '))
await p.screenshot({ path: path.join(OUT, 'act5-full.png') })
await b.close()
