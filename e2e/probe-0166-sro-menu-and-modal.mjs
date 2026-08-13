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

await page.goto(`${CMS}${SHOWCASE}/forms/composer-local.html`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(14_000)

const promoCount = await nodesIn(PANE.promo).count()
const scratchCount = await nodesIn(PANE.scratch).count()
console.log(`panes: promo ${promoCount} · scratch ${scratchCount}`)

// Same sequence P3-S6 performs: select one node in each pane, then right-click the second.
await nodesIn(PANE.promo).first().click()
await page.waitForTimeout(1_500)
const target = nodesIn(PANE.scratch).first()
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
}

await browser.close()
