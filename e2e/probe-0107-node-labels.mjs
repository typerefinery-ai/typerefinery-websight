/**
 * docs/issues/0107 Option 2 — are the Overview's nodes labelled, and did labelling break clicking?
 *
 * Two things are measured, because the first without the second would be a regression waiting to
 * happen: this widget has a documented history of an invisible overlay swallowing node clicks
 * (docs/issues/0084), and a text label sitting under every node is exactly that shape.
 *
 *   1. every node has a non-empty label, and specific known names from the payload are on screen
 *      (a "some text exists" check would pass on the edge labels that were already there)
 *   2. NO node centre routes to a label — i.e. the labels are out of hit-testing
 *
 *     node e2e/probe-0107-node-labels.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const FLOW = process.env.FLOW_BASE || 'http://localhost:8111'
const URL = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html`

// Names the payload actually carries, so the assertion is specific rather than "some text".
const res = await fetch(`${FLOW}/viz-data/overview-default-incident`)
const payload = await res.json()
const wanted = (payload.nodes || [])
  // `name` is not always a string - the impact node carries the NUMBER 99 (docs/issues/0107).
  .map((n) => String(n.name ?? '').trim())
  .filter((s) => s && !/^[a-z0-9-]+--[0-9a-f-]{8,}$/i.test(s) && s.length > 6)
  .slice(0, 4)
console.log(`expecting these payload names on screen: ${JSON.stringify(wanted)}`)

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1400, height: 950 },
  ignoreHTTPSErrors: true,
  storageState: path.join(__dirname, '.auth', 'cms.json'),
})
const page = await context.newPage()
await page.goto(URL, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(25000)

const handle = await page.locator('iframe[src*="widgetdevoverview"]').elementHandle()
const frame = handle ? await handle.contentFrame() : null
if (!frame) {
  console.error('FAIL - could not reach the overview widget iframe.')
  await browser.close()
  process.exit(1)
}

const r = await frame.evaluate(() => {
  const icons = [...document.querySelectorAll('svg image.node-image')]
  const labels = [...document.querySelectorAll('text.node-label')]
  const texts = labels.map((l) => (l.textContent || '').trim())

  // Does any node centre route to a label instead of the node? (docs/issues/0084's failure mode.)
  let shielded = 0
  const shieldedBy = []
  for (const ic of icons) {
    const b = ic.getBoundingClientRect()
    const el = document.elementFromPoint(Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2))
    if (el && el.tagName.toLowerCase() === 'text') {
      shielded++
      shieldedBy.push((el.textContent || '').trim())
    }
  }
  return { icons: icons.length, labels: labels.length, empty: texts.filter((t) => !t).length, texts, shielded, shieldedBy }
})

console.log(`\nicons: ${r.icons}   labels: ${r.labels}   empty labels: ${r.empty}`)
console.log(`labels on screen: ${JSON.stringify(r.texts.slice(0, 12))}`)
console.log(`node centres routed to a label (hit-shield): ${r.shielded}`)

const present = wanted.filter((w) => r.texts.some((t) => t === w || w.startsWith(t.replace(/…$/, ''))))
console.log(`\nspecific payload names rendered: ${present.length}/${wanted.length} ${JSON.stringify(present)}`)

const ok = r.labels === r.icons && r.empty === 0 && r.shielded === 0 && present.length === wanted.length
console.log('\n=== VERDICT ===')
console.log(`one label per node : ${r.labels === r.icons}`)
console.log(`no empty labels    : ${r.empty === 0}`)
console.log(`no click shielding : ${r.shielded === 0}`)
console.log(`named nodes present: ${present.length === wanted.length}`)
console.log(ok ? 'PASS' : 'FAIL')

await browser.close()
process.exit(ok ? 0 : 1)
