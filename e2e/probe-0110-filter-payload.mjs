/**
 * docs/issues/0110 — Option 2's step 1, the payload-shape probe, run for real.
 *
 * 0110 recommends wiring the toolbar Search to the table's built-in `FILTER` event, and records the
 * one unknown that must be retired first:
 *
 *   "confirm the event payload the form/button emit delivers to a registered topic callback carries
 *    the term where `eventOnFilter` reads it (`filter.value`)"
 *
 * Reading the source says it does not. This probe proves it in the running page instead of trusting
 * a reading — the same discipline that caught docs/issues/0084 (a probe that reported PASS with the
 * guard removed) and docs/issues/0107 (presence asserted, legibility not).
 *
 *   table/clientlibs/functions.js   eventOnFilter($component, filter) => filter.value.toLowerCase()
 *   page/.../events/functions.js    compileEventData => {type, payload, action, componentId, config}
 *
 * So the bus delivers an ENVELOPE and the handler reads a BARE object. Every other consumer in the
 * codebase reads `eventData.payload.…` (embed, modal) — the table is the odd one out.
 *
 * The probe drives both shapes through the real handler on the real page and reports which filters:
 *   A) envelope  {type, payload:{value}, action, componentId, config}   <- what an authored emit sends
 *   B) bare      {value}                                                <- what eventOnFilter expects
 *
 *     node e2e/probe-0110-filter-payload.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = 'https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage'
const PAGE = `${BASE}/pages/incidents.html`
const STORAGE = path.join(__dirname, '.auth', 'cms.json')
const TERM = 'phishing'

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  storageState: fs.existsSync(STORAGE) ? STORAGE : undefined,
  viewport: { width: 1600, height: 1000 },
})
const page = await ctx.newPage()

console.log(`opening ${PAGE}`)
await page.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 120_000 })
await page.locator('table:has(tbody tr) tbody tr').first().waitFor({ timeout: 120_000 })

const before = await page.locator('tbody tr').count()
console.log(`rows before: ${before}`)

const result = await page.evaluate(async (term) => {
  const out = { found: false, handlerSource: null, cases: {} }

  // Find the table component namespace the way the component itself does, without assuming a global
  // name: walk Typerefinery's namespace tree for the object exposing eventHandlers.FILTER.
  const roots = [window.Typerefinery, window.typerefinery, window.TypeRefinery].filter(Boolean)
  let tableNs = null
  const seen = new Set()
  const walk = (o, depth) => {
    if (!o || typeof o !== 'object' || depth > 6 || seen.has(o)) return
    seen.add(o)
    if (o.eventHandlers && typeof o.eventHandlers.FILTER === 'function' && typeof o.eventOnFilter === 'function') {
      tableNs = o
      return
    }
    for (const k of Object.keys(o)) {
      try { walk(o[k], depth + 1) } catch { /* getters can throw */ }
    }
  }
  roots.forEach((r) => walk(r, 0))
  if (!tableNs) return out
  out.found = true
  out.handlerSource = String(tableNs.eventOnFilter).slice(0, 400)

  // Resolve $component the way the component itself does — `getComponentConfig` reads
  // `$component.data('model')` — and then confirm the id is one the table namespace has registered
  // (`ns[id].data`). Selecting by class instead gave a component whose id was not registered, so
  // BOTH payload shapes threw on `ns[id].data` and the probe measured nothing about payloads.
  let $component = null
  for (const el of document.querySelectorAll('[data-model]')) {
    const model = window.jQuery(el).data('model')
    const id = model && model.id
    if (id && tableNs[id] && Array.isArray(tableNs[id].data)) {
      $component = window.jQuery(el)
      out.componentId = id
      out.dataRows = tableNs[id].data.length
      break
    }
  }
  if (!$component) { out.found = 'handler-only'; return out }
  const rowCount = () => document.querySelectorAll('tbody tr').length

  const instances = window.Typerefinery.Components.Widgets.Table.Instances
  const drive = (label, payload) => {
    // Reset to the full dataset first. Without this, a case that runs after a case that already
    // filtered starts from the filtered rows — the third case then reported "188 -> 2 -> no change"
    // and looked like the fix failing, when it was the probe measuring its own leftovers.
    try { instances[out.componentId].bootstrapTable('load', tableNs[out.componentId].data) } catch { /* ignore */ }
    const start = rowCount()
    let error = null
    try {
      tableNs.eventOnFilter($component, payload)
    } catch (e) {
      error = `${e.name}: ${e.message}`
    }
    out.cases[label] = { rowsBefore: start, rowsAfter: rowCount(), error }
  }

  // A — the envelope an authored emit actually delivers (compileEventData's shape).
  drive('envelope', {
    type: 'INPUT_CHANGE',
    payload: { value: term, type: 'text', id: 'input_1', action: 'INPUT_CHANGE' },
    action: 'INPUT_CHANGE',
    componentId: 'probe',
    config: {},
  })
  // B — the bare shape eventOnFilter is written against.
  drive('bare', { value: term })

  // C — the same envelope, against the FIXED implementation, patched in for the duration of the
  // probe. The deployed clientlib cannot be exercised without a CMS build, so this proves the fix
  // itself works rather than asserting it will. Mirror of the committed change.
  const original = tableNs.eventOnFilter
  tableNs.eventOnFilter = ($c, filter) => {
    const cfg = window.jQuery($c).data('model')
    const id = cfg.id
    const t = String(filter?.payload?.value ?? filter?.value ?? '')
    if (!t) return
    const needle = t.toLowerCase()
    const filtered = tableNs[id].data.filter((row) =>
      Object.keys(row).some((k) => {
        const cell = row[k]
        return cell !== null && cell !== undefined && cell.toString().toLowerCase().includes(needle)
      }))
    tableNs.Instances ? tableNs.Instances[id].bootstrapTable('load', filtered)
      : window.Typerefinery.Components.Widgets.Table.Instances[id].bootstrapTable('load', filtered)
  }
  drive('envelope+fix', {
    type: 'INPUT_CHANGE',
    payload: { value: term, type: 'text', id: 'input_1', action: 'INPUT_CHANGE' },
    action: 'INPUT_CHANGE',
    componentId: 'probe',
    config: {},
  })
  tableNs.eventOnFilter = original

  return out
}, TERM)

