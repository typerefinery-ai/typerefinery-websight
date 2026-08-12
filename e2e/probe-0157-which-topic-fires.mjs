/**
 * docs/issues/0157 Option 3 — which topic does the Composer raise on left-select?
 *
 * The page authors TWO competing form-open events on the same embed:
 *   11  …-sro-forms-relationship-form   -> HARDCODED relationship-create.html
 *   12  …-open-stixorm-forms-object     -> templated {family}/{group}/{form}-update.html
 *
 * Measured in a combined run, ten nodes of five types all landed on relationship-create and the pane
 * then froze. This asks the prior question - which topic actually fires - BEFORE any authored event
 * is touched, because Option 1 deletes content on the strength of a hypothesis.
 *
 *     node e2e/probe-0157-which-topic-fires.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const COMPOSER = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html`
const STATE = 'e2e/.auth/cms.json'

const browser = await chromium.launch()
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, ...(fs.existsSync(STATE) ? { storageState: STATE } : {}) })
const page = await ctx.newPage()

const topics = []
page.on('console', (m) => {
  const t = m.text()
  if (/stixorm-forms-object|relationship-form|connection-form|updating iframe source to/.test(t)) {
    topics.push(t.slice(0, 220))
  }
})

await page.goto(COMPOSER, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(12000)

const graph = page.frameLocator('iframe[src*="widgetdevcomposer"], iframe[src*="4005"]').first()
const nodes = graph.locator('svg.promo_svg').locator('image, g.node, circle')
await nodes.first().waitFor({ state: 'visible', timeout: 60_000 }).catch(() => {})

const formFrame = () => page.frames().find((f) => /stixorm-forms/.test(f.url()) && !/default/.test(f.url()))
console.log(`promo nodes: ${await nodes.count()}`); console.log(`form frame before: ${formFrame()?.url().split('/').slice(-1)[0] ?? '(none)'}`)

topics.length = 0
await nodes.first().click({ force: true }).catch((e) => console.log('  click failed: ' + String(e).slice(0, 80)))
await page.waitForTimeout(8000)

console.log(`form frame after : ${formFrame()?.url().split('/').slice(-1)[0] ?? '(none)'}`)
console.log(`\ntopic/navigation lines captured (${topics.length}):`)
topics.slice(0, 25).forEach((t) => console.log('   ' + t))

await browser.close()
