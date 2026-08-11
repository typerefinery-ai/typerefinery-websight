/**
 * docs/issues/0107 — are any Overview edge labels upside-down?
 *
 * The labels are <textPath> elements bound to invisible `.edgepath` paths, and a textPath runs in
 * its path's OWN direction. So the question "is this label upside-down?" reduces exactly to "does
 * its path run right-to-left?" — no rotation is involved, and none needs to be measured.
 *
 * That makes this deterministic rather than a sample: parse every `.edgepath`'s `d` attribute and
 * check the x of its start against the x of its end. A path with end.x < start.x renders its label
 * mirrored. This is the invariant the fix establishes, so it fails cleanly without the fix.
 *
 * (Deliberately NOT elementFromPoint or a screenshot diff: docs/issues/0084 records a probe that
 * sampled points, passed, and passed identically with the guard removed.)
 *
 *     node e2e/probe-0107-edge-label-orientation.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS_BASE = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const URL =
  process.env.OVERVIEW_URL ||
  `${CMS_BASE}/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html`

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  ignoreHTTPSErrors: true,
  storageState: path.join(__dirname, '.auth', 'cms.json'),
})
const page = await context.newPage()
await page.goto(URL, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(25000) // graph pages take ~25-30s to paint (docs/issues/0105)

const handle = await page.locator('iframe[src*="widgetdevoverview"]').elementHandle()
const frame = handle ? await handle.contentFrame() : null
if (!frame) {
  console.error('FAIL — could not reach the overview widget iframe.')
  await browser.close()
  process.exit(1)
}

const data = await frame.evaluate(() => {
  const paths = [...document.querySelectorAll('path.edgepath, .edgepath')]
  const labels = [...document.querySelectorAll('text.edgelabel, .edgelabel')]
  const parse = (d) => {
    // "M x1 y1 L x2 y2"
    const m = /M\s*(-?[\d.]+)\s+(-?[\d.]+)\s*L\s*(-?[\d.]+)\s+(-?[\d.]+)/.exec(d || '')
    if (!m) return null
    return { x1: +m[1], y1: +m[2], x2: +m[3], y2: +m[4] }
  }
  const rows = paths.map((p, i) => {
    const seg = parse(p.getAttribute('d'))
    const text = labels[i] ? labels[i].textContent.trim() : ''
    return seg ? { i, ...seg, text, reversed: seg.x2 < seg.x1 } : { i, text, unparsed: true }
  })
  return { total: paths.length, labelled: labels.filter((l) => l.textContent.trim()).length, rows }
})

console.log(`edgepaths: ${data.total}   labels with text: ${data.labelled}`)
const parsed = data.rows.filter((r) => !r.unparsed)
const reversed = parsed.filter((r) => r.reversed)

console.log(`\nparsed paths      : ${parsed.length}`)
console.log(`right-to-left     : ${reversed.length}  (these render their label mirrored)`)
if (reversed.length) {
  console.log('\n--- upside-down labels ---')
  reversed.slice(0, 12).forEach((r) =>
    console.log(`  [${r.i}] "${r.text}"  x ${r.x1.toFixed(0)} -> ${r.x2.toFixed(0)}`),
  )
}

const pct = parsed.length ? Math.round((reversed.length / parsed.length) * 100) : 0
console.log('\n=== VERDICT ===')
console.log(`${reversed.length} of ${parsed.length} edge labels reversed (${pct}%)`)
console.log(
  reversed.length === 0
    ? 'PASS — every edge label path runs left-to-right; no label can be upside-down.'
    : 'FAIL — some edge label paths run right-to-left, so those labels render mirrored.',
)

await browser.close()
process.exit(reversed.length === 0 ? 0 : 1)
