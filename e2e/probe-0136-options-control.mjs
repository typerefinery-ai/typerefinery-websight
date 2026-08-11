/**
 * alpha-launch issue 0136 — end-to-end proof of the live display-options control.
 *
 * Walks the exact demo beat on the Overview (local) page:
 *   1. the authored control is visible and reports the stored iconSize;
 *   2. click -> network POST /viz-data/overview-options-save answers 200;
 *   3. GET /viz-data/overview-options returns the flipped value (stored, not session state);
 *   4. the widget iframe reloads and the rendered node icons measurably change size;
 *   5. a full page reload still shows the flipped value (persistence);
 *   6. a second click restores the original value and icon size (repeatability).
 *
 * Read-write against the RUNNING instance; restores the original value before exiting, even on
 * assertion failure.
 *
 *     node e2e/probe-0136-options-control.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'

const CMS = 'https://cms.typerefinery.localhost:8101'
const PAGE = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html`
const FLOW = 'http://localhost:8111'
const results = []
const record = (name, pass, detail) => {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

const getStored = async () => (await (await fetch(`${FLOW}/viz-data/overview-options`)).json()).iconSize

const widgetFrame = (page) => page.frames().find((f) => /widgetdevoverview|:4008/.test(f.url()))

/** Median rendered icon width inside the widget frame (waits for nodes to exist). */
async function iconWidth(page) {
  for (let waited = 0; waited < 45_000; waited += 1_500) {
    const frame = widgetFrame(page)
    if (frame) {
      const widths = await frame
        .evaluate(() =>
          Array.from(document.querySelectorAll('svg image')).map((el) => Number(el.getAttribute('width'))).filter(Boolean),
        )
        .catch(() => [])
      if (widths.length) {
        widths.sort((a, b) => a - b)
        return { median: widths[Math.floor(widths.length / 2)], count: widths.length }
      }
    }
    await page.waitForTimeout(1_500)
  }
  return { median: null, count: 0 }
}

const original = await getStored()
console.log(`stored iconSize before probe: ${original}`)

const b = await chromium.launch()
const ctx = await b.newContext({ ignoreHTTPSErrors: true, storageState: path.resolve('.auth/cms.json') })
const page = await ctx.newPage()

try {
  await page.goto(PAGE, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})

  // 1. control visible, reporting the stored value
  const btn = page.locator('#tr-options-control-btn')
  await btn.waitFor({ state: 'visible', timeout: 30_000 })
  await page.waitForFunction(
    () => /Icon size \d+/.test(document.querySelector('#tr-options-control-btn')?.textContent || ''),
    { timeout: 20_000 },
  )
  const labelBefore = await btn.textContent()
  record('control visible with stored value', new RegExp(`Icon size ${original}`).test(labelBefore || ''), `label="${labelBefore}"`)

  const before = await iconWidth(page)
  record('widget renders icons at the stored size', before.median === original, `median width ${before.median} across ${before.count} icons`)

  // 2. click -> POST 200
  const flipped = original === 35 ? 70 : 35
  const [saveResp] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/viz-data/overview-options-save'), { timeout: 30_000 }),
    btn.click(),
  ])
  record('click issued a real POST to the save route', saveResp.status() === 200, `POST -> ${saveResp.status()}`)

  // 3. stored value flipped (asked of the API directly, not the page)
  await page.waitForTimeout(1_000)
  const stored = await getStored()
  record('GET returns the flipped value (stored config changed)', stored === flipped, `iconSize now ${stored}`)

  // 4. the widget re-read visibly changed the rendering
  await page.waitForTimeout(3_000)
  const after = await iconWidth(page)
  record('widget re-rendered at the new size after its reload', after.median === flipped, `median width ${before.median} -> ${after.median}`)

  // 5. persistence across a full page reload
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  const btn2 = page.locator('#tr-options-control-btn')
  await btn2.waitFor({ state: 'visible', timeout: 30_000 })
  await page.waitForFunction(
    () => /Icon size \d+/.test(document.querySelector('#tr-options-control-btn')?.textContent || ''),
    { timeout: 20_000 },
  )
  const persisted = await iconWidth(page)
  record('value persists across a full page reload', persisted.median === flipped, `median width ${persisted.median}`)

  // 6. second click restores the original — the demo is repeatable
  const [restoreResp] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/viz-data/overview-options-save'), { timeout: 30_000 }),
    btn2.click(),
  ])
  await page.waitForTimeout(1_000)
  const restoredStored = await getStored()
  await page.waitForTimeout(3_000)
  const restored = await iconWidth(page)
  record(
    'second click restores the original (stored + rendered)',
    restoreResp.status() === 200 && restoredStored === original && restored.median === original,
    `POST -> ${restoreResp.status()}, stored ${restoredStored}, median width ${restored.median}`,
  )
} finally {
  // Whatever happened above, leave the stored config as we found it.
  const now = await getStored().catch(() => null)
  if (now !== original) {
    const fix = await fetch(`${FLOW}/viz-data/overview-options-save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ common: { iconSize: original } }),
    }).catch(() => null)
    console.log(`restored stored iconSize to ${original}: POST -> ${fix && fix.status}`)
  }
  await b.close()
}

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
