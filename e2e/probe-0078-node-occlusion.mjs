/**
 * alpha-launch 0078 — how many Composer nodes are unclickable because another node sits on top?
 *
 * Found while fixing 0077: a click on an oracle-approved node timed out with
 *     <image id="email-addr--b0708db8…"> intercepts pointer events
 * The target (x=314.3, y=318) was overlapped by a sibling (x=319.1, same y). Visible, enabled and
 * stable — and unclickable.
 *
 * This measures it directly: for every node in every pane, is the element at its own centre point
 * itself, or something else? That is exactly the check Playwright's actionability performs.
 */
import { chromium } from '@playwright/test'
import path from 'path'

const CMS = 'https://cms.typerefinery.localhost:8101'
const COMPOSER = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html`

const b = await chromium.launch()
const ctx = await b.newContext({ ignoreHTTPSErrors: true, storageState: path.resolve('.auth/cms.json') })
const page = await ctx.newPage()
await page.goto(COMPOSER, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(12_000)

const frame = page.frames().find((f) => /widgetdevcomposer|4005/.test(f.url()))
if (!frame) {
  console.log('widget frame not found')
  await b.close()
  process.exit(1)
}

const report = await frame.evaluate(() => {
  const out = {}
  for (const pane of ['tree_svg', 'promo_svg', 'scratch_svg']) {
    const svg = document.querySelector(`svg.${pane}`)
    if (!svg) continue
    const nodes = Array.from(svg.querySelectorAll('image'))
    const occluded = []
    for (const el of nodes) {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) continue
      const cx = r.x + r.width / 2
      const cy = r.y + r.height / 2
      const top = document.elementFromPoint(cx, cy)
      if (top && top !== el) {
        occluded.push({
          id: (el.getAttribute('id') || '').slice(0, 40),
          x: Math.round(r.x),
          y: Math.round(r.y),
          coveredBy: (top.getAttribute && top.getAttribute('id')) || top.tagName,
        })
      }
    }
    out[pane] = { total: nodes.length, occluded: occluded.length, examples: occluded.slice(0, 6) }
  }
  return out
})

let total = 0
let hidden = 0
for (const [pane, r] of Object.entries(report)) {
  total += r.total
  hidden += r.occluded
  const pct = r.total ? Math.round((100 * r.occluded) / r.total) : 0
  console.log(`${pane.padEnd(12)} ${String(r.total).padStart(3)} nodes, ${String(r.occluded).padStart(3)} occluded (${pct}%)`)
  for (const e of r.examples) console.log(`     ${e.id.padEnd(42)} @${e.x},${e.y}  covered by ${e.coveredBy}`)
}
console.log(`\ntotal: ${hidden} of ${total} nodes unclickable (${total ? Math.round((100 * hidden) / total) : 0}%)`)

await b.close()
