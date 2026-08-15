/**
 * 0177 / P2-S5 diagnosis — trace the node-click → open-form event chain, identically on
 * the page that WORKS (composer-local, P3-S5 PASS) and the page that does not
 * (overview-local, P2-S5 FAIL), so the two full console streams can be diffed.
 *
 *     node e2e/probe-0177-overview-wiring.mjs overview|composer [outfile]
 *
 * History: the first version of this probe found 0177 cause A (widget dev servers down →
 * Traefik 502 on the widget iframes) and produced the overview-side trace showing the
 * forms embed never consumes the proxied open-form event.
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const MODE = process.argv[2] || 'overview'
const OUTFILE = process.argv[3] || `probe-0177-${MODE}-trace.txt`

const CFG = {
  overview: {
    page: '/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html',
    iframe: 'iframe[src*="widgetdevoverview"]',
    node: 'image, g.node',
  },
  composer: {
    page: '/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html',
    iframe: 'iframe[src*="widgetdevcomposer"]',
    node: 'svg.promo_svg image, svg.promo_svg g.node',
  },
}[MODE]

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

const lines = []
page.on('console', (m) => lines.push(`[${m.type()}] ${m.text().slice(0, 300)}`))
page.on('pageerror', (e) => lines.push(`[pageerror] ${String(e).slice(0, 300)}`))
page.on('requestfailed', (r) =>
  lines.push(`[reqfail] ${r.failure()?.errorText} ${r.url().slice(0, 160)}`))

await page.goto(`${CMS}${CFG.page}`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(25_000)

const viz = page.frameLocator(CFG.iframe).first()
const nodeCount = await viz.locator(CFG.node).count().catch(() => 0)
const formSrcBefore = await page.locator('iframe[src*="stixorm-forms"]').first().getAttribute('src').catch(() => null)

lines.push(`===== CLICK (${MODE}: ${nodeCount} nodes; form before: ${formSrcBefore}) =====`)
await viz.locator(CFG.node).first().click().catch((e) => lines.push('[probe] click threw: ' + e.message))
await page.waitForTimeout(12_000)
const formSrcAfter = await page.locator('iframe[src*="stixorm-forms"]').first().getAttribute('src').catch(() => null)
lines.push(`===== AFTER (form after: ${formSrcAfter}) =====`)

fs.writeFileSync(OUTFILE, lines.join('\n'))
console.log(`${MODE}: nodes=${nodeCount} form ${formSrcBefore === formSrcAfter ? 'UNCHANGED' : 'CHANGED'}: ${formSrcAfter}`)
console.log(`trace: ${OUTFILE} (${lines.length} lines)`)
await browser.close()
