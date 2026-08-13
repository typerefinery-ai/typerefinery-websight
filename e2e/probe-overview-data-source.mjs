/**
 * Which endpoint feeds Act 2's Overview, and what does it return for the CURRENT incident?
 *
 * Act 2 renders 0 nodes on the image5 incident even after its attached objects were authored
 * (decision 0039 Option 1). Before theorising about why, watch the actual traffic: log every request
 * the page makes to the Flow runtime, and dump the response body of whichever one carries the graph.
 *
 * ⚠️ Deliberately observes the network rather than reading the widget's state — "the graph is empty"
 * can mean the endpoint returned nothing, returned an error with HTTP 200 (docs/issues/0167), or
 * returned data the widget failed to draw. Those need different fixes and look identical on screen.
 *
 *     node e2e/probe-overview-data-source.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html'
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

const hits = []
page.on('response', async (res) => {
  const u = res.url()
  if (!/8111|viz-data|flow/i.test(u)) return
  let body = ''
  try { body = (await res.text()).slice(0, 4000) } catch { body = '(unreadable)' }
  hits.push({ url: u, status: res.status(), len: body.length, body })
})

await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(26_000)

console.log(`flow-ish responses: ${hits.length}\n`)
for (const h of hits) {
  console.log(`── ${h.status}  ${h.url.slice(0, 120)}`)
  let parsed = null
  try { parsed = JSON.parse(h.body) } catch {}
  if (parsed && typeof parsed === 'object') {
    const nodes = parsed.nodes || (parsed.data && parsed.data.nodes)
    const edges = parsed.edges || (parsed.data && parsed.data.edges)
    console.log(`   keys: ${Object.keys(parsed).slice(0, 10).join(', ')}`)
    if (Array.isArray(nodes)) console.log(`   nodes: ${nodes.length}   edges: ${Array.isArray(edges) ? edges.length : 'n/a'}`)
    if (parsed.error !== undefined) console.log(`   ⚠️ error field present: ${parsed.error}`)
    if (Array.isArray(nodes) && nodes.length) {
      console.log(`   first node: ${JSON.stringify(nodes[0]).slice(0, 160)}`)
    }
  } else {
    console.log(`   body[0..200]: ${h.body.slice(0, 200).replace(/\s+/g, ' ')}`)
  }
  console.log()
}

await browser.close()
