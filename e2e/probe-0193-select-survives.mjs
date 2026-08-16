/**
 * docs/issues/0193 — where does the Relationship Type `<select>` go?
 *
 * Established so far:
 *   - the SERVED page carries `<select name="relationship_type" placeholder="Select an item"
 *     class="form-select …">` with **0 `<option>` children** (options arrive at runtime), and
 *   - at runtime, inside the Composer's modal frame, there is **no `<select>` at all** — just an
 *     `<input>` holding `"derived-from,duplicate-of,related-to"`.
 *
 * So something between "server renders a select" and "the analyst looks at it" removes it. This
 * bisects the two candidates by loading the modal page DIRECTLY — no Composer, no gesture, no
 * `dataForForm` post:
 *
 *   select survives  -> the page is fine; the gesture / dataForForm path replaces it
 *   select gone      -> the page's own clientlibs do it, before any Composer involvement
 *
 * Console is captured unfiltered and reported for anything mentioning select/Choices/errors — the
 * select clientlib warns explicitly ("no Choices instance registered for …", docs/issues/0030), so
 * if the initialiser is failing it should say so itself.
 *
 *     node e2e/probe-0193-select-survives.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const PAGE = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/modal-forms/sro-constraints.html`
const STATE = path.join(__dirname, '.auth', 'cms.json')

const snapshot = (page) =>
  page.evaluate(() => ({
    selects: [...document.querySelectorAll('select')].map((s) => ({
      name: s.name || s.id || '?', options: s.options.length, hidden: s.hidden,
      cls: s.className, display: getComputedStyle(s).display,
    })),
    inputs: [...document.querySelectorAll('input')].map((i) => ({ name: i.name || i.id || '?', type: i.type, value: i.value })),
    choicesRoots: document.querySelectorAll('.choices').length,
    choicesItems: document.querySelectorAll('.choices__item').length,
    hasChoicesLib: typeof window.Choices,
  }))

const run = async () => {
  if (!fs.existsSync(STATE)) {
    console.error(`no auth state at ${STATE} — run: ./node_modules/.bin/playwright test --project=setup`)
    process.exit(2)
  }
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ storageState: STATE, ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()

  const logs = []
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))

  const resp = await page.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 60000 })
  console.log(`GET sro-constraints.html -> ${resp && resp.status()}`)

  const atLoad = await snapshot(page)
  console.log(`\n--- immediately after DOMContentLoaded ---`)
  console.log(JSON.stringify(atLoad, null, 2).slice(0, 900))

  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {})
  await page.waitForTimeout(5000)

  const settled = await snapshot(page)
  console.log(`\n--- after networkidle + 5s ---`)
  console.log(JSON.stringify(settled, null, 2).slice(0, 900))

  const interesting = logs.filter((l) => /select|choices|error|fail|undefined/i.test(l))
  console.log(`\n--- console lines mentioning select/Choices/errors (${interesting.length} of ${logs.length}) ---`)
  for (const l of interesting.slice(0, 30)) console.log(`  ${l.slice(0, 220)}`)

  fs.writeFileSync(path.join(__dirname, 'probe-0193-select-survives.json'),
    JSON.stringify({ status: resp && resp.status(), atLoad, settled, interesting }, null, 2))

  console.log('\n=== VERDICT ===')
  if (settled.selects.length > 0) {
    console.log(`the <select> SURVIVES a direct load (${settled.selects.length} present, ${settled.choicesRoots} Choices root(s)).`)
    console.log('So the page is fine on its own — the Composer gesture / dataForForm path is what replaces it.')
  } else if (atLoad.selects.length > 0) {
    console.log('the <select> is present at DOMContentLoaded and GONE after the page settles —')
    console.log("the page's own clientlibs remove it, with no Composer involvement.")
  } else {
    console.log('no <select> even at DOMContentLoaded — check whether the page served one at all this time.')
  }

  await browser.close()
}

run().catch((e) => { console.error(e); process.exit(1) })
