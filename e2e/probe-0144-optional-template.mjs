import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FORM = 'https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms/identity-forms/identity-create.html'
const STORAGE = path.join(__dirname, '.auth', 'cms.json')
const b = await chromium.launch()
const c = await b.newContext({ ignoreHTTPSErrors: true, storageState: fs.existsSync(STORAGE) ? STORAGE : undefined, viewport: { width: 1600, height: 1000 } })
const p = await c.newPage()
await p.goto(FORM, { waitUntil: 'domcontentloaded', timeout: 120000 })
await p.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {})
await p.waitForTimeout(4000)
const before = await p.locator('[name]').evaluateAll(e => e.map(x => x.getAttribute('name')))
const btn = p.locator('[title="Labels"]').first()
console.log('Labels button count:', await btn.count())
await btn.click({ force: true }).catch(e => console.log('click err', e.message.slice(0,80)))
await p.waitForTimeout(2500)
const after = await p.locator('[name]').evaluateAll(e => e.map(x => x.getAttribute('name')))
const added = after.filter(n => !before.includes(n))
console.log('names added by the click:', JSON.stringify(added))
console.log('any input named labels:', after.filter(n => /label/i.test(n||'')).join(', ') || '(none)')
await b.close()