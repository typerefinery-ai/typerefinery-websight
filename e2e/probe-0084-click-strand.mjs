/**
 * docs/issues/0084 — the "click strand": left-selecting a node does not open its Update form.
 *
 * 0084 records the strand as UNEXPLAINED. The tooltip-hit-shield hypothesis was already hardened
 * against (`pointer-events: none` is live in the served bundle) and explicitly documented as
 * "hardening, not a demonstrated fix".
 *
 * New evidence from the 2026-08-12 Chrome walkthrough: a real mouse click **does** reach the node —
 * the JSON hover tooltip appears — but no form ever loads. So hit-testing is NOT the problem, and
 * the failure is somewhere in click handler -> openFormForNode -> openForm -> host.
 *
 * The widget logs at each stage:
 *   "Node selected:"                                   click handler ran
 *   "open form for node <id> <payloadOptions>"         routing fields present, about to call openForm
 *   "openFormForNode: node is missing the form routing fields"   <- the guard
 *
 * This probe captures console from EVERY frame and watches for the form frame navigating, so the
 * stage that drops the request is named rather than guessed at.
 *
 *     node e2e/probe-0084-click-strand.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const PAGE = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html`
const STATE = path.join(__dirname, '.auth', 'cms.json')
const NODE = 'svg image.node-image, svg image, svg g.node'

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()

const INTERESTING = /Node selected|open form|openForm|routing fields|form url|categorise|embed-viz-event/i
page.on('console', (m) => {
  const t = m.text()
  if (INTERESTING.test(t)) console.log(`  [${m.type()}] ${t.slice(0, 400)}`)
})
page.on('pageerror', (e) => console.log(`  [PAGEERROR] ${String(e).slice(0, 300)}`))
page.on('framenavigated', (f) => {
  if (/stixorm-forms|forms\//.test(f.url())) console.log(`  [FRAMENAV] ${f.url().split('/os-triage/')[1] || f.url()}`)
})
page.on('requestfailed', (r) => {
  if (/forms/.test(r.url())) console.log(`  [REQFAIL] ${r.url().slice(-70)} — ${r.failure()?.errorText}`)
})
page.on('response', async (r) => {
  if (/stixorm-forms|updateincident/.test(r.url())) console.log(`  [RESP] ${r.status()} ${r.url().split('/os-triage/')[1] || r.url()}`)
})

console.log('\n--- open overview ---')
await page.goto(PAGE)

const graph = page.frameLocator('iframe[src*="widgetdevoverview"], iframe[src*="4008"]').first()
const nodes = graph.locator(NODE)
await nodes.first().waitFor({ state: 'visible', timeout: 60_000 })
const total = await nodes.count()
console.log(`  nodes in graph: ${total}`)

const formState = async () => {
  for (const f of page.frames()) {
    if (!/stixorm-forms|forms\//.test(f.url())) continue
    if (/overview-local/.test(f.url())) continue
    const inputs = await f.locator('input, select, textarea').count().catch(() => 0)
    return `${f.url().split('/').slice(-1)[0]} inputs=${inputs}`
  }
  return '(no form frame)'
}
console.log(`  form before: ${await formState()}`)

for (const i of [0, 1, 2]) {
  console.log(`\n--- click node #${i} ---`)
  await nodes.nth(i).click({ force: true })
  await page.waitForTimeout(6000)
  console.log(`  form after : ${await formState()}`)
}

await browser.close()
