/**
 * docs/issues/0124 slice — Act 3's `composer-local` is the last full page without the shared app
 * chrome (`rootcontainer` holds only `main`; Acts 1/2/4 have aside + header). Adding it is one
 * scripted call, but the chrome takes horizontal space, and Act 3's panes are ALREADY the subject of
 * [0171](../../docs/issues/0171-act-3s-promotable-cluster-fills-only-12-percent-of-its-pane.md) —
 * a cluster filling 12% of its pane. Shrinking the pane could make the weakest Act's likeness worse.
 *
 * So measure the pane geometry before and after rather than assuming consistency is free.
 *
 *     node e2e/probe-0124-composer-panes.mjs            # prints the current geometry
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const PAGE = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html`
const STATE = path.join(__dirname, '.auth', 'cms.json')

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1280, height: 800 },
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()
await page.goto(PAGE, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(10_000)

const geom = await page.evaluate(() => {
  const frames = [...document.querySelectorAll('iframe')].map((f) => {
    const b = f.getBoundingClientRect()
    return { src: (f.src || '').split('/').slice(-1)[0].slice(0, 40), w: Math.round(b.width), h: Math.round(b.height) }
  })
  const aside = document.querySelector('aside, [class*="aside"]')
  const header = document.querySelector('header, [class*="header"]')
  return {
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    aside: aside ? `${Math.round(aside.getBoundingClientRect().width)}×${Math.round(aside.getBoundingClientRect().height)}` : null,
    header: header ? `${Math.round(header.getBoundingClientRect().width)}×${Math.round(header.getBoundingClientRect().height)}` : null,
    frames,
  }
})

console.log(`viewport ${geom.viewport} · aside ${geom.aside || '(none)'} · header ${geom.header || '(none)'}`)
console.log(`iframes: ${geom.frames.length}`)
for (const f of geom.frames) console.log(`   ${String(f.w).padStart(5)}×${String(f.h).padStart(4)}  ${f.src}`)
const widest = geom.frames.reduce((a, f) => (f.w > (a?.w || 0) ? f : a), null)
console.log(`\nwidest pane: ${widest ? `${widest.w}×${widest.h} (${widest.src})` : '(none)'}`)

fs.writeFileSync(path.join(__dirname, 'probe-0124-composer-panes.json'), JSON.stringify(geom, null, 2))
console.log('written: e2e/probe-0124-composer-panes.json')
await browser.close()
