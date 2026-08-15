/**
 * docs/issues/0172 — measure Act 1's ID column: rendered width vs the Name column,
 * whether the visible text is clipped (ellipsis), and whether the FULL id is still in
 * the DOM (textContent) for selectors like set-current-incident-by-ui.mjs (hasText).
 *
 *     node e2e/probe-0172-id-column.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/pages/incidents.html'

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('tbody tr', { timeout: 40_000 })
await page.waitForTimeout(3_000)

const m = await page.evaluate(() => {
  const table = [...document.querySelectorAll('table')].find((t) => t.querySelector('tbody tr td'))
  const headers = [...table.querySelectorAll('thead th')].map((th) => th.innerText.trim())
  const idIdx = headers.indexOf('ID')
  const nameIdx = headers.indexOf('Name')
  const row = table.querySelector('tbody tr')
  const idCell = row.cells[idIdx]
  const cs = getComputedStyle(idCell)
  return {
    headers,
    idWidth: Math.round(idCell.getBoundingClientRect().width),
    nameWidth: Math.round(row.cells[nameIdx].getBoundingClientRect().width),
    tableWidth: Math.round(table.getBoundingClientRect().width),
    idText: idCell.textContent.trim(),
    clipped: idCell.scrollWidth > idCell.clientWidth,
    overflow: cs.overflow, textOverflow: cs.textOverflow, whiteSpace: cs.whiteSpace,
    cellClass: idCell.className,
  }
})
console.log(JSON.stringify(m, null, 2))
console.log(`ID share of table: ${Math.round((m.idWidth / m.tableWidth) * 100)}%`)
await browser.close()
