/**
 * alpha-launch 0076 — is P3-S9's target actually reachable?
 *
 * The simulation settles in ~1s (probe-0076-promo-settle.mjs), so "stable" is not what Playwright is
 * waiting on. This checks the other two halves of actionability for the exact element P3-S9 clicks:
 * is its click point inside the scrolling container, and is anything covering it?
 */
import { chromium } from '@playwright/test'
import path from 'path'

const CMS = 'https://cms.typerefinery.localhost:8101'
const COMPOSER = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html`

const b = await chromium.launch()
const ctx = await b.newContext({ ignoreHTTPSErrors: true, storageState: path.resolve('.auth/cms.json') })
const page = await ctx.newPage()
await page.goto(COMPOSER, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(12_000)

const frame = page.frames().find((f) => /widgetdevcomposer|4005/.test(f.url()))
if (!frame) {
  console.log('widget frame not found')
  await b.close()
  process.exit(1)
}

const report = await frame.evaluate(() => {
  const svg = document.querySelector('svg.promo_svg')
  if (!svg) return { error: 'no svg.promo_svg' }
  // P3-S9's selector, in DOM order — .first() is what it clicks.
  const nodes = Array.from(svg.querySelectorAll('image, g.node, circle'))
  const svgRect = svg.getBoundingClientRect()
  const host = svg.parentElement
  const hostRect = host ? host.getBoundingClientRect() : null

  const describe = (el) => {
    const r = el.getBoundingClientRect()
    const cx = r.x + r.width / 2
    const cy = r.y + r.height / 2
    const top = document.elementFromPoint(cx, cy)
    return {
      tag: el.tagName,
      id: el.getAttribute('id') || '',
      rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      centre: [Math.round(cx), Math.round(cy)],
      insideSvg: cx >= svgRect.x && cx <= svgRect.right && cy >= svgRect.y && cy <= svgRect.bottom,
      insideHost: hostRect ? cx >= hostRect.x && cx <= hostRect.right && cy >= hostRect.y && cy <= hostRect.bottom : null,
      inViewport: cx >= 0 && cy >= 0 && cx <= window.innerWidth && cy <= window.innerHeight,
      topElementIsSelf: top === el,
      topElement: top ? `${top.tagName}${top.id ? '#' + top.id : ''}` : null,
    }
  }

  return {
    total: nodes.length,
    svgRect: [Math.round(svgRect.x), Math.round(svgRect.y), Math.round(svgRect.width), Math.round(svgRect.height)],
    hostRect: hostRect ? [Math.round(hostRect.x), Math.round(hostRect.y), Math.round(hostRect.width), Math.round(hostRect.height)] : null,
    viewport: [window.innerWidth, window.innerHeight],
    first: describe(nodes[0]),
    unreachable: nodes.filter((el) => !describe(el).inViewport).length,
    covered: nodes.filter((el) => !describe(el).topElementIsSelf).length,
  }
})

console.log(JSON.stringify(report, null, 1))
await b.close()
