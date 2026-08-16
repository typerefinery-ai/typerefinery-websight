/**
 * docs/issues/0163 — what does the Act 2 dashboard actually RENDER?
 *
 * Two claims about that page are unresolved, and they point opposite ways:
 *
 *   1. The issue index row says the stale-cache class covers "the whole Act 2 dashboard".
 *   2. `probe-0163-coldstart-gap.mjs`'s own table leaves the dashboard's topic count as **`?`** —
 *      it was never counted. So claim 1 rests on nothing measured.
 *
 * Read from the content package (2026-08-16), all 7 dashboard widgets carry
 * `websocketTopic="\0"` **and** `dataSource="\0"` — both the empty-string escape. If that holds
 * live, `ns.init` takes neither the TMS branch (`componentHost && componentTopic`) nor the JSON
 * branch, and falls to `modelDataConnected` → `updateComponentHTML({}, …)`.
 *
 * For the ticker that path renders a hardcoded `defaultData` block:
 *
 *     title: "Number of active users", value: "25.5k", indicatorValue: "4.54K",
 *     indicatorPrecisionValue: "Since last quarter"
 *
 * Which would mean the dashboard shows **invented numbers**, not stale ones — a different and
 * more serious defect than the one 0163 records, and the exact thing CLAUDE.md forbids
 * ("Never demonstrate something that is not real").
 *
 * ⚠️ This probe does not assume the package matches live. It reads the live DOM and reports the
 * strings on screen. The oracle is "is a known placeholder literal visible?", not "does it look
 * populated" — a placeholder looks perfectly populated, which is the whole problem.
 *
 *     node e2e/probe-0163-dashboard-defaults.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const PAGE = `${CMS}/content/typerefinery-showcase/pages/os-triage/pages/dashboard.html`
const STATE = path.join(__dirname, '.auth', 'cms.json')

// Literals from the ticker/chart clientlib `defaultData` blocks. Any of these on screen is proof
// the widget rendered its own placeholder rather than data.
const PLACEHOLDERS = [
  'Number of active users',
  '25.5k',
  '4.54K',
  'Since last quarter',
]

const run = async () => {
  if (!fs.existsSync(STATE)) {
    console.error(`no auth state at ${STATE} — run: ./node_modules/.bin/playwright test --project=setup`)
    process.exit(2)
  }
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ storageState: STATE, ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()

  const logs = []
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))

  const resp = await page.goto(PAGE, { waitUntil: 'networkidle', timeout: 60000 })
  console.log(`GET dashboard.html -> ${resp && resp.status()}`)

  // Let the widgets initialise; they render on DOM-ready, not on a network event.
  await page.waitForTimeout(4000)

  const body = await page.evaluate(() => document.body.innerText)

  const found = PLACEHOLDERS.filter((p) => body.includes(p))

  // Count what each widget resolved to, from the widgets' own config, live.
  const widgets = await page.evaluate(() => {
    const out = []
    document.querySelectorAll('[data-model]').forEach((el) => {
      let cfg = {}
      try { cfg = JSON.parse(el.getAttribute('data-model') || '{}') } catch (e) { /* not a widget model */ }
      if (!cfg || (!cfg.websocketTopic && !cfg.dataSource && !cfg.coldStartDataSource && !cfg.variant)) return
      out.push({
        variant: cfg.variant || cfg.resourceType || '?',
        topic: cfg.websocketTopic || '',
        host: cfg.websocketHost || '',
        dataSource: cfg.dataSource || '',
        coldStart: cfg.coldStartDataSource || '',
      })
    })
    return out
  })

  console.log(`\nwidgets carrying a data-model on the live dashboard: ${widgets.length}`)
  const withTopic = widgets.filter((w) => w.topic && w.host)
  const withRoute = widgets.filter((w) => w.coldStart)
  const withJson = widgets.filter((w) => w.dataSource)
  console.log(`  with host+topic (TMS branch, can cache) : ${withTopic.length}`)
  console.log(`  with coldStartDataSource (0163 fix on)  : ${withRoute.length}`)
  console.log(`  with dataSource (JSON branch)           : ${withJson.length}`)
  console.log(`  with NONE -> modelDataConnected         : ${widgets.length - withTopic.length - withJson.length}`)
  for (const w of widgets) {
    console.log(`    ${String(w.variant).padEnd(12)} topic=${w.topic ? 'YES' : '--'} host=${w.host ? 'YES' : '--'} dataSource=${w.dataSource ? 'YES' : '--'} coldStart=${w.coldStart ? 'YES' : '--'}`)
  }

  console.log(`\nplaceholder literals visible on screen: ${found.length}/${PLACEHOLDERS.length}`)
  for (const p of PLACEHOLDERS) console.log(`  ${found.includes(p) ? 'VISIBLE' : 'absent '}  "${p}"`)

  const relevant = logs.filter((l) => /CACHED payload|dataSource|waiting for data|cache/i.test(l))
  console.log(`\nwidget console lines (${relevant.length}):`)
  for (const l of relevant.slice(0, 25)) console.log(`  ${l}`)

  await page.screenshot({ path: path.join(__dirname, 'probe-0163-dashboard-defaults.png'), fullPage: true })

  console.log('\n=== VERDICT ===')
  if (found.length > 0) {
    console.log(`INVENTED DATA ON SCREEN — ${found.length} hardcoded placeholder literal(s) rendered.`)
    console.log('This is NOT the stale-cache class 0163 records; it is the model-default fallback.')
  } else if (withTopic.length > 0) {
    console.log(`no placeholders visible; ${withTopic.length} widget(s) DO take the cache-capable TMS branch —`)
    console.log('the index row\'s "whole Act 2 dashboard" claim is about this branch and needs a sentinel run.')
  } else {
    console.log('no placeholders visible and no widget takes the TMS branch —')
    console.log('the index row\'s "whole Act 2 dashboard" claim does not hold on the live page.')
  }

  fs.writeFileSync(path.join(__dirname, 'probe-0163-dashboard-defaults.json'),
    JSON.stringify({ status: resp && resp.status(), widgets, placeholdersVisible: found, logs: relevant }, null, 2))

  await browser.close()
}

run().catch((e) => { console.error(e); process.exit(1) })
