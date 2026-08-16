/**
 * docs/issues/0100 — P2-S5's eight-node walk re-reads the same form frame.
 *
 * The spec (specs/02-overview.spec.ts:264-288) clicks up to eight Overview nodes and, after each
 * click, looks for *a* form frame carrying inputs. It never establishes that the click did
 * anything: if the frame from click #1 is still sitting there, iterations 2..8 read it and pass.
 * 0049 measured exactly that shape — "8/8 opened, all sequence-update.html".
 *
 * Before writing an assertion, measure. This file exists because the same suite has already
 * produced two false alarms by asserting a guessed value instead of a measured one (see the
 * P2-S3 drag comment). Two candidate oracles are both unsafe on their own:
 *
 *   - "the frame URL changed"  — WRONG if two clicked nodes share a type: identity -> identity
 *     legitimately loads the same URL twice.
 *   - "the frame navigated"    — only usable if a same-type re-select actually re-navigates the
 *     iframe rather than being short-circuited by the host or answered by postMessage.
 *
 * So record, per click: which node was clicked (id/type as the widget reports it), every form-frame
 * navigation the click produced, and the resulting form URL + input count. The output tells us
 * which oracle is honest.
 *
 *     node e2e/probe-0100-p2s5-walk.mjs
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
const CLICKS = Number(process.env.CLICKS || 8)

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()

/** Every form-frame navigation, in order, with the click index it landed under. */
const navs = []
let clickIdx = -1
const isForm = (u) => /stixorm-forms/.test(u) && !/\/default(\.html)?$/.test(u)
page.on('framenavigated', (f) => {
  if (isForm(f.url())) navs.push({ click: clickIdx, url: f.url().split('/').slice(-1)[0] })
})

/** The widget names the node it selected; that is the only per-node identity we can read reliably. */
const selections = []
page.on('console', (m) => {
  const t = m.text()
  if (/Node selected|open form for node/i.test(t)) selections.push({ click: clickIdx, text: t.slice(0, 200) })
})

console.log(`\n--- open overview (${CLICKS} clicks) ---`)
await page.goto(PAGE)

const graph = page.frameLocator('iframe[src*="widgetdevoverview"], iframe[src*="4008"]').first()
const nodes = graph.locator(NODE)
await nodes.first().waitFor({ state: 'visible', timeout: 60_000 })
const total = Math.min(await nodes.count(), CLICKS)
console.log(`  nodes in graph: ${await nodes.count()} (walking ${total})`)

const formState = async () => {
  for (const f of page.frames()) {
    if (!isForm(f.url())) continue
    const inputs = await f.locator('input').count().catch(() => 0)
    return { form: f.url().split('/').slice(-1)[0], inputs }
  }
  return { form: '(no form frame)', inputs: 0 }
}

const rows = []
for (let i = 0; i < total; i++) {
  clickIdx = i
  const navsBefore = navs.length
  const selBefore = selections.length
  const before = await formState()
  await nodes.nth(i).click({ force: true })
  // The spec's own budget: poll for up to 12 s for a populated form.
  let after = before
  for (let waited = 0; waited < 12_000; waited += 1_000) {
    await page.waitForTimeout(1_000)
    after = await formState()
    if (navs.length > navsBefore && after.inputs > 0) break
  }
  const myNavs = navs.slice(navsBefore).map((n) => n.url)
  const mySel = selections.slice(selBefore).map((s) => s.text)
  rows.push({ i, before: before.form, after: after.form, inputs: after.inputs, navs: myNavs, sel: mySel })
  console.log(
    `  #${i}: before=${before.form} after=${after.form} inputs=${after.inputs} ` +
      `navs=${myNavs.length}${myNavs.length ? ` [${myNavs.join(', ')}]` : ''}`,
  )
  for (const s of mySel) console.log(`        widget: ${s}`)
}

console.log('\n--- verdict ---')
const distinctForms = new Set(rows.map((r) => r.after))
const clicksWithNav = rows.filter((r) => r.navs.length > 0).length
const repeats = rows.filter((r, k) => k > 0 && r.after === rows[k - 1].after).length
console.log(`  distinct forms across ${rows.length} clicks : ${distinctForms.size} (${[...distinctForms].join(', ')})`)
console.log(`  clicks that navigated a form frame        : ${clicksWithNav}/${rows.length}`)
console.log(`  clicks whose form equalled the previous   : ${repeats}/${rows.length - 1}`)
console.log(
  `  ORACLE "frame navigated" is ${clicksWithNav === rows.length ? 'SAFE — every click re-navigated' : 'UNSAFE — some clicks produced no navigation'}`,
)
console.log(
  `  ORACLE "url changed" is ${repeats === 0 ? 'SAFE here, but fragile (same-type nodes share a url)' : `UNSAFE — ${repeats} legitimate repeats`}`,
)

// --- negative controls -------------------------------------------------------------------------
// 0100 is "an assertion that cannot tell working from broken", so a replacement oracle is only
// worth having if it demonstrably FAILS when nothing happens. Two controls:
//
//   C1  no click at all — the form frame from the last click is still sitting there with inputs, so
//       the OLD check ("is there a form frame with inputs?") passes. The new one must not.
//   C2  the same node clicked twice. MEASURED: the host short-circuits an unchanged selection, so
//       the repeat produces NO navigation. That is a precondition on the oracle, not a defect: the
//       walk must click DISTINCT nodes. Two distinct nodes of the same TYPE do navigate (clicks
//       #2-#5 above are four different `sequence` nodes, 1 navigation each), which is what rules out
//       0100's own Option 1 ("assert the URL changed").
console.log('\n--- control C1: wait 12 s, click nothing ---')
clickIdx = 'C1'
const c1Before = navs.length
await page.waitForTimeout(12_000)
const c1State = await formState()
console.log(`  form still shows: ${c1State.form} inputs=${c1State.inputs}`)
console.log(`  navigations while idle: ${navs.length - c1Before}`)
console.log(
  `  OLD oracle (frame has inputs) says: ${c1State.inputs > 0 ? 'PASS  <-- the vacuous pass 0100 describes' : 'fail'}`,
)
console.log(
  `  NEW oracle (frame navigated)  says: ${navs.length - c1Before > 0 ? 'PASS <-- BAD, oracle does not bite' : 'fail  <-- correct, it bites'}`,
)

console.log('\n--- control C2: click the same node twice ---')
clickIdx = 'C2'
const c2Before = navs.length
await nodes.nth(0).click({ force: true })
await page.waitForTimeout(8_000)
const c2Mid = navs.length
await nodes.nth(0).click({ force: true })
await page.waitForTimeout(8_000)
console.log(`  navigations: first click ${c2Mid - c2Before}, repeat click ${navs.length - c2Mid}`)
console.log(
  navs.length - c2Mid > 0
    ? '  re-selecting the same node RELOADS the form — the oracle is safe on repeats too'
    : '  re-selecting the same node is SHORT-CIRCUITED — so the walk must click DISTINCT nodes',
)

fs.writeFileSync(path.join(__dirname, 'probe-0100-p2s5-walk.json'), JSON.stringify({ rows, navs, selections }, null, 2))
console.log('  written: e2e/probe-0100-p2s5-walk.json')

await browser.close()
