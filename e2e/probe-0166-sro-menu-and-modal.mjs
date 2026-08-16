/**
 * docs/issues/0166 — **does the context menu actually open, and does the click hit it?**
 *
 * P3-S6 fails intermittently (now in isolation too) at the *first* poll: no `modal-forms` frame ever
 * mounts. Two hypotheses are already eliminated — the pair-dependent empty dropdown (that yields a
 * *mounted* modal), and "the right-click fell through to a left-select" (the Update form in the
 * failure screenshot is the deliberate selection step's own doing).
 *
 * The remaining suspect is the step's locator:
 *
 *     composerWidget(page).getByText(/create sro/i).first().click()
 *
 * It is scoped to the **widget frame**, not to the menu, so it can match text anywhere in that frame.
 * This probe reports, at each stage, what is actually on screen — so the answer comes from
 * observation rather than from reading the selector and guessing.
 *
 *     node e2e/probe-0166-sro-menu-and-modal.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const SHOWCASE = '/content/typerefinery-showcase/pages/os-triage'
const PANE = { promo: 'svg.promo_svg', scratch: 'svg.scratch_svg' }

const browser = await chromium.launch({ channel: 'chrome' })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

const widget = () =>
  page.frameLocator('iframe[src*="widgetdevcomposer"], iframe[src*="4005"]').first()
const nodesIn = (pane) => widget().locator(`${pane} image, ${pane} g.node, ${pane} circle`)

/**
 * docs/issues/0166 — capture what the page SAYS, not just what it shows. The trigger is proven
 * (`network-traffic` breaks Create SRO) but the mechanism is not, and the modal fails *before* any
 * dropdown is populated, so the evidence has to come from the console and the network.
 */
const consoleLines = []
const requests = []
page.on('console', (m) => consoleLines.push(`${m.type()}: ${m.text().slice(0, 200)}`))
page.on('pageerror', (e) => consoleLines.push(`pageerror: ${String(e).slice(0, 200)}`))
page.on('requestfailed', (r) =>
  requests.push(`FAILED ${r.method()} ${r.url().slice(0, 300)} — ${r.failure()?.errorText}`),
)
/**
 * 🔑 Capture the **body** of `get-relationship-types`, not just its status.
 *
 * Both the working and failing cases return **200** from it, and the failing case then never requests
 * the modal page at all — so the decision is taken *after* this response, on its contents. A status
 * code cannot distinguish "here are the valid types" from "here are none".
 */
const relTypeBodies = []
page.on('response', async (r) => {
  if (r.status() >= 400) requests.push(`${r.status()} ${r.request().method()} ${r.url().slice(0, 300)}`)
  else if (/sro|constraint|relationship/i.test(r.url())) {
    requests.push(`${r.status()} ${r.request().method()} ${r.url().slice(0, 300)}`)
  }
  if (/get-relationship-types/.test(r.url())) {
    const body = await r.text().catch(() => '(unreadable)')
    const post = r.request().postData() || '(no body)'
    relTypeBodies.push({ post: post.slice(0, 300), body: body.slice(0, 400) })
  }
})

await page.goto(`${CMS}${SHOWCASE}/forms/composer-local.html`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(14_000)
// Only interested in what the GESTURE causes, so discard the page-load chatter.
consoleLines.length = 0
requests.length = 0

const promoCount = await nodesIn(PANE.promo).count()
const scratchCount = await nodesIn(PANE.scratch).count()
console.log(`panes: promo ${promoCount} · scratch ${scratchCount}`)

// Same sequence P3-S6 performs: select one node in each pane, then right-click the second.
await nodesIn(PANE.promo).first().click()
await page.waitForTimeout(1_500)
const which = process.argv[2] || ''
  const all = nodesIn(PANE.scratch)
  let target = all.first()
  if (which) {
    const n = await all.count()
    for (let i = 0; i < n; i++) {
      const id = (await all.nth(i).getAttribute('id')) || ''
      if (id.startsWith(which)) { target = all.nth(i); console.log('selected scratch node:', id.slice(0,46)); break }
    }
  }
await target.click()
await page.waitForTimeout(1_500)

/** How many elements in the WIDGET frame carry the text — the locator's real match set. */
const matches = await widget().getByText(/create sro/i).count()
console.log(`\nBEFORE right-click: elements matching /create sro/i in the widget frame = ${matches}`)

await target.click({ button: 'right' })
await page.waitForTimeout(2_000)

const after = await widget().getByText(/create sro/i).count()
const menuBoxes = await widget()
  .getByText(/create sro/i)
  .evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect()
      return {
        tag: e.tagName.toLowerCase(),
        cls: String(e.className?.baseVal ?? e.className ?? '').slice(0, 30),
        visible: r.width > 0 && r.height > 0,
        at: `${Math.round(r.x)},${Math.round(r.y)}`,
      }
    }),
  )
  .catch(() => [])
