/**
 * docs/issues/0124 slice 1 — does the shared chrome actually render on a page that was given it?
 *
 * The chrome's nav is rendered CLIENT-SIDE: the server HTML of the page that already works
 * (pages/incidents.html) contains an <aside> and the `asideleft` reference but none of the nav text.
 * So a server-side HTML check cannot answer this, and the comparison must be made in a browser
 * against the known-good page.
 *
 *     node e2e/probe-0124-shell-chrome.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const SHOWCASE = `${CMS}/content/typerefinery-showcase/pages/os-triage`

const PAGES = [
  { label: 'incidents (control - already had chrome)', url: `${SHOWCASE}/pages/incidents.html` },
  { label: 'overview-local (Act 2 destination)', url: `${SHOWCASE}/forms/overview-local.html` },
]

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1400, height: 900 },
  ignoreHTTPSErrors: true,
  storageState: path.join(__dirname, '.auth', 'cms.json'),
})

const results = []
for (const p of PAGES) {
  const page = await context.newPage()
  await page.goto(p.url, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(12000)

  const r = await page.evaluate(() => {
    const txt = (document.body.innerText || '').replace(/\s+/g, ' ')
    const wanted = ['All Incidents', 'My Incidents', 'An Incident', 'All Companies', 'User Setup', 'Dashboard']
    const aside = document.querySelector('aside')
    const header = document.querySelector('header')
    const asideBox = aside ? aside.getBoundingClientRect() : null
    return {
      navFound: wanted.filter((w) => txt.includes(w)),
      asideVisible: !!(asideBox && asideBox.width > 0 && asideBox.height > 0),
      asideWidth: asideBox ? Math.round(asideBox.width) : 0,
      headerPresent: !!header,
      links: [...document.querySelectorAll('aside a')].length,
    }
  })
  results.push({ ...p, ...r })
  await page.close()
}

console.log('')
for (const r of results) {
  console.log(`--- ${r.label}`)
  console.log(`    aside visible : ${r.asideVisible} (width ${r.asideWidth}px)`)
  console.log(`    header present: ${r.headerPresent}`)
  console.log(`    aside links   : ${r.links}`)
  console.log(`    nav items     : ${r.navFound.length ? r.navFound.join(', ') : '(none)'}`)
}

const [control, target] = results
console.log('\n=== VERDICT ===')
const parity =
  target.asideVisible === control.asideVisible &&
  target.headerPresent === control.headerPresent &&
  target.navFound.length >= Math.min(3, control.navFound.length)

console.log(
  parity
    ? 'PASS — the Act 2 destination now renders the same chrome as the page that already had it.'
    : 'FAIL — the chrome did not reach parity with the control page.',
)
await browser.close()
process.exit(parity ? 0 : 1)
