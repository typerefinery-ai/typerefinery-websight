/**
 * docs/issues/0171 / decision 0040 Option 2 — how much of the Composer pane does the cluster fill,
 * NOW?
 *
 * The 12% figure this issue argues from was measured on 2026-08-13. Two things have changed the
 * geometry since, in opposite directions:
 *
 *   - Act 3's page gained the shared app chrome (0124), taking the widest pane 853 -> 687 px (-19.5%).
 *     A smaller pane with the same cluster means the fill RATIO goes UP.
 *   - The gate now walks the incident the runsheet stages (0189), so the 8-object cast decision 0036
 *     built is what actually renders — which is the case 0171 is about.
 *
 * So the number the decision would be taken on is stale, and stale in the favourable direction. This
 * measures it on the staged incident, through the same drill-in gesture the walks use.
 *
 * It measures and reports only. Decision 0040 Option 2 is OPEN — it revises 0065's containment
 * choice — so nothing here changes behaviour.
 *
 *     node e2e/probe-0171-pane-fill.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const P = '/content/typerefinery-showcase/pages/os-triage'
const STATE = path.join(__dirname, '.auth', 'cms.json')

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1280, height: 800 },
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()

// Same gesture the walks use — the runsheet's preflight step 2.
await page.goto(`${CMS}${P}/pages/incidents.html`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('tbody tr', { timeout: 40_000 }).catch(() => {})
await page.waitForTimeout(2_500)
const row = page.locator('tbody tr', { hasText: 'image5 walkthrough' }).first()
if (!(await row.count())) {
  console.log('⚠️ image5 walkthrough row not found — cannot measure the staged configuration')
  await browser.close()
  process.exit(2)
}
await row.locator('td').nth(1).click()
await page.waitForTimeout(8_000)

await page.goto(`${CMS}${P}/forms/composer-local.html`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(22_000)

const frame = page.frames().find((f) => /widgetdevcomposer/.test(f.url()))
if (!frame) {
  console.log('⚠️ composer frame not found')
  await browser.close()
  process.exit(2)
}

const geom = await frame.evaluate(() => {
  const out = []
  for (const svg of document.querySelectorAll('svg')) {
    const cls = svg.getAttribute('class') || ''
    if (!/promo|scratch/.test(cls)) continue
    const box = svg.getBoundingClientRect()
    const nodes = [...svg.querySelectorAll('image, g.node')]
    if (!nodes.length || !box.width) continue
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const n of nodes) {
      const b = n.getBoundingClientRect()
      minX = Math.min(minX, b.left)
      minY = Math.min(minY, b.top)
      maxX = Math.max(maxX, b.right)
      maxY = Math.max(maxY, b.bottom)
    }
    const cw = maxX - minX
    const ch = maxY - minY
    out.push({
      pane: cls.trim(),
      nodes: nodes.length,
      paneSize: `${Math.round(box.width)}×${Math.round(box.height)}`,
      clusterSize: `${Math.round(cw)}×${Math.round(ch)}`,
      fillPct: Math.round(((cw * ch) / (box.width * box.height)) * 100),
      marginLeft: Math.round(minX - box.left),
      marginRight: Math.round(box.right - maxX),
      marginTop: Math.round(minY - box.top),
      marginBottom: Math.round(box.bottom - maxY),
    })
  }
  return out
})

console.log('pane fill on the STAGED incident (Phishing campaign - image5 walkthrough), 1280×800:\n')
for (const g of geom) {
  console.log(`  ${g.pane}`)
  console.log(`     nodes ${g.nodes} · pane ${g.paneSize} · cluster ${g.clusterSize} · fill ${g.fillPct}%`)
  console.log(`     margins  L${g.marginLeft} R${g.marginRight} T${g.marginTop} B${g.marginBottom}`)
}
const promo = geom.find((g) => /promo/.test(g.pane))
console.log('\n--- against the figure 0171 argues from ---')
console.log('  recorded 2026-08-13: cluster 223×183 in a 710×499 pane = 12% of the area')
if (promo) {
  console.log(`  measured now       : cluster ${promo.clusterSize} in a ${promo.paneSize} pane = ${promo.fillPct}%`)
  console.log(
    promo.fillPct > 12
      ? '  ↑ higher than recorded — the app chrome (0124) shrank the pane while the cast did not change.\n    Quote THIS number in decision 0040 Option 2, not the 2026-08-13 one.'
      : '  ↔ at or below the recorded figure — the fill argument stands as written.',
  )
}

fs.writeFileSync(path.join(__dirname, 'probe-0171-pane-fill.json'), JSON.stringify(geom, null, 2))
console.log('  written: e2e/probe-0171-pane-fill.json')
await browser.close()
