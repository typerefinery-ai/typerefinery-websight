/**
 * docs/issues/0107 residual — what does the Overview actually render at TODAY?
 *
 * Measures the root-group fit scale, on-screen icon size and median label height in the live
 * Overview, so the "everything renders at 39%" claim is re-tested against current data
 * (the 0169 repair removed the stray node that inflated the layout bbox).
 *
 *     node e2e/probe-0107-fit-scale.mjs
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

const m = await frame.locator('svg').first().evaluate((svg) => {
  const g = svg.querySelector('g')
  const t = g ? g.getAttribute('transform') || '' : ''
  const scale = (t.match(/scale\(([\d.]+)/) || [, '1'])[1]
  const icons = [...svg.querySelectorAll('image')].map((i) => i.getBoundingClientRect().width)
  const labels = [...svg.querySelectorAll('text.node-label, text[class*="label"]')]
    .map((l) => l.getBoundingClientRect().height)
    .filter((h) => h > 0)
    .sort((a, b) => a - b)
  const svgBox = svg.getBoundingClientRect()
  return {
    scale: Number(scale),
    iconOnScreen: icons.length ? Math.round(icons.reduce((a, b) => a + b, 0) / icons.length) : 0,
    iconCount: icons.length,
    medianLabelPx: labels.length ? Math.round(labels[Math.floor(labels.length / 2)]) : 0,
    labelCount: labels.length,
    panel: `${Math.round(svgBox.width)}x${Math.round(svgBox.height)}`,
  }
})
console.log(JSON.stringify(m, null, 2))
console.log(
  m.scale >= 0.6 && m.medianLabelPx >= 9
    ? '✅ fit scale and label size are within legible bounds — the 39% claim is stale'
    : '🔴 still rendering small — the layout-vs-panel mismatch stands'
)
await browser.close()
