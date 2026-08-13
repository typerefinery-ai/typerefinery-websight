/**
 * Does the Composer's Promotable pane actually zoom?
 *
 * ⚠️ Written because the demo run card told the presenter they could scroll-zoom Act 3's pane for a
 * closer look — and that claim had been carried over from Act 2, where zoom WAS verified
 * (`scale(1.000)` → `scale(9.849)` through the cross-origin embed). Act 3 is a different widget with
 * its own handler, so the claim was unearned. Reading the source shows a live handler:
 *
 *     ns.promo_svg_zoom = ns.promo_svg.call(d3.zoom().on('zoom', function (event) {
 *         ns.promo_svg_root.attr('transform', event.transform);   // panel.promo.js
 *     }));
 *
 * but wired is not working — this measures it. ⚠️ Note the Composer writes `event.transform`
 * DIRECTLY, unlike the Overview which composes zoom on top of a fit transform, and
 * `clampNodesToPanel` also runs after the simulation, so the two could fight.
 *
 *     node e2e/probe-act3-pane-zoom.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html'
const MAP = path.join(
  __dirname, '..', '..', 'typerefinery', 'services', 'fastapi', 'generated', 'os-triage',
  'context_mem', 'context_map.json',
)
console.log(`current_incident: ${JSON.parse(fs.readFileSync(MAP, 'utf8')).current_incident}\n`)

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
await page.waitForTimeout(26_000)

const w = page.frameLocator('iframe[src*="widgetdevcomposer"]').first()
const svg = w.locator('svg.promo_svg').first()
const box = await svg.boundingBox()
if (!box) { console.log('promo pane not found'); await browser.close(); process.exit(1) }

const frame = page.frames().find((f) => /widgetdevcomposer/.test(f.url()))
const readState = async (label) => {
  const r = await frame.evaluate(() => {
    // ⚠️ NOT `svg.promo_svg > g` — the zoom writes to `ns.promo_svg_root`, which is appended AFTER
    // the `.call(d3.zoom(...))`, so the first child g is a different element and its transform never
    // changes. A first run read that one, reported "transform UNCHANGED" and nearly concluded the
    // wheel does not reach this pane — while the icons had grown from 40px to 394px. Pick the g that
    // actually carries a scale, and treat GEOMETRY as authoritative: what the audience sees is where
    // the icons ended up, not which node holds the attribute.
    const gs = [...document.querySelectorAll('svg.promo_svg g')]
    const root = gs.find((g) => /scale\(/.test(g.getAttribute('transform') || '')) || gs[0]
    const icons = [...document.querySelectorAll('svg.promo_svg image')].map((n) => n.getBoundingClientRect())
    const w = icons.length ? Math.max(...icons.map((b) => b.right)) - Math.min(...icons.map((b) => b.left)) : 0
    const h = icons.length ? Math.max(...icons.map((b) => b.bottom)) - Math.min(...icons.map((b) => b.top)) : 0
    return {
      transform: root ? root.getAttribute('transform') : '(no g)',
      clusterW: Math.round(w), clusterH: Math.round(h),
      iconW: icons.length ? Math.round(icons[0].width) : 0,
    }
  })
  console.log(`  ${label.padEnd(14)} transform=${String(r.transform).slice(0, 52)}  cluster ${r.clusterW}x${r.clusterH}  icon ${r.iconW}px`)
  return r
}

const before = await readState('before')
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, -220); await page.waitForTimeout(220) }
await page.waitForTimeout(1_500)
const after = await readState('after wheel')

// GEOMETRY decides. The transform attribute is corroboration, not the verdict — reading the wrong
// element made the first version of this probe announce the opposite of what the screen showed.
const grew = after.clusterW > before.clusterW * 1.1
const factor = before.iconW ? (after.iconW / before.iconW) : 0
console.log(`\nP3 pane zoom: cluster ${before.clusterW}x${before.clusterH} → ${after.clusterW}x${after.clusterH}` +
  `, icon ${before.iconW}px → ${after.iconW}px (×${factor.toFixed(1)}) after 5 wheel events`)
console.log(grew ? '✅ the pane ZOOMS — a presenter can look closer'
  : '🔴 the wheel does NOT reach this pane — the run card must not promise zoom here')
if (grew && factor > 4) {
  console.log(`⚠️ but ×${factor.toFixed(1)} from FIVE wheel events is very steep, and unlike the Overview` +
    ' this handler sets NO scaleExtent — d3 zoom is unbounded here, so a presenter can scroll the pane' +
    ' apart with no floor or ceiling. Worth a cap alongside decision 0040 Option 2.')
}
await browser.close()