console.log('\n--- probe 0110: FILTER payload shape ---')
if (result.found === false) {
  console.log('INCONCLUSIVE - the table namespace exposing eventHandlers.FILTER was not found on the page.')
  console.log('That is itself a finding: the handler may not be loaded on this page at all.')
} else if (result.found === 'handler-only') {
  console.log('INCONCLUSIVE - handler found, but no [data-model] element resolves to a registered')
  console.log('table id (ns[id].data). Both payload shapes would throw before reaching the payload,')
  console.log('so nothing about payload shape could be concluded from this run.')
} else {
  console.log(`component id: ${result.componentId}   registered rows: ${result.dataRows}`)
  console.log('handler source (truncated):')
  console.log('  ' + result.handlerSource.replace(/\n/g, '\n  '))
  for (const [label, r] of Object.entries(result.cases)) {
    const verdict = r.error ? `THREW  ${r.error}` : r.rowsAfter !== r.rowsBefore ? 'FILTERED' : 'no change'
    console.log(`\n  ${label.padEnd(9)} rows ${r.rowsBefore} -> ${r.rowsAfter}   ${verdict}`)
  }
  const env = result.cases.envelope
  const bare = result.cases.bare
  const fixed = result.cases['envelope+fix']
  console.log('\nVERDICT:')
  if (env?.error && !bare?.error) {
    console.log('  Option 2 CANNOT be done by authoring alone. The handler works on the bare shape but')
    console.log('  throws on the envelope the platform bus actually delivers — it needs a clientlib fix,')
    console.log('  which means a CMS deploy, not three servlet writes.')
    if (fixed && !fixed.error && fixed.rowsAfter !== fixed.rowsBefore) {
      console.log(`  The fix works: patched handler took ${fixed.rowsBefore} rows -> ${fixed.rowsAfter} on the envelope.`)
    } else {
      console.log('  ⚠️ The patched handler did NOT filter — the proposed fix is not sufficient. Do not ship it.')
    }
  } else if (!env?.error && env?.rowsAfter !== env?.rowsBefore) {
    console.log('  Option 2 IS authorable — the handler already accepts the envelope. Proceed to step 2.')
  } else {
    console.log('  Neither shape behaved as predicted — read the per-case results above before acting.')
  }
}

await browser.close()
