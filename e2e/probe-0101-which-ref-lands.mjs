/**
 * docs/issues/0101 — when the SRO form mounts half-built, WHICH ref lands and which does not?
 *
 * ⚠️ Why this is the next step. The 2026-08-13T23:05Z suite failed P3-S6 with a shortfall that is
 * specific rather than vague:
 *
 *     Error: Source Ref and Target Ref pre-filled   Expected: >= 2   Received: 1
 *
 * The modal opened and its heading was right; only **one** of the two refs was populated after 30 s.
 * That says the widget posts the two ids **separately** — or posts one and drops the other — rather
 * than posting a pair late. Knowing *which* one lands narrows the fix from "the form is empty" to a
 * single code path.
 *
 * Method: perform the P3-S6 gesture N times, and after each one sample the modal every 500 ms for
 * 20 s, recording **per field name** when (or whether) a STIX id appears.
 *
 * ⚠️ Reports per-iteration, never an average. This is an intermittent: an aggregate would hide the
 * failing run, which is the only interesting one. A run where both refs land is reported as such and
 * is not evidence the race is gone — three greens around one red is exactly the shape that made this
 * family slow to pin down.
 *
 *     node e2e/probe-0101-which-ref-lands.mjs [iterations]
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html'
const N = Number(process.argv[2] || 4)
const MAP = path.join(
  __dirname, '..', '..', 'typerefinery', 'services', 'fastapi', 'generated', 'os-triage',
  'context_mem', 'context_map.json',
)
console.log(`current_incident: ${JSON.parse(fs.readFileSync(MAP, 'utf8')).current_incident}`)
console.log(`iterations: ${N}\n`)

const STIX = /^[a-z][a-z0-9-]*--[0-9a-f]{8}/i
const results = []

const browser = await chromium.launch({ channel: 'chrome', headless: false })

for (let iter = 1; iter <= N; iter++) {
  const ctx = await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
  const page = await ctx.newPage()
  const notable = []
  page.on('console', (m) => {
    const t = m.text()
    if (/source_ref|target_ref|reln_form_values|connect_objects|getRelationshipTypes/i.test(t)) {
      notable.push(t.replace(/\s+/g, ' ').slice(0, 150))
    }
  })

  try {
    await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
    await page.waitForTimeout(24_000)
    const w = page.frameLocator('iframe[src*="widgetdevcomposer"]').first()
    const promo = w.locator('svg.promo_svg image')
    const scratch = w.locator('svg.scratch_svg image')
    if (!(await promo.count()) || !(await scratch.count())) {
      results.push({ iter, outcome: 'SKIPPED — a pane was empty' })
      await ctx.close(); continue
    }

    await promo.first().click()
    await page.waitForTimeout(1_200)
    await scratch.first().click()
    await page.waitForTimeout(1_200)
    await scratch.first().click({ button: 'right' })
    await page.waitForTimeout(2_000)

    const sro = w.getByText(/create sro/i).first()
    if (!(await sro.count())) { results.push({ iter, outcome: 'SKIPPED — no Create SRO in the menu' }); await ctx.close(); continue }
    await sro.click()

    // Sample the modal, recording WHEN each named field first holds a STIX id.
    const firstSeen = {}
    const t0 = Date.now()
    let fieldNames = []
    for (let s = 0; s < 40; s++) {
      const frame = page.frames().find((f) => /modal-forms|sro-constraints|relationship/.test(f.url()))
      if (frame) {
        const snap = await frame
          .evaluate(() => [...document.querySelectorAll('input, select, textarea')].map((el) => ({
            name: el.getAttribute('name') || el.getAttribute('id') || '(unnamed)',
            value: String(el.value || ''),
          })))
          .catch(() => null)
        if (snap) {
          fieldNames = snap.map((f) => f.name)
          for (const f of snap) {
            if (!firstSeen[f.name] && STIX.test(f.value)) {
              firstSeen[f.name] = ((Date.now() - t0) / 1000).toFixed(1)
            }
          }
        }
      }
      await page.waitForTimeout(500)
    }

    const landed = Object.keys(firstSeen)
    results.push({
      iter,
      outcome: landed.length >= 2 ? `BOTH landed (${landed.length})` : `HALF-BUILT — only ${landed.length} ref(s)`,
      firstSeen,
      refFields: fieldNames.filter((n) => /ref/i.test(n)),
      notable: notable.slice(-4),
    })
  } catch (e) {
    results.push({ iter, outcome: 'threw: ' + String(e.message).split('\n')[0].slice(0, 90) })
  }
  await ctx.close()
}

await browser.close()

console.log('\n=== per-iteration (never averaged — the failing run is the interesting one)')
for (const r of results) {
  console.log(`\niteration ${r.iter}: ${r.outcome}`)
  if (r.refFields) console.log(`   ref-ish fields on the form: ${r.refFields.join(', ') || '(none)'}`)
  if (r.firstSeen) {
    const e = Object.entries(r.firstSeen)
    console.log(e.length ? `   filled: ${e.map(([k, v]) => `${k} @ ${v}s`).join('  |  ')}` : '   filled: (nothing)')
  }
  if (r.notable && r.notable.length) r.notable.forEach((l) => console.log(`   log: ${l}`))
}
const bad = results.filter((r) => /HALF-BUILT/.test(r.outcome))
console.log(`\n${bad.length} of ${results.length} iteration(s) mounted half-built.`)
console.log(bad.length
  ? '⚠️ Reproduced. Note WHICH field is missing above — that is the narrowing 0101 needs.'
  : '⚠️ Not reproduced this run. That is NOT evidence the race is gone (docs/issues/0148 lesson).')