console.log(`AFTER right-click:  matches = ${after}`)
menuBoxes.forEach((m, i) =>
  console.log(`   [${i}] <${m.tag}> class="${m.cls}" visible=${m.visible} at ${m.at}`),
)

if (!after) {
  console.log('\n🔴 the context menu did NOT open — the step would click nothing and then wait 30s')
} else {
  await widget().getByText(/create sro/i).first().click()
  await page.waitForTimeout(6_000)
  const frames = page.frames().map((f) => f.url())
  const modal = frames.filter((f) => /modal-forms/.test(f))
  console.log(`\nafter clicking: frames = [${frames.join(' | ')}]`)
  console.log(modal.length ? `✅ modal frame mounted: ${modal.join(', ')}` : '🔴 no modal frame mounted')

  // ⚠️ A mounted modal and a POPULATED modal are different claims, and P3-S6 turns on the second.
  // 2026-08-16: `get-relationship-types` answered 200 with 3 types and the widget logged `types=3`,
  // while the step's `.choices__item` count read 0 across three runs. The API delivering types to the
  // WIDGET does not prove the MODAL rendered them — the callback runs in the composer widget, which
  // then posts the data into the CMS-served sro-constraints frame. Dump the modal's own DOM so the
  // two can be told apart instead of inferred.
  for (const f of page.frames()) {
    if (!/modal-forms/.test(f.url())) continue
    const dom = await f.evaluate(() => ({
      inputs: [...document.querySelectorAll('input')].map((e) => ({ name: e.name || e.id || '?', value: e.value })).filter((x) => x.value),
      selects: [...document.querySelectorAll('select')].map((s) => ({ name: s.name || s.id || '?', options: s.options.length })),
      choicesItems: document.querySelectorAll('.choices__item').length,
      dropdownItems: document.querySelectorAll('.choices__list--dropdown .choices__item').length,
      choicesRoots: document.querySelectorAll('.choices').length,
      bodyStart: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 200),
    })).catch((e) => ({ error: String(e) }))
    console.log(`\n--- modal DOM: ${f.url().split('/').pop()} ---`)
    console.log(JSON.stringify(dom, null, 2).slice(0, 1600))
  }
}

/**
 * docs/issues/0167 — surface the guard's own lines. The tail of the console is form-loading noise
 * (2800+ lines), so "the last 14" reliably hides the one message that matters.
 */
const notable = consoleLines.filter((l) =>
  /0167|Create SRO failed|getRelationshipTypesCallback|TypeError|Cannot read/i.test(l),
)
console.log(`\n--- notable console lines (${notable.length} of ${consoleLines.length}) ---`)
notable.forEach((l) => console.log(`   ${l.slice(0, 200)}`))

console.log(`\n--- console tail during the gesture ---`)
consoleLines.slice(-6).forEach((l) => console.log(`   ${l}`))
console.log(`--- SRO/constraint/relationship or failing requests (${requests.length}) ---`)
requests.slice(-14).forEach((r) => console.log(`   ${r}`))
console.log(`--- get-relationship-types (${relTypeBodies.length}) ---`)
relTypeBodies.forEach((b, i) => { console.log(`   [${i}] REQUEST : ${b.post}`); console.log(`   [${i}] RESPONSE: ${b.body}`) })

await browser.close()
