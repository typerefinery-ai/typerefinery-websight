/**
 * docs/issues/0102 — after a successful Create SRO, what URL does the form pane end up on?
 *
 * The defect: the pane navigated to `…/stixorm-forms///-forms/-update.html` (three empty segments)
 * and the CMS 404 page stayed on screen for the rest of the act.
 *
 * This probe does NOT drive the whole modal (that is P3-S6/P3-S7's job and it is the flakiest
 * interaction in the suite - docs/issues/0074, 0077). It measures the thing that actually decides
 * the URL: it raises the same event `formOpenCRO` raises, with the same config the widget now
 * builds, and reads where the form pane lands.
 *
 * Deliberately measures the RESULTING URL, not "no error appeared" - an empty pane and a correct
 * pane both lack the word 404.
 *
 *     node e2e/probe-0102-sro-followon-url.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const URL = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html`

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1500, height: 950 },
  ignoreHTTPSErrors: true,
  storageState: path.join(__dirname, '.auth', 'cms.json'),
})
const page = await context.newPage()

// Record every navigation the form pane makes, so a second (clobbering) navigation is visible.
const framesSeen = []
page.on('framenavigated', (f) => {
  const u = f.url()
  if (u.includes('stixorm-forms') || u.includes('404')) framesSeen.push(u)
})

await page.goto(URL, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(30000) // composer takes ~25-30s (docs/issues/0105)

const viz = page.frameLocator('iframe[src*="widgetdevcomposer"]')
const handle = await page.locator('iframe[src*="widgetdevcomposer"]').elementHandle()
const vizFrame = handle ? await handle.contentFrame() : null
if (!vizFrame) {
  console.error('FAIL - could not reach the composer widget iframe.')
  await browser.close()
  process.exit(1)
}

// Raise the post-save event exactly as formOpenCRO does, using the widget's own helpers.
const raised = await vizFrame.evaluate(() => {
  // The namespace is nested: window.Widgets.Panel.Promo (panel.promo.js:3). A shallow
  // Object.values(window.Widgets) scan misses it - that cost a run.
  const promo = window.Widgets?.Panel?.Promo
  if (!promo || typeof promo.formOpenCRO !== 'function') {
    return { ok: false, why: `formOpenCRO not on window.Widgets.Panel.Promo (keys: ${Object.keys(window.Widgets?.Panel || {}).join(',')})` }
  }
  // A minimal stand-in for the modal's submitted body and the selection context.
  const dataForForm = { object: { relationship_type: 'related-to', source_ref: 'identity--probe', target_ref: 'url--probe' } }
  const eventObjectData = { source: { object_form: 'identity', object_group: 'sdo-forms', object_family: 'stix-forms' } }
  promo.formOpenCRO(dataForForm, eventObjectData)
  return { ok: true }
})
if (!raised.ok) {
  console.error(`FAIL - ${raised.why}`)
  await browser.close()
  process.exit(1)
}

await page.waitForTimeout(6000)

const formSrc = await page
  .locator('iframe[src*="stixorm-forms"], iframe[src*="forms/"]')
  .last()
  .getAttribute('src')
  .catch(() => null)

console.log('\n--- form-pane navigations observed ---')
if (framesSeen.length === 0) console.log('  (none)')
framesSeen.forEach((u, i) => console.log(`  [${i}] ${u}`))
console.log(`\nfinal form iframe src: ${formSrc}`)

const all = [...framesSeen, formSrc || '']
const malformed = all.filter((u) => /stixorm-forms\/\/|\/-forms\/|\/-update\.html/.test(u))

console.log('\n=== VERDICT ===')
console.log(`malformed URLs (empty path segments): ${malformed.length}`)
malformed.forEach((u) => console.log(`   ${u}`))
console.log(
  malformed.length === 0
    ? 'PASS - no URL with empty classification segments was requested.'
    : 'FAIL - the empty-segment URL is still being built (docs/issues/0102).',
)

await browser.close()
process.exit(malformed.length === 0 ? 0 : 1)
