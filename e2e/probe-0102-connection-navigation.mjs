/**
 * docs/issues/0102 — where does the form panel go when Create Connection opens?
 *
 * 0102's remaining list ends with an explicit **untested prediction**: *"Create Connection lands on
 * the source object's update form"*. The mechanism is defect 1, which is not fixed — the host's
 * event fan-out broadcasts the modal's event to the `…-object` mapping as well as the one it names,
 * so a second navigation happens and clobbers the panel. After Create SRO that lands the user on a
 * blank relationship **update** form instead of the pre-filled **create** form.
 *
 * 🔑 **This can be measured without creating anything.** The clobbering navigation comes from the
 * broadcast when the modal opens, not from saving — so the prediction is testable by watching the
 * form panel's URL across the gesture and never pressing Save. No demo data is mutated.
 *
 * Reports the form-panel iframe's URL before the right-click, after the menu click, and after the
 * modal settles, plus every frame navigation seen in between.
 *
 *     node e2e/probe-0102-connection-navigation.mjs
 */
import { chromium } from '@playwright/test'
import { execSync } from 'child_process'
import fs from 'fs'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const CMS = 'https://cms.typerefinery.localhost:8101'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html'
const STATE = 'C:/Users/denis/WebstormProjects/alpha-launch/typerefinery-websight/e2e/.auth/cms.json'
const short = (u) => (u || '').split('/').slice(-2).join('/').slice(0, 58)

execSync('node e2e/set-current-incident-by-ui.mjs 1a9e5000', { stdio: 'ignore', cwd: process.cwd() })

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1280, height: 800 },
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()

const navs = []
page.on('framenavigated', (f) => {
  if (/widgetdevcomposer/.test(f.url())) return
  navs.push(short(f.url()))
})

await page.goto(CMS + PAGE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(22_000)

/** The form panel is the non-composer iframe on the page. */
const panelUrl = async () => {
  const f = page.frames().filter((fr) => fr !== page.mainFrame() && !/widgetdevcomposer/.test(fr.url()))
  return f.length ? short(f[f.length - 1].url()) : '(none)'
}

console.log(`form panel BEFORE          : ${await panelUrl()}`)

const w = page.frameLocator('iframe[src*="widgetdevcomposer"]').first()
const promo = w.locator('svg.promo_svg image, svg.promo_svg g.node')
if ((await promo.count()) < 2) { console.log('FAIL - need two nodes'); await browser.close(); process.exit(2) }

await promo.first().click({ force: true })
await page.waitForTimeout(1_500)
const afterFirstSelect = await panelUrl()
console.log(`after selecting node 1     : ${afterFirstSelect}`)

await promo.nth(1).click({ force: true })
await page.waitForTimeout(1_500)
const afterSecondSelect = await panelUrl()
console.log(`after selecting node 2     : ${afterSecondSelect}`)

navs.length = 0
await promo.nth(1).click({ button: 'right', force: true })
await page.waitForTimeout(2_500)
if (!(await w.getByText(/create connection/i).count().catch(() => 0))) {
  console.log('NOTE - menu did not offer Create Connection; cannot measure')
  await browser.close(); process.exit(2)
}
await w.getByText(/create connection/i).first().click()
await page.waitForTimeout(8_000)

const afterModal = await panelUrl()
console.log(`form panel AFTER the modal : ${afterModal}`)
console.log(`frame navigations during   : ${navs.length ? navs.join(' → ') : '(none)'}`)

const clobbered = afterModal !== afterSecondSelect
console.log(
  `\n0102's prediction: the panel is ${clobbered ? 'CLOBBERED' : 'UNCHANGED'} by opening Create Connection`,
)
console.log(
  clobbered
    ? '  → the broadcast does navigate the panel; 0102 defect 1 reproduces on this path'
    : '  → the panel keeps the object the user selected; the prediction does NOT hold on this path',
)

await browser.close()
console.log('\n\u26a0 this staged the image5 walkthrough incident and did NOT restore it.')
console.log('  restore the baseline with: node e2e/set-current-incident-by-ui.mjs 511d2ab7')
console.log('  (nothing was saved — no demo data was created by this probe)')
