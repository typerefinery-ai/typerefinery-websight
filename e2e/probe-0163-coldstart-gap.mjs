/**
 * docs/issues/0163 — is the deployed authority-inversion fix actually REACHED on the pages that cache?
 *
 * The fix (`fa3c1a0d`, shipped 2026-08-16 02:20Z) reads:
 *
 *     const componentDataSource = componentConfig.coldStartDataSource;
 *     if (componentDataSource) { ...live fetch is authoritative, cache held in reserve... }
 *     // No live route configured — the cache is all there is.
 *     if (componentData) { cachedPayloadConnected(...) }
 *
 * So it is **conditional on `coldStartDataSource` being authored**. Counting the authored content:
 *
 *     page          widgets  coldStartDataSource  topic
 *     incidents        4              1             4     <- 0152's original fix
 *     observables      3              0             1
 *     artifacts        3              0             2
 *     notes            3              0             2
 *     tasks            4              0             2
 *     dashboard       21              0             ?
 *
 * Only the incidents table has a route. Every other topic-bearing widget falls through to
 * "the cache is all there is" — i.e. still renders a cached payload unconditionally, which is exactly
 * 0152/0163's fabricated-screen mechanism.
 *
 * This plants a sentinel under a REAL authored topic key on such a page and reports whether it reaches
 * the screen. Inference is not evidence; this is the evidence.
 *
 *     node e2e/probe-0163-coldstart-gap.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const BASE = `${CMS}/content/typerefinery-showcase/pages/os-triage/pages`
const STATE = path.join(__dirname, '.auth', 'cms.json')
const SENTINEL = 'ZZ-STALE-SENTINEL-0163'

// A real authored topic on a page with NO coldStartDataSource.
const TARGET = { page: 'artifacts', topic: process.env.TOPIC || 'table_c712cd587344499eba66af31cd3f18c7' }

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()
const logs = []
page.on('console', (m) => {
  const t = m.text()
  if (/cache|localStorage|cold|authoritative|reserve|0163/i.test(t)) logs.push(`[${m.type()}] ${t.slice(0, 220)}`)
})

const url = `${BASE}/${TARGET.page}.html`
console.log(`--- ${TARGET.page}: plant a sentinel under authored topic ${TARGET.topic} ---`)
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(4_000)

const baselineText = await page.evaluate(() => document.body.innerText.slice(0, 400))
console.log(`  baseline body text (first 120): ${JSON.stringify(baselineText.slice(0, 120))}`)

await page.evaluate(
  ({ topic, SENTINEL }) => {
    // ⚠️ The payload SHAPE matters. A first attempt used {columns:[{field,title}], data:[…]} and the
    // widget logged "cached payload is unreadable; discarding — TypeError: reading 'visible'", so the
    // sentinel never painted. That is NOT the fix working: the log also showed
    // "table rendering CACHED payload of unknown age" immediately before, i.e. the cache-first branch
    // DID engage. Reading that run as a pass would have been a false negative — the probe must hand
    // the widget something it can actually render, or it proves nothing.
    localStorage.setItem(
      topic,
      JSON.stringify({
        columns: [[
          { field: 'name', title: 'Name', visible: true, sortable: true },
          { field: 'id', title: 'ID', visible: true, sortable: true },
        ]],
        data: [{ name: SENTINEL, id: 'artifact--sentinel-0163' }],
      }),
    )
  },
  { topic: TARGET.topic, SENTINEL },
)
console.log('  planted; reloading …')

logs.length = 0
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(8_000)

const body = await page.evaluate(() => document.body.innerText)
const onScreen = body.includes(SENTINEL)
console.log(`\n  sentinel on screen: ${onScreen ? 'YES' : 'no'}`)
console.log(`  cache-related log lines: ${logs.length}`)
for (const l of logs.slice(0, 10)) console.log(`    ${l}`)

// ⚠️ "Is the sentinel on screen?" is the WRONG oracle on its own, and reading it that way produced a
// false pass twice in this probe's own history: a synthetic payload the widget cannot render never
// paints, so the screen stays clean while the defect is fully present. The mechanism this issue is
// about is *which branch the code takes*, and the widget says so itself — `cachedPayloadConnected`
// logs "rendering CACHED payload of unknown age" before it renders anything. Key on that.
const engagedCacheFirst = logs.some((l) => /rendering CACHED payload/i.test(l))
const discarded = logs.some((l) => /cached payload is unreadable/i.test(l))

console.log('\n--- verdict ---')
if (onScreen) {
  console.log('  ❌ CONFIRMED GAP, end to end — a planted cache payload RENDERS as live data on a widget')
  console.log('     that has a topic but NO coldStartDataSource.')
} else if (engagedCacheFirst) {
  console.log('  ❌ CONFIRMED GAP, at the mechanism — the widget took the cache-first branch on a topic')
  console.log('     with NO coldStartDataSource ("rendering CACHED payload of unknown age"). The sentinel')
  console.log('     did not paint only because this synthetic payload was not renderable' + (discarded ? ' (it was' : ''))
  console.log('     ' + (discarded ? 'discarded as unreadable — that discard guard is 0163\'s, and it works).' : ').'))
  console.log('     A payload cached by a REAL earlier session would paint. 0163\'s authority inversion is')
  console.log('     deployed but INERT here: it only engages when a cold-start route is authored, and')
  console.log('     only the incidents table has one. The remaining work is AUTHORING routes, not more JS.')
} else {
  console.log('  ✅ no cache-first branch was taken and nothing planted reached the screen — the gap does')
  console.log('     not reproduce here; record what this page does instead before generalising.')
}

fs.writeFileSync(path.join(__dirname, 'probe-0163-coldstart-gap.json'), JSON.stringify({ TARGET, onScreen, logs }, null, 2))
console.log('  written: e2e/probe-0163-coldstart-gap.json')
await browser.close()
