/**
 * Chrome validation walk, driven by **headed** Chrome via Playwright.
 *
 * ⚠️ Used because docs/issues/0161's bridge outage is active: clicks AND keystrokes stopped
 * delivering, so the CMS login could not be re-established through the Claude-in-Chrome bridge, and
 * CLAUDE.md forbids setting `input.value` programmatically (P0-S5). Playwright reaches Chrome over
 * CDP through a different path and carries a stored session.
 *
 * `headless: false` deliberately — the cadence asks for a real browser, not headless-only.
 *
 *     node e2e/walk-acts-headed.mjs <outdir>
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const OUT = process.argv[2] || '.'

const PAGES = [
  { act: 'Act 1', url: '/content/typerefinery-showcase/pages/os-triage/pages/incidents.html', shot: 'act1-incidents.png' },
  { act: 'Act 2', url: '/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html', shot: 'act2-overview.png' },
  { act: 'Act 3', url: '/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html', shot: 'act3-composer.png' },
]

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

for (const p of PAGES) {
  await page.goto(`${CMS}${p.url}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(18_000)

  const title = await page.title()
  const loggedOut = /login/i.test(title)
  const facts = await page.evaluate(() => ({
    heading: document.querySelector('h1, .navbar-brand, header')?.innerText?.trim().slice(0, 40) ?? null,
    rows: document.querySelectorAll('tbody tr').length,
    ths: [...document.querySelectorAll('thead th')].map((t) => t.innerText.trim()).filter(Boolean),
    iframes: [...document.querySelectorAll('iframe')].map((f) => f.src.split('/').slice(2, 3)[0]),
  }))

  console.log(`\n=== ${p.act} — ${title}${loggedOut ? '  ⚠️ LOGGED OUT' : ''}`)
  console.log(`   heading : ${facts.heading}`)
  if (facts.ths.length) console.log(`   columns : ${facts.ths.join(' · ')}   (${facts.rows} rows)`)
  if (facts.iframes.length) console.log(`   iframes : ${facts.iframes.join(', ')}`)

  // Widget panes, when present
  for (const [name, sel] of [['promo', 'svg.promo_svg'], ['scratch', 'svg.scratch_svg']]) {
    const w = page.frameLocator('iframe[src*="widgetdev"]').first()
    const n = await w.locator(`${sel} image, ${sel} g.node`).count().catch(() => -1)
    if (n >= 0) console.log(`   ${name} pane: ${n} nodes`)
  }
  const graph = await page
    .frameLocator('iframe[src*="widgetdevoverview"]').first()
    .locator('image, g.node').count().catch(() => -1)
  if (graph > 0) console.log(`   graph nodes: ${graph}`)

  await page.screenshot({ path: path.join(OUT, p.shot) })
  console.log(`   screenshot -> ${p.shot}`)
}

await browser.close()
