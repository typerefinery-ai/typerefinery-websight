/**
 * docs/issues/0104 / 0105 — does the Composer's "Loading graph data…" toast EVER appear?
 *
 * ⚠️ Why this matters beyond polish. P3-S11 asserts the loading toast has **cleared**, guarded so it
 * cannot pass with empty panes (`sawContent`). But "cleared" is only meaningful if the toast is ever
 * **shown** — if the mechanism is dead, the step passes while proving nothing about it, and 0105
 * asked exactly that: *"Is the loading toast dead, and is P3-S11 therefore passing vacuously?"*
 *
 * The 0105 probe already found **no loading indicator at any sample** on the Overview. This asks the
 * same of the Composer, where P3-S11 actually runs, sampling every 200 ms **from navigation** — a
 * toast with a 5 s life is easy to miss with a coarse sample, so the sampling rate is the whole
 * design.
 *
 * Reports what it saw rather than concluding from an absent selector: matches the toast by its own
 * class (`.toastify`, the widget's notification library) AND by text, so a renamed class cannot be
 * mistaken for "no toast".
 *
 *     node e2e/probe-0104-loading-toast-exists.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html'
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

const toastSightings = []
const textsSeen = new Set()
let nodesAt = null

for (let i = 0; i < 200; i++) {
  for (const f of page.frames()) {
    if (!/widgetdevcomposer/.test(f.url())) continue
    const r = await f
      .evaluate(() => {
        const toasts = [...document.querySelectorAll('.toastify, [class*="toast"]')]
        return {
          toasts: toasts.map((t) => (t.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean),
          nodes: document.querySelectorAll('svg image').length,
        }
      })
      .catch(() => null)
    if (r) {
      if (r.nodes > 0 && nodesAt === null) nodesAt = at()
      for (const t of r.toasts) { toastSightings.push(`${at()}s: ${t.slice(0, 70)}`); textsSeen.add(t.slice(0, 70)) }
    }
  }
  if (nodesAt && Date.now() - t0 > 25_000) break
  await page.waitForTimeout(200)
}

console.log(`first pane nodes at        : ${nodesAt ?? '(never)'}s`)
console.log(`toast sightings (any kind) : ${toastSightings.length}`)
if (toastSightings.length) {
  console.log('distinct toast texts:')
  ;[...textsSeen].forEach((t) => console.log(`   "${t}"`))
  console.log('first few sightings:')
  toastSightings.slice(0, 6).forEach((t) => console.log('   ' + t))
} else {
  console.log('⚠️ NO toast of any kind was observed at 200 ms sampling through the whole load.')
}
const sawLoading = [...textsSeen].some((t) => /loading/i.test(t))
console.log(`\n"Loading graph data" style toast seen: ${sawLoading ? 'YES' : 'NO'}`)
console.log(sawLoading
  ? '→ P3-S11 guards a mechanism that demonstrably runs.'
  : '→ ⚠️ P3-S11 asserts a toast has CLEARED that was never SHOWN. It still catches a stuck toast, ' +
    'but it is not evidence the loading-state mechanism works — which is 0105\'s "no loading state" finding.')
await browser.close()
