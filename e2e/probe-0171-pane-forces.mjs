/**
 * docs/issues/0171 / decision 0040 Option 2 — why does Scratch fill 67% of its pane with 4 nodes while
 * Promotable fills 23% with 8, in panes of identical size?
 *
 * Static reading got me a wrong answer first: `panel.promo.js` has
 * `// .force("charge", d3.forceManyBody().strength(-200))` commented out, which looks like "Promotable
 * has no repulsion" — until you notice the ACTIVE `.strength(-500)` on the very next line. Promotable
 * repels harder than Scratch (-60), and still clusters tighter. So the answer is not in the diff of
 * two source files read quickly; it is in which forces are actually attached at runtime.
 *
 * This reads the live simulations out of the running widget instead of inferring them.
 *
 *     node e2e/probe-0171-pane-forces.mjs
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

// Stage the incident the runsheet uses, as the walks now do (0189).
await page.goto(`${CMS}${P}/pages/incidents.html`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('tbody tr', { timeout: 40_000 }).catch(() => {})
await page.waitForTimeout(2_500)
const row = page.locator('tbody tr', { hasText: 'image5 walkthrough' }).first()
if (await row.count()) {
  await row.locator('td').nth(1).click()
  await page.waitForTimeout(8_000)
}

await page.goto(`${CMS}${P}/forms/composer-local.html`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(22_000)

const frame = page.frames().find((f) => /widgetdevcomposer/.test(f.url()))
if (!frame) {
  console.log('composer frame not found')
  await browser.close()
  process.exit(2)
}

const forces = await frame.evaluate(() => {
  const out = { found: [], error: null }
  try {
    const W = window.Widgets && window.Widgets.Panel
    if (!W) return { found: [], error: 'window.Widgets.Panel not reachable' }
    const sims = []
    const collect = (obj, trail, depth) => {
      if (!obj || typeof obj !== 'object' || depth > 3) return
      for (const k of Object.keys(obj)) {
        const v = obj[k]
        if (v && typeof v === 'object' && typeof v.force === 'function' && typeof v.alpha === 'function') {
          sims.push({ name: `${trail}.${k}`, sim: v })
        } else if (v && typeof v === 'object' && !Array.isArray(v)) {
          collect(v, `${trail}.${k}`, depth + 1)
        }
      }
    }
    collect(W, 'Widgets.Panel', 0)
    for (const { name, sim } of sims) {
      const entry = { sim: name, nodes: (sim.nodes && sim.nodes().length) || 0, forces: {} }
      for (const f of ['charge', 'link', 'center', 'collide', 'x', 'y']) {
        const force = sim.force(f)
        if (!force) continue
        const info = {}
        if (typeof force.strength === 'function') {
          const s = force.strength()
          info.strength = typeof s === 'function' ? '(fn)' : s
        }
        if (typeof force.distance === 'function') {
          const d = force.distance()
          info.distance = typeof d === 'function' ? '(fn)' : d
        }
        if (typeof force.radius === 'function') {
          const r = force.radius()
          info.radius = typeof r === 'function' ? '(fn)' : r
        }
        if (typeof force.x === 'function' && typeof force.y === 'function' && f === 'center') {
          info.centre = `${Math.round(force.x())},${Math.round(force.y())}`
        }
        entry.forces[f] = info
      }
      out.found.push(entry)
    }
  } catch (e) {
    out.error = String(e)
  }
  return out
})

if (forces.error) console.log(`⚠️ ${forces.error}`)
console.log(`simulations found: ${forces.found.length}\n`)
for (const s of forces.found) {
  console.log(`  ${s.sim}  (${s.nodes} nodes)`)
  for (const [name, info] of Object.entries(s.forces)) console.log(`     ${name.padEnd(8)} ${JSON.stringify(info)}`)
  console.log()
}

console.log('--- what to compare ---')
console.log('  Promotable fills 23% with 8 nodes; Scratch fills 67% with 4, in identically sized panes.')
console.log('  A "center" force present on one and absent on the other, or very different charge')
console.log('  strengths, would explain it — and would mean decision 0040 Option 2 does not need a')
console.log('  fitToPanel port at all, just the force set the other pane already uses.')

fs.writeFileSync(path.join(__dirname, 'probe-0171-pane-forces.json'), JSON.stringify(forces, null, 2))
console.log('  written: e2e/probe-0171-pane-forces.json')
await browser.close()
