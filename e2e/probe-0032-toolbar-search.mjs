/**
 * decision 0032 — does the toolbar Search now filter the table?
 *
 * ⚠️ The input emits on `change`, not on keystroke, so the value must be COMMITTED (blur or Enter).
 * Typing alone proves nothing — that is the third of the three shape/behaviour mismatches this
 * feature needed.
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PAGE = 'https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage/pages/incidents.html'
const STORAGE = path.join(__dirname, '.auth', 'cms.json')

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  storageState: fs.existsSync(STORAGE) ? STORAGE : undefined,
  viewport: { width: 1600, height: 1000 },
})
const page = await ctx.newPage()
const logs = []
page.on('console', (m) => { const t = m.text(); if (/registerEvents|eventOnFilter|emitEvent/.test(t)) logs.push(t.slice(0, 160)) })

await page.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 120_000 })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.locator('table:has(tbody tr) tbody tr').first().waitFor({ timeout: 120_000 })

const rows = async () => await page.locator('tbody tr').count()
console.log(`rows on load: ${await rows()}`)

const box = page.locator('input[name="case"], input[name="case "]').first()
console.log(`toolbar box visible: ${await box.isVisible().catch(() => false)}`)
await box.click()
await box.pressSequentially('phishing', { delay: 30 })
console.log(`after typing (no commit): ${await rows()}`)

// Commit the value — the input emits on `change`.
await box.blur().catch(() => {})
await page.waitForTimeout(2500)
const after = await rows()
console.log(`after blur (change fired):  ${after}`)

console.log('\nrelevant console lines:')
logs.slice(0, 8).forEach((l) => console.log('  ' + l))
await browser.close()
