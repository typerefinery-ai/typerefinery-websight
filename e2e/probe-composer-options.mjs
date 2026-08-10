/**
 * Evidence for runsheet rollup task 3/11 — does the **Composer** widget consume the #82
 * `/viz-data/composer-options` API?
 *
 * The API half has answered 200 with 35 real keys since 2026-08-05 (P0-S7) and nothing read it;
 * the Overview widget's equivalent wiring is asserted by P2-S6/P2-S7. This probe is the Composer's
 * counterpart: it opens the real embedded Composer page, reads the widget frame's console, and
 * then asks the frame itself what `window.Widgets.Panel.Utils.options` ended up holding.
 *
 * It proves the merge rather than the fetch: `current_theme` is a key the built-in defaults do
 * **not** define, so its presence can only have come from the API.
 *
 *     node e2e/probe-composer-options.mjs
 */
import { chromium } from '@playwright/test'

const BASE = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const COMPOSER = '/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage()

const logs = []
page.on('console', (m) => {
  const t = m.text()
  if (t.includes('loadOptions') || t.includes('proceeding with')) logs.push(t)
})

await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 90000 })
if (page.url().includes('login')) {
  await page.locator('[data-testid="login-form-username"]').click()
  await page.locator('[data-testid="login-form-username"]').pressSequentially('wsadmin', { delay: 40 })
  await page.locator('[data-testid="login-form-password"]').click()
  await page.locator('[data-testid="login-form-password"]').pressSequentially('wsadmin', { delay: 40 })
  await page.locator('#login-form button[type="submit"]').click()
  await page.waitForURL((u) => !u.toString().includes('login'), { timeout: 60000 })
}

await page.goto(BASE + COMPOSER, { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForTimeout(25000)

console.log('console lines from the widget:')
for (const l of logs) console.log('  ' + l)

const frame = page.frames().find((f) => f.url().includes('widgetdevcomposer') || f.url().includes(':4005'))
if (!frame) {
  console.log('\nFAIL — no composer widget frame on the page')
  await browser.close()
  process.exit(1)
}

const state = await frame.evaluate(() => {
  const o = (window.Widgets && window.Widgets.Panel && window.Widgets.Panel.Utils || {}).options || {}
  return {
    keys: Object.keys(o).length,
    current_theme: o.current_theme,
    icon_size: o.icon_size,
    api: o.api ? Object.keys(o.api) : null,
    themeTooltipFill: o.theme && o.theme.tooltip ? o.theme.tooltip.fill : null,
  }
})

console.log('\nwidget frame options:', JSON.stringify(state, null, 1))

// `current_theme` and `icon_size` are not in the widget's built-in defaults — if they are present,
// the API payload was merged, not merely fetched.
const merged = state.current_theme !== undefined && state.icon_size !== undefined
console.log(`\n${merged ? 'PASS' : 'FAIL'} — Composer options ${merged ? 'merged from the API' : 'NOT merged; defaults only'}`)

await browser.close()
process.exit(merged ? 0 : 1)
