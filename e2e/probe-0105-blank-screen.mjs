/**
 * docs/issues/0105 — how long is the graph pane blank, and is anything shown while it is?
 *
 * ⚠️ This is the single most demo-visible open issue I have not measured: Act 2 opens with the
 * Overview graph, and every walk in this repo waits ~26 s before asserting on it. If that time is a
 * blank white pane with no indication that anything is happening, it is the worst moment in the demo
 * — the audience's first impression of the product is a screen doing nothing.
 *
 * Measures, on the real embedded page, sampling every 250 ms from navigation:
 *   t_firstPaint    when the widget iframe first has ANY visible content
 *   t_firstNode     when the first graph node appears
 *   t_settled       when the node count stops changing
 *   loadingShown    whether a spinner / skeleton / "loading" text was visible at any point
 *   whatWasOnScreen a sample of the pane's text during the wait, so "blank" is evidenced not assumed
 *
 * ⚠️ Reports what was ACTUALLY on screen rather than concluding "blank" from an absent selector —
 * an empty query proves the selector wrong just as easily as it proves the screen empty.
 *
 *     node e2e/probe-0105-blank-screen.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html'
const MAP = path.join(
  __dirname, '..', '..', 'typerefinery', 'services', 'fastapi', 'generated', 'os-triage',
  'context_mem', 'context_map.json',
)
console.log(`current_incident: ${JSON.parse(fs.readFileSync(MAP, 'utf8')).current_incident}\n`)

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

const t0 = Date.now()
const at = () => ((Date.now() - t0) / 1000).toFixed(1)
await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
console.log(`domcontentloaded at ${at()}s`)

let tFirstNode = null
let tFirstPaint = null
let loadingShown = false
const seenText = new Set()
let lastCount = -1
let settledSince = null
let tSettled = null

for (let i = 0; i < 200; i++) {
  const f = page.frames().find((fr) => /widgetdevoverview/.test(fr.url()))
  if (f) {
    const s = await f
      .evaluate(() => {
        const body = document.body
        const txt = (body?.innerText || '').replace(/\s+/g, ' ').trim()
        return {
          nodes: document.querySelectorAll('svg image').length,
          hasSvg: !!document.querySelector('svg'),
          text: txt.slice(0, 90),
          // Anything that would tell a viewer "working on it"
          loading: /loading|please wait|fetching/i.test(txt) ||
            !!document.querySelector('.spinner, .loading, [class*="spinner"], [class*="loading"], progress'),
        }
      })
      .catch(() => null)
    if (s) {
      if (s.loading) loadingShown = true
      if (s.text) seenText.add(`${at()}s: ${s.text}`)
      if (tFirstPaint === null && (s.hasSvg || s.text)) tFirstPaint = at()
      if (tFirstNode === null && s.nodes > 0) { tFirstNode = at(); console.log(`first node at ${tFirstNode}s`) }
      if (s.nodes > 0) {
        if (s.nodes === lastCount) {
          if (settledSince === null) settledSince = Date.now()
          else if (Date.now() - settledSince > 3000 && tSettled === null) { tSettled = at(); break }
        } else { settledSince = null; lastCount = s.nodes }
      }
    }
  }
  await page.waitForTimeout(250)
}

console.log(`\nt_firstPaint (iframe shows anything) : ${tFirstPaint ?? '(never)'}s`)
console.log(`t_firstNode  (first graph node)      : ${tFirstNode ?? '(never)'}s`)
console.log(`t_settled    (count stable 3 s)      : ${tSettled ?? '(not reached)'}s   nodes=${lastCount}`)
console.log(`loading indicator seen at any point  : ${loadingShown ? 'YES' : 'NO'}`)
console.log('\nwhat the pane actually showed while waiting:')
;[...seenText].slice(0, 8).forEach((t) => console.log('  ' + t))
if (!seenText.size) console.log('  (no text at any sample — the pane carried nothing readable)')

await page.screenshot({ path: path.join(process.argv[2] || '.', 'act2-after-settle.png') })
await browser.close()
