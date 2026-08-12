/**
 * docs/issues/0157 Option 3 — which topic does the Composer raise on left-select, and what does the
 * pane actually end up showing?
 *
 * The page authors THREE form-open components on one embed, and the host dispatches a single raised
 * topic to all of them:
 *
 *   …-sro-forms-relationship-form   -> HARDCODED relationship-create.html
 *   …-open-stixorm-forms-object     -> templated {family}/{group}/{form}-update.html   (correct)
 *   …-sro-forms-connection-form     -> templated
 *
 * Measured: the widget raises the CORRECT topic, yet the pane lands on relationship-create.
 *
 * This clicks several nodes in sequence, as P3-S5 does, and reports what the pane holds after each —
 * which answers the question that decides the fix: does the object component ever win (making this
 * about ORDERING), or never (making it about SUBSCRIPTION)?
 *
 *     node e2e/probe-0157-which-topic-fires.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'

const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const COMPOSER = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html`
const STATE = 'e2e/.auth/cms.json'

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()

const topics = []
page.on('console', (m) => {
  const t = m.text()
  if (/actionComponents|event raised|updating iframe source to/.test(t)) topics.push(t.slice(0, 200))
})

await page.goto(COMPOSER, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(12000)

const graph = page.frameLocator('iframe[src*="widgetdevcomposer"], iframe[src*="4005"]').first()
const nodes = graph.locator('svg.promo_svg').locator('image, g.node, circle')
await nodes.first().waitFor({ state: 'visible', timeout: 60_000 }).catch(() => {})

const formFrame = () => page.frames().find((f) => /stixorm-forms/.test(f.url()) && !/default/.test(f.url()))

console.log(`promo nodes: ${await nodes.count()}`)
console.log(`form frame before: ${formFrame()?.url().split('/').slice(-1)[0] ?? '(none)'}`)

const shapeOf = async (frame) => {
  if (!frame) return { filled: 0, total: 0 }
  const vals = await frame
    .locator('input')
    .evaluateAll((els) =>
      els
        .filter((e) => e.type !== 'hidden' && !e.className.includes('choices__input'))
        .map((e) => e.value.trim()),
    )
    .catch(() => [])
  return { filled: vals.filter(Boolean).length, total: vals.length }
}

const count = Math.min(await nodes.count(), 6)
for (let i = 0; i < count; i++) {
  await nodes.nth(i).click({ force: true }).catch(() => {})
  await page.waitForTimeout(4000)
  const f = formFrame()
  const { filled, total } = await shapeOf(f)
  const name = f ? f.url().split('/').slice(-1)[0] : '(none)'
  console.log(`  click #${i}: ${name}  ${filled}/${total} filled`)
}

console.log(`\nnavigation / dispatch lines (${topics.length}):`)
topics.slice(-6).forEach((t) => console.log('   ' + t))

await browser.close()
