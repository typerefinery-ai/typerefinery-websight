/**
 * docs/issues/0170 — post-deploy verification of Resolution 1 (the loading cue), plus a live
 * measurement of the `debug=true` clientlib flip that was deliberately left for this window.
 *
 * 0170's Resolution 1 shipped in `typerefinery-websight@e5a4ec3a`: `ns.navigateFrame` shows a
 * generic "Loading…" cue (`.embed-loading`) and dims the pane the moment a navigation is requested,
 * cleared on the frame's `load`, on the unavailable placeholder, and by a 30 s failsafe. It rode the
 * decision-0044 bundle deploy on 2026-08-16 ~02:20Z. The issue names the acceptance test itself:
 *
 *   "click a node on overview-local.html and the pane must read 'Loading…' within ~100 ms"
 *
 * That is a claim about the deployed build, so it has to be measured on the deployed build. This
 * probe stamps `performance.now()` in the HOST document immediately before the click and again from
 * a MutationObserver the instant the cue becomes visible, so the number is the product's latency and
 * not a screenshot's.
 *
 * It also re-measures what the audience actually waits for — cue, frame load, first populated field —
 * against 0170's recorded baseline (t1 form appears 3.8 s, t3 first populated field 7.0 s), and
 * counts the form's `<script>` tags and markup size, which is the evidence the `debug=true` flip
 * needs before anyone touches `head-libs.html`.
 *
 * ⚠️ The reported cue latency INCLUDES Playwright's click dispatch into the cross-origin graph frame.
 * That inflates it, so a passing number is honest and a marginal one deserves a second look.
 *
 *     node e2e/probe-0170-loading-cue.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const PAGE = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html`
const STATE = path.join(__dirname, '.auth', 'cms.json')
const NODE = 'svg image.node-image, svg image, svg g.node'
const BUDGET_MS = Number(process.env.CUE_BUDGET_MS || 100)

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()

const isForm = (u) => /stixorm-forms/.test(u) && !/\/default(\.html)?$/.test(u)

console.log('--- open overview ---')
await page.goto(PAGE)
const graph = page.frameLocator('iframe[src*="widgetdevoverview"], iframe[src*="4008"]').first()
const nodes = graph.locator(NODE)
await nodes.first().waitFor({ state: 'visible', timeout: 60_000 })

// Is the deployed clientlib even the one carrying the cue? Answer from the served JS, not from git.
const deployed = await page.evaluate(async () => {
  const src = [...document.querySelectorAll('script[src]')].map((s) => s.src)
  const embed = src.find((s) => /embed/.test(s))
  if (!embed) return { embed: null }
  const text = await fetch(embed).then((r) => r.text()).catch(() => '')
  return {
    embed: embed.split('/').slice(-3).join('/'),
    hasShowLoading: /showLoading/.test(text),
    hasEmbedLoading: /embed-loading/.test(text),
    hasFailsafe: /_loadingFailsafe/.test(text),
    bytes: text.length,
  }
})
console.log('  served embed clientlib:', JSON.stringify(deployed))

// One distinct type per click, so every click pays the first-open cost the issue is about.
const icons = await nodes.evaluateAll((els) =>
  els.map((e) => (e.getAttribute('href') || e.getAttribute('xlink:href') || '').split('/').pop() || '?'),
)
const firstOfIcon = new Map()
icons.forEach((icon, i) => {
  if (!firstOfIcon.has(icon)) firstOfIcon.set(icon, i)
})
const walk = [...firstOfIcon.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(0, 4)

// ⚠️ Every timing below has to be anchored to THIS click's navigation. Looking for "a form frame
// with inputs" reports the PREVIOUS click's frame in 0 ms — that is docs/issues/0100's exact bug, and
// the first draft of this probe walked straight into it (cue 0 ms, form 0 ms, field 2 ms on clicks
// 2-4, all of it the stale frame). 0100 measured that a `framenavigated` count is the honest signal,
// so use it here too.
let formNavs = 0
page.on('framenavigated', (f) => {
  if (isForm(f.url())) formNavs++
})

const rows = []
for (const [icon, i] of walk) {
  // Arm the observer and zero the clock in the HOST document, then click. A cue left visible from
  // the previous click makes THIS click's appearance latency unmeasurable, so record that rather
  // than silently reporting 0 ms.
  const preVisible = await page.evaluate(() => {
    const vis = (el) => el && el.offsetParent !== null && getComputedStyle(el).display !== 'none'
    const already = vis(document.querySelector('.embed-loading'))
    window.__cueAt = null
    window.__cueText = null
    const check = () => {
      const el = document.querySelector('.embed-loading')
      if (window.__cueAt === null && vis(el)) {
        window.__cueAt = performance.now()
        window.__cueText = (el.textContent || '').trim()
      }
    }
    window.__obs?.disconnect()
    window.__obs = new MutationObserver(check)
    window.__obs.observe(document.body, { childList: true, subtree: true, attributes: true })
    window.__t0 = performance.now()
    return already
  })

  const navsBefore = formNavs
  const t0 = Date.now()
  await nodes.nth(i).click({ force: true })

  // Cue latency — meant to be immediate, so poll finely and briefly.
  let cue = null
  for (let waited = 0; waited < 3_000; waited += 25) {
    cue = await page.evaluate(() =>
      window.__cueAt === null ? null : { ms: window.__cueAt - window.__t0, text: window.__cueText },
    )
    if (cue) break
    await page.waitForTimeout(25)
  }

  // The wait the cue is covering for — anchored to this click's navigation.
  let tNav = null
  let tField = null
  let form = '(none)'
  for (let waited = 0; waited < 25_000; waited += 100) {
    if (formNavs > navsBefore) {
      const frame = page.frames().find((f) => isForm(f.url()))
      if (frame) {
        if (tNav === null) {
          tNav = Date.now() - t0
          form = frame.url().split('/').slice(-1)[0]
        }
        const filled = await frame
          .evaluate(() => [...document.querySelectorAll('input')].filter((el) => el.value && el.value.trim()).length)
          .catch(() => 0)
        if (filled > 0) {
          tField = Date.now() - t0
          break
        }
      }
    }
    await page.waitForTimeout(100)
  }

  // Time for the cue to go away, measured AFTER the form is usable.
  let tClear = null
  for (let waited = 0; waited < 8_000; waited += 100) {
    const gone = await page.evaluate(() => {
      const el = document.querySelector('.embed-loading')
      return !el || el.offsetParent === null || getComputedStyle(el).display === 'none'
    })
    if (gone) {
      tClear = Date.now() - t0
      break
    }
    await page.waitForTimeout(100)
  }

  // Markup weight, read once the document has actually settled (the debug=true evidence).
  const frame = page.frames().find((f) => isForm(f.url()))
  const weight = frame
    ? await frame
        .evaluate(() => ({
          scripts: document.querySelectorAll('script').length,
          external: document.querySelectorAll('script[src]').length,
          bytes: document.documentElement.outerHTML.length,
          inputs: document.querySelectorAll('input, select, textarea').length,
        }))
        .catch(() => null)
    : null

  rows.push({ icon, form, preVisible, cueMs: cue?.ms ?? null, cueText: cue?.text ?? null, tNav, tField, tClear, ...(weight || {}) })
  console.log(
    `  ${icon.padEnd(26)} cue ${preVisible ? 'UNMEASURABLE (left over from previous click)' : cue ? `${Math.round(cue.ms)} ms "${cue.text}"` : 'NEVER APPEARED'} · ` +
      `nav ${tNav ?? '—'} ms · field ${tField ?? 'never'} ms · cleared ${tClear === null ? 'NEVER (8 s)' : `${tClear} ms`} · ` +
      `${weight ? `${weight.external}/${weight.scripts} ext scripts · ${Math.round(weight.bytes / 1024)} KB · ${weight.inputs} inputs` : 'no frame'}`,
  )
}

console.log('\n--- verdict ---')
const measurable = rows.filter((r) => !r.preVisible)
const cues = measurable.map((r) => r.cueMs).filter((v) => v !== null)
console.log(`  cue appeared on ${cues.length}/${measurable.length} measurable click(s); ${rows.length - measurable.length} unmeasurable (a cue was still up from the previous click)`)
if (cues.length) {
  console.log(`  cue latency: min ${Math.round(Math.min(...cues))} ms · max ${Math.round(Math.max(...cues))} ms (budget ${BUDGET_MS} ms, includes click dispatch)`)
  console.log(
    `  ACCEPTANCE (0170 res.1 "cue within ~100 ms"): ${cues.length === measurable.length && Math.max(...cues) <= BUDGET_MS ? 'PASS' : 'REVIEW'}`,
  )
}
const cleared = rows.filter((r) => r.tClear !== null)
console.log(`  cue cleared once the form was usable on ${cleared.length}/${rows.length}` +
  (cleared.length ? ` (${Math.round(Math.min(...cleared.map((r) => r.tClear)))}–${Math.round(Math.max(...cleared.map((r) => r.tClear)))} ms from click)` : ''))
if (cleared.length < rows.length) {
  console.log('  ⚠️ a cue that never clears is 0105 with extra steps — the 30 s failsafe would eventually hide it, but the audience sees "Loading…" over a form they can already read')
}
const fields = rows.map((r) => r.tField).filter(Boolean)
if (fields.length) {
  console.log(`  wait the cue covers: first populated field ${Math.round(Math.min(...fields))}–${Math.round(Math.max(...fields))} ms (0170 baseline: 7000 ms)`)
}
const ext = rows.map((r) => r.external || 0)
const kb = rows.map((r) => r.bytes || 0)
console.log(`  form markup: ${Math.min(...ext)}–${Math.max(...ext)} external script tags · ` +
  `${Math.round(Math.min(...kb) / 1024)}–${Math.round(Math.max(...kb) / 1024)} KB ` +
  `(debug=true evidence: 0170 recorded 35 external scripts / 279 KB)`)

fs.writeFileSync(path.join(__dirname, 'probe-0170-loading-cue.json'), JSON.stringify({ deployed, rows }, null, 2))
console.log('  written: e2e/probe-0170-loading-cue.json')

await browser.close()
