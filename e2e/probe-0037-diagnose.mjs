/** Why did the 0037 row-click handler not fire? Check code presence, config, and binding. */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/pages/incidents.html'

const browser = await chromium.launch({ channel: 'chrome' })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('tbody tr', { timeout: 30_000 })
await page.waitForTimeout(2_500)

const diag = await page.evaluate(() => {
  const out = {}
  // 1. Is the new function present in the loaded namespace?
  const ns = window.tableNs || window.TableNs || null
  out.namespaces = Object.keys(window).filter((k) => /table/i.test(k)).slice(0, 12)
  out.hasFn = !!(ns && typeof ns.addRowClickNavigation === 'function')

  // 2. Does any loaded script text mention it (i.e. is the NEW bundle served to THIS page)?
  out.scriptsMentioning = [...document.querySelectorAll('script[src]')].map((s) => s.src).length
  out.inlineMentions = document.documentElement.innerHTML.includes('rowClickNavigates')

  // 3. What does the table component's authored config actually expose?
  const el = document.querySelector('[data-component-config], .table-component, [id]')
  const cfgEls = [...document.querySelectorAll('*')].filter((e) => e.dataset && e.dataset.componentConfig)
  out.configCount = cfgEls.length
  out.configs = cfgEls.slice(0, 3).map((e) => {
    try {
      const c = JSON.parse(e.dataset.componentConfig)
      return { keys: Object.keys(c).slice(0, 22), rowClickNavigates: c.rowClickNavigates }
    } catch (err) { return { parseError: String(err).slice(0, 60) } }
  })
  return out
})

console.log(JSON.stringify(diag, null, 2))
await browser.close()
