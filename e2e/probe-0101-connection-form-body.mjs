/**
 * docs/issues/0101 — when the Create Connection modal opens, does it contain a USABLE form?
 *
 * P3-S7 passes on every gate with "Connection modal mounted -> foreign-key-connections.html", and
 * 0101 records that on some runs the modal opens, the widget logs correct refs, and **the form body
 * is empty** — 0 ref-shaped input values. Two observations, no explanation, since 2026-08-12.
 *
 * 🔑 **The gate's oracle cannot see this.** "The modal mounted and its src is X" is satisfied by an
 * empty modal, so P3-S7 can pass while the Act's actual capability — connect these two objects — is
 * unavailable. Same presence-vs-quality trap as 0048, 0084, 0139 and 0127's 5px labels. This probe
 * asks the second question: is there anything usable in it?
 *
 * ⚠️ Drives the gesture exactly as `walk-act3-rightclick.mjs` P3-S7 does — same frame selector, same
 * two left-clicks before the right-click, same waits. A probe that reaches the modal by a different
 * route would not be measuring the step the gate passes.
 *
 *     node e2e/probe-0101-connection-form-body.mjs [outdir]
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import { execSync } from 'child_process'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const CMS = 'https://cms.typerefinery.localhost:8101'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html'
const STATE = 'C:/Users/denis/WebstormProjects/alpha-launch/typerefinery-websight/e2e/.auth/cms.json'
const OUT = process.argv[2] || null
const STIX_ID = /^[a-z][a-z0-9-]*--[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1280, height: 800 },
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()
const logs = []
page.on('console', (m) => { const t = m.text(); if (/dataForForm|source_ref|target_ref/i.test(t)) logs.push(t.slice(0, 150)) })

// ⚠️ Stage the incident the run card uses, exactly as walk-act3-rightclick.mjs does. Without this
// the probe measures whatever incident happens to be current — the first run of this probe read the
// 59-node 511d2ab7 pane while believing it was on the demo incident (0189/0140s repeated trap).
execSync('node e2e/set-current-incident-by-ui.mjs 1a9e5000', { stdio: 'inherit', cwd: process.cwd() })
await page.goto(CMS + PAGE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(22_000)

const w = page.frameLocator('iframe[src*="widgetdevcomposer"]').first()
const promo = w.locator('svg.promo_svg image, svg.promo_svg g.node')
const n = await promo.count().catch(() => 0)
console.log(`Promotable renders ${n} node element(s)`)
if (n < 2) { console.log('FAIL - need two nodes to connect'); await browser.close(); process.exit(2) }

// force: another node can sit on top and intercept the click. Measured 2026-08-16:
// `relationship--57de5bfa…` intercepted the first node on the **59-node** pane — consistent with
// 0078 being a property of DENSE panes, not of the demo incident (which renders 8).
await promo.first().click({ force: true })
await page.waitForTimeout(1_500)
await promo.nth(1).click({ force: true })
await page.waitForTimeout(1_500)
await promo.nth(1).click({ button: 'right', force: true })
await page.waitForTimeout(2_500)

if (!(await w.getByText(/create connection/i).count().catch(() => 0))) {
  console.log('NOTE - the context menu did not offer Create Connection this run; cannot measure')
  await browser.close(); process.exit(2)
}
await w.getByText(/create connection/i).first().click()
await page.waitForTimeout(8_000)

const frame = page.frames().find((f) => /foreign-key-connections|modal-forms/.test(f.url()))
if (!frame) {
  console.log('NOTE - no modal frame mounted this run')
  if (logs.length) console.log(`widget logs:\n  ${logs.slice(0, 4).join('\n  ')}`)
  await browser.close(); process.exit(2)
}
console.log(`modal frame: ${frame.url().split('/').pop().slice(0, 60)}`)

const body = await frame.evaluate(() => {
  const ctrls = [...document.querySelectorAll('input, select, textarea')]
  const vals = ctrls.map((c) => (c.value || '').trim()).filter(Boolean)
  return {
    controls: ctrls.length,
    visibleControls: ctrls.filter((c) => c.offsetParent !== null).length,
    nonEmptyValues: vals.length,
    values: vals.slice(0, 8),
    buttons: [...document.querySelectorAll('button')].map((b) => b.textContent.trim()).filter(Boolean).slice(0, 6),
    textLen: document.body.innerText.trim().length,
  }
})

const refLike = body.values.filter((v) => STIX_ID.test(v)).length
console.log(`form controls         : ${body.controls} (${body.visibleControls} visible)`)
console.log(`non-empty values      : ${body.nonEmptyValues}`)
console.log(`STIX-id-shaped values : ${refLike}   ${refLike ? '' : '<- 0101 says the pre-fill lands 0 of these'}`)
console.log(`buttons               : ${body.buttons.join(' | ') || '(none)'}`)
console.log(`body text length      : ${body.textLen}`)
if (logs.length) console.log(`widget logs           : ${logs.slice(0, 2).join(' ; ')}`)

if (OUT) {
  fs.mkdirSync(OUT, { recursive: true })
  await page.screenshot({ path: `${OUT}/0101-connection-modal.png` })
  console.log(`screenshot: ${OUT}/0101-connection-modal.png`)
}

await browser.close()

// ⚠️ Put current_incident back. Staging is a side effect that outlives this process, and
// "the suite changes current_incident as a side effect of a passing test" is a documented trap
// (0169) — a later measurement that trusts whatever was left behind reads the wrong incident,
// which is exactly the mistake this probe made on its first run.
try {
  execSync('node e2e/set-current-incident-by-ui.mjs 511d2ab7', { stdio: 'ignore', cwd: process.cwd() })
  console.log('\n(restored the run card’s starting incident 511d2ab7)')
} catch (e) {
  console.log('\n⚠ could not restore current_incident: ' + String(e.message).slice(0, 80))
}

const empty = body.visibleControls === 0 || body.nonEmptyValues === 0
console.log(`\n0101 ${empty ? 'REPRODUCES — modal mounted, form body unusable' : 'does NOT reproduce — the modal carries a populated form'}`)
process.exit(empty ? 1 : 0)
