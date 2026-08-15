/**
 * docs/issues/0107 — the Overview legend: present, data-driven, and not a hit shield.
 *
 *     node e2e/probe-0107-legend.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html'

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()
await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded' })
const frame = page.frameLocator('iframe').first()
await frame.locator('svg image').first().waitFor({ timeout: 60_000 })
await page.waitForTimeout(8_000)

const m = await frame.locator('body').evaluate(() => {
  const legend = document.querySelector('.graph-legend')
  if (!legend) return { present: false }
  const rows = [...legend.querySelectorAll('div')].filter((d) => d.querySelector('img'))
  const rect = legend.getBoundingClientRect()
  // hit-shield check: elementFromPoint at the legend's centre must NOT be inside the legend
  // (pointer-events:none routes through to whatever is beneath)
  const under = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
  const shields = legend.contains(under)
  const distinctIcons = new Set(
    [...document.querySelectorAll('svg image')].map((i) => i.getAttribute('href') || i.getAttribute('xlink:href'))
  ).size
  // ⚠️ naturalWidth is 0 for SVGs without intrinsic dimensions even when they render fine —
  // fetch the sources instead and count non-200s.
  const srcs = [...legend.querySelectorAll('img')].map((i) => i.src)
  return Promise.all(
    srcs.map((s) => fetch(s).then((r) => r.status).catch(() => 0))
  ).then((statuses) => ({
    present: true,
    rows: rows.length,
    distinctIconsInGraph: distinctIcons,
    sampleLabels: rows.slice(0, 4).map((r) => r.textContent.trim()),
    shields,
    non200Imgs: statuses.filter((s) => s !== 200).length,
  }))
})
console.log(JSON.stringify(m, null, 2))
const ok = m.present && m.rows > 0 && m.rows === m.distinctIconsInGraph && !m.shields && m.non200Imgs === 0
console.log(ok ? '✅ legend present, complete, images loaded, not a hit shield' : '🔴 legend criteria NOT met')
await browser.close()
process.exit(ok ? 0 : 1)
