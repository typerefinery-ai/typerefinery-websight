/**
 * Refresh e2e/.auth/cms.json by performing a REAL login — credentials are TYPED
 * (pressSequentially), never assigned via input.value, per the P0-S5 rule.
 *
 *     node e2e/refresh-auth-state.mjs
 *
 * Written 2026-08-15: the walk scripts' storageState had been invalidated by a CMS
 * restart, and no committed script existed to rebuild it (diagnose-table.mjs logs in
 * but does not save state).
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const STATE = path.join(__dirname, '.auth', 'cms.json')

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const context = await browser.newContext({ ignoreHTTPSErrors: true })
const page = await context.newPage()

await page.goto(`${CMS}/apps/websight/index.html`, { waitUntil: 'domcontentloaded' })

const user = page.locator('[data-testid="login-form-username"]')
if (await user.count()) {
  await user.pressSequentially('wsadmin', { delay: 40 })
  await page.locator('[data-testid="login-form-password"]').pressSequentially('wsadmin', { delay: 40 })
  await page.locator('button[type="submit"]').click()
  await page.waitForLoadState('networkidle')
  console.log('logged in; landed on', page.url())
} else {
  console.log('no login form shown — existing session still valid; landed on', page.url())
}

await context.storageState({ path: STATE })
console.log('storage state saved to', STATE)
await browser.close()
