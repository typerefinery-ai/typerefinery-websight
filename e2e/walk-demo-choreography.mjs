/**
 * Walk the DEMO exactly as the presenter now will — Act 1 → drill into the image5 incident → Act 2 →
 * Act 3, in one continuous session.
 *
 * ⚠️ Why this exists. The runsheet's presenter guidance changed on 2026-08-13: after decision 0039
 * Option 1 gave the image5 walkthrough incident its attached objects, the instruction became *"drill
 * into `Phishing campaign - image5 walkthrough` from Act 1 and run Acts 2 AND 3 on it"*. That
 * instruction was written from two SEPARATE measurements (Act 2 counted on one visit, Act 3 on
 * another) — it had never been performed as a single sequence. Guidance a presenter will follow on
 * stage should be exercised, not inferred.
 *
 * The previous guidance was wrong in exactly this way: it said the image5 incident's Overview "is
 * empty by design" and "would fail preflight P0-S6", both true before 0039 and false after. This
 * walk is the check that stops the replacement text going the same way.
 *
 * Asserts, in order:
 *   1. Act 1 lists the image5 incident
 *   2. clicking its ROW drills in and sets current_incident to it   (decision 0037 gesture)
 *   3. Act 2's Overview renders > 5 nodes                            (the P0-S6 bar the old text said it would fail)
 *   4. Act 3's Promotable renders the mockup's 8-object cast, Scratch 4
 *   5. Act 3's Evidence tree is populated
 *
 *     node e2e/walk-demo-choreography.mjs <outdir>
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const P = '/content/typerefinery-showcase/pages/os-triage'
const OUT = process.argv[2] || '.'
const MAP = path.join(
  __dirname, '..', '..', 'typerefinery', 'services', 'fastapi', 'generated', 'os-triage',
  'context_mem', 'context_map.json',
)
const WANT = '1a9e5000'
const current = () => JSON.parse(fs.readFileSync(MAP, 'utf8')).current_incident

const results = []
const record = (s, v, n) => { results.push({ s, v, n }); console.log(`${v.padEnd(7)} ${s.padEnd(22)} ${n}`) }

console.log(`current_incident at start: ${current()}\n`)

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

// ---- 1 + 2: Act 1, and the drill-in gesture
await page.goto(`${CMS}${P}/pages/incidents.html`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
await page.waitForSelector('tbody tr', { timeout: 60_000 })
await page.waitForTimeout(3_000)

const rows = await page.locator('tbody tr').count()
const row = page.locator('tr', { hasText: WANT }).first()
record('ACT 1 lists it', (await row.count()) ? 'PASS' : 'FAIL',
  `${rows} row(s); a row mentioning ${WANT}: ${(await row.count()) ? 'yes' : 'NO'}`)
await page.screenshot({ path: path.join(OUT, 'choreo-1-act1.png') })

if (await row.count()) {
  await row.click()
  await page.waitForTimeout(14_000)
  const landed = page.url().split('/').pop()
  const now = current()
  record('DRILL-IN switches', now.includes(WANT) ? 'PASS' : 'FAIL',
    `landed on ${landed}; current_incident → ${now.slice(0, 34)}…`)
}

// ---- 3: Act 2 on that incident
await page.goto(`${CMS}${P}/forms/overview-local.html`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
await page.waitForTimeout(26_000)
const ov = page.frames().find((f) => /widgetdevoverview/.test(f.url()))
const ovNodes = ov ? await ov.evaluate(() => document.querySelectorAll('svg image').length).catch(() => -1) : -1
// P0-S6 asserts the current incident has >5 nodes — the bar the retired guidance claimed this would fail.
record('ACT 2 populated', ovNodes > 5 ? 'PASS' : 'FAIL', `${ovNodes} node(s) — P0-S6 needs > 5`)
await page.screenshot({ path: path.join(OUT, 'choreo-2-act2.png') })

// ---- 4 + 5: Act 3 on the same incident, no switch
await page.goto(`${CMS}${P}/forms/composer-local.html`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
await page.waitForTimeout(26_000)
const co = page.frames().find((f) => /widgetdevcomposer/.test(f.url()))
if (!co) record('ACT 3 panes', 'FAIL', 'composer frame not found')
else {
  const r = await co.evaluate(() => {
    const count = (c) => document.querySelectorAll(`svg.${c} image`).length
    const txt = [...document.querySelectorAll('text')].map((t) => t.textContent.trim())
    return {
      promo: count('promo_svg'),
      scratch: count('scratch_svg'),
      expanders: txt.filter((t) => t === '+' || t === '−' || t === '-').length,
      evidence: txt.filter((t) => /naive user|user report/i.test(t)).length,
    }
  })
  record('ACT 3 cast', r.promo === 8 && r.scratch === 4 ? 'PASS' : 'FAIL',
    `Promotable ${r.promo} (want 8), Scratch ${r.scratch} (want 4)`)
  record('ACT 3 evidence', r.expanders > 0 && r.evidence > 0 ? 'PASS' : 'FAIL',
    `${r.expanders} expander(s), ${r.evidence} evidence label(s)`)
}
await page.screenshot({ path: path.join(OUT, 'choreo-3-act3.png') })

console.log(`\n=== ${results.filter((r) => r.v === 'PASS').length}/${results.length} choreography checks PASS`)
console.log(`current_incident left at: ${current()}`)
console.log('⚠️ restore the baseline with: node e2e/set-current-incident-by-ui.mjs 511d2ab7')
await browser.close()
