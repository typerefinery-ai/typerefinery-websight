/**
 * Probe where the graph/tree nodes actually live, for Acts 2 and 3.
 *
 * Reports every frame on the page and what SVG-ish elements it holds, so the specs can
 * target the right frame and the right element rather than guessing.
 */
import { chromium } from '@playwright/test'

const BASE = process.env.CMS_BASE || 'http://localhost:8113'
const OVERVIEW = '/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html'
const WORKBENCH = 'http://localhost:4005/workbench.html'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await browser.newContext({ ignoreHTTPSErrors: true })
const page = await ctx.newPage()

async function login() {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 90000 })
  if (page.url().includes('login')) {
    await page.locator('[data-testid="login-form-username"]').click()
    await page.locator('[data-testid="login-form-username"]').pressSequentially('wsadmin', { delay: 40 })
    await page.locator('[data-testid="login-form-password"]').click()
    await page.locator('[data-testid="login-form-password"]').pressSequentially('wsadmin', { delay: 40 })
    await page.locator('#login-form button[type="submit"]').click()
    await page.waitForURL((u) => !u.toString().includes('login'), { timeout: 60000 })
  }
}

async function survey(label, url, wait) {
  console.log(`\n===== ${label}: ${url}`)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForTimeout(wait)
  const frames = page.frames()
  console.log(`frames: ${frames.length}`)
  for (const f of frames) {
    try {
      const info = await f.evaluate(() => {
        const counts = {}
        for (const sel of ['svg', 'svg image', 'svg circle', 'svg g', 'svg path', 'svg text', 'canvas', 'li']) {
          counts[sel] = document.querySelectorAll(sel).length
        }
        const svgChildTags = {}
        document.querySelectorAll('svg *').forEach((n) => {
          const t = n.tagName.toLowerCase()
          svgChildTags[t] = (svgChildTags[t] || 0) + 1
        })
        const classed = {}
        document.querySelectorAll('svg [class]').forEach((n) => {
          const c = (n.getAttribute('class') || '').trim()
          if (c) classed[c] = (classed[c] || 0) + 1
        })
        return { counts, svgChildTags, topClasses: Object.entries(classed).sort((a, b) => b[1] - a[1]).slice(0, 10) }
      })
      if (info.counts.svg || info.counts.canvas) {
        console.log(` frame ${f.url().slice(0, 90)}`)
        console.log('   counts:', JSON.stringify(info.counts))
        console.log('   svg child tags:', JSON.stringify(info.svgChildTags))
        console.log('   top svg classes:', JSON.stringify(info.topClasses))
      }
    } catch (e) {
      console.log(` frame ${f.url().slice(0, 60)} -> ${String(e).slice(0, 80)}`)
    }
  }
}

await login()
await survey('OVERVIEW (Act 2)', BASE + OVERVIEW, 20000)
await survey('COMPOSER WORKBENCH (Act 3)', WORKBENCH, 12000)

await browser.close()
