/**
 * For the CURRENT incident, measure everything the demo shows of it, in one pass:
 *
 *   Act 2  Overview   — force-graph node count
 *   Act 3  Composer   — Promotable / Scratch node counts, and each pane's FILL of its svg
 *   Act 3  Evidence   — entries in the left "Evidence List" tree
 *
 * ⚠️ Why this exists. Decision 0036 authored a dedicated "image5 walkthrough" incident so the
 * Composer's Promotable pane matches the mockup's 8-object cast instead of a 59-node hairball, and
 * noted that `current_incident` is deliberately NOT switched to it because it has no ATTACHED
 * objects. What that note does not say is what the *rest* of the demo looks like on that incident —
 * Act 2 and the Evidence tree both read attached objects. Since a presenter switching incidents mid
 * demo is a real action, the trade has to be measured on both incidents rather than assumed.
 *
 * Run it once per incident (switch with set-current-incident-by-ui.mjs) and compare.
 *
 *     node e2e/probe-incident-demo-readiness.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const P = '/content/typerefinery-showcase/pages/os-triage/forms'
const MAP = path.join(
  __dirname, '..', '..', 'typerefinery', 'services', 'fastapi', 'generated', 'os-triage',
  'context_mem', 'context_map.json',
)

const incident = JSON.parse(fs.readFileSync(MAP, 'utf8')).current_incident
console.log(`\n#### current_incident: ${incident}\n`)

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  storageState: path.join(__dirname, '.auth', 'cms.json'),
  viewport: { width: 1600, height: 1000 },
})
const page = await ctx.newPage()

// ---- Act 2
await page.goto(`${CMS}${P}/overview-local.html`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(24_000)
const ov = page.frames().find((f) => /widgetdevoverview/.test(f.url()))
const overviewNodes = ov ? await ov.evaluate(() => document.querySelectorAll('svg image').length).catch(() => -1) : -1
console.log(`Act 2  Overview      : ${overviewNodes} node(s)`)

// ---- Act 3
await page.goto(`${CMS}${P}/composer-local.html`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(26_000)
const co = page.frames().find((f) => /widgetdevcomposer/.test(f.url()))
if (!co) { console.log('Act 3: composer frame not found'); await browser.close(); process.exit(1) }

const panes = await co.evaluate(() => {
  const r = {}
  for (const cls of ['promo_svg', 'scratch_svg']) {
    const svg = document.querySelector(`svg.${cls}`)
    if (!svg) { r[cls] = null; continue }
    const p = svg.getBoundingClientRect()
    const boxes = [...svg.querySelectorAll('image')].map((n) => n.getBoundingClientRect()).filter((b) => b.width > 0)
    if (!boxes.length) { r[cls] = { nodes: 0, fill: 0, paneW: Math.round(p.width), paneH: Math.round(p.height) }; continue }
    const w = Math.max(...boxes.map((b) => b.right)) - Math.min(...boxes.map((b) => b.left))
    const h = Math.max(...boxes.map((b) => b.bottom)) - Math.min(...boxes.map((b) => b.top))
    r[cls] = {
      nodes: boxes.length,
      paneW: Math.round(p.width), paneH: Math.round(p.height),
      clusterW: Math.round(w), clusterH: Math.round(h),
      fill: Math.round(((w * h) / (p.width * p.height)) * 100),
    }
  }
  // The Evidence tree is an SVG pane too; count its nodes and expanders.
  const txt = [...document.querySelectorAll('text')].map((t) => t.textContent.trim())
  const evIdx = txt.findIndex((t) => /evidence list/i.test(t))
  r.evidence = {
    headingFound: evIdx >= 0,
    // "+"/"-" expanders are the tree's own affordance, exactly as image5 draws them
    expanders: txt.filter((t) => t === '+' || t === '−' || t === '-').length,
    entries: txt.filter((t) => t && !/evidence list/i.test(t) && t !== '+' && t !== '−' && t !== '-').length,
    labels: txt.filter((t) => t && !/evidence list/i.test(t) && t !== '+' && t !== '−' && t !== '-').slice(0, 8),
  }
  return r
})

for (const k of ['promo_svg', 'scratch_svg']) {
  const v = panes[k]
  if (!v) { console.log(`Act 3  ${k.padEnd(14)}: pane not found`); continue }
  console.log(
    `Act 3  ${k.padEnd(14)}: ${String(v.nodes).padStart(2)} node(s)` +
      (v.nodes ? `  cluster ${v.clusterW}x${v.clusterH} in ${v.paneW}x${v.paneH} = ${v.fill}% fill` : ''),
  )
}
console.log(
  `Act 3  Evidence tree : heading=${panes.evidence.headingFound} ` +
    `expanders=${panes.evidence.expanders} other-text=${panes.evidence.entries}`,
)
if (panes.evidence.labels.length) console.log(`                       labels: ${panes.evidence.labels.join(' · ')}`)

await browser.close()
