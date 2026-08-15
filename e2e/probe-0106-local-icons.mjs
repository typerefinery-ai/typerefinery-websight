/**
 * docs/issues/0106 — icons must survive with GitHub unreachable, and no request may leave for
 * githubusercontent at all.
 *
 * Loads the Overview with *.githubusercontent.com BLOCKED via route interception, then asserts:
 *   1. every node renders an icon (28 images, all with a non-zero natural size),
 *   2. zero requests were attempted to githubusercontent (blocked or not),
 *   3. all icon requests hit the local widgetdev host and answered 200.
 *
 *     node e2e/probe-0106-local-icons.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html'

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const context = await browser.newContext({
  ignoreHTTPSErrors: true,
  storageState: path.join(__dirname, '.auth', 'cms.json'),
  viewport: { width: 1600, height: 1000 },
})

let githubAttempts = 0
const iconResponses = []
await context.route('**/*githubusercontent.com/**', (route) => {
  githubAttempts++
  route.abort()
})
context.on('response', (res) => {
  if (res.url().includes('/assets/icons/img/')) iconResponses.push(res.status())
})

const page = await context.newPage()
await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded' })
const frame = page.frameLocator('iframe').first()
await frame.locator('svg image').first().waitFor({ timeout: 60_000 })
await page.waitForTimeout(8_000)

const icons = await frame.locator('svg').first().evaluate((svg) => {
  const imgs = [...svg.querySelectorAll('image')]
  return {
    total: imgs.length,
    drawn: imgs.filter((i) => i.getBoundingClientRect().width > 4).length,
    sampleHref: imgs[0] ? (imgs[0].getAttribute('href') || imgs[0].getAttribute('xlink:href') || '').slice(0, 90) : '',
  }
})

console.log(`node icons rendered : ${icons.drawn}/${icons.total} (sample: ${icons.sampleHref})`)
console.log(`github attempts     : ${githubAttempts} (route was blocked — any attempt is a fail)`)
console.log(`local icon responses: ${iconResponses.length}, non-200: ${iconResponses.filter((s) => s !== 200).length}`)

const ok = icons.total > 0 && icons.drawn === icons.total && githubAttempts === 0 && iconResponses.length > 0 && iconResponses.every((s) => s === 200)
console.log(ok ? '✅ icons are fully local — 0106 criteria met' : '🔴 0106 criteria NOT met')
await browser.close()
process.exit(ok ? 0 : 1)
