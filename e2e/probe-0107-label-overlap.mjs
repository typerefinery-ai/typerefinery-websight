/**
 * docs/issues/0107 — how much do the Overview's labels overlap each other?
 *
 * 0107 records "~15 `other-object-refs` / `object-refs` labels overlap into a black smear around the
 * hub node". Node labels were then ADDED (Option 2, commit 276a1e0), which increases text density -
 * so this measures whether that made the legibility problem worse, and by how much.
 *
 * Measures pairwise rectangle intersection of rendered text, reported separately for:
 *   edge labels only  (the pre-existing smear)
 *   node labels only  (what was just added)
 *   node-vs-edge      (interaction between the two)
 *
 * Deliberately geometric and exhaustive rather than sampled - docs/issues/0084 records a sampling
 * probe that passed identically with its guard removed.
 *
 *     node e2e/probe-0107-label-overlap.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const URL = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html`

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1400, height: 950 },
  ignoreHTTPSErrors: true,
  storageState: path.join(__dirname, '.auth', 'cms.json'),
})
const page = await context.newPage()
await page.goto(URL, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(25000)

const handle = await page.locator('iframe[src*="widgetdevoverview"]').elementHandle()
const frame = handle ? await handle.contentFrame() : null
if (!frame) {
  console.error('FAIL - could not reach the overview widget iframe.')
  await browser.close()
  process.exit(1)
}

const r = await frame.evaluate(() => {
  const rect = (e) => {
    const b = e.getBoundingClientRect()
    return { x: b.x, y: b.y, w: b.width, h: b.height, text: (e.textContent || '').trim() }
  }
  const overlaps = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

  // Count only what the user can actually SEE. Since docs/issues/0107 Option 3, edge labels are
  // opacity:0 until their node is hovered - counting hidden text would report a smear nobody sees.
  const visible = (e) => Number(getComputedStyle(e).opacity) > 0.05
  const nodeLabels = [...document.querySelectorAll('text.node-label')].filter(visible).map(rect).filter((r) => r.w > 0)
  const edgeLabels = [...document.querySelectorAll('text.edgelabel')].filter(visible).map(rect).filter((r) => r.w > 0)

  const countPairs = (A, B, same) => {
    let n = 0
    const examples = []
    for (let i = 0; i < A.length; i++) {
      for (let j = same ? i + 1 : 0; j < B.length; j++) {
        if (overlaps(A[i], B[j])) {
          n++
          if (examples.length < 6) examples.push(`"${A[i].text}" x "${B[j].text}"`)
        }
      }
    }
    return { n, examples }
  }

  // How many labels are involved in at least one collision (more meaningful than pair count).
  const involved = (A, others) =>
    A.filter((a) => others.some((b) => b !== a && overlaps(a, b))).length

  const all = [...nodeLabels, ...edgeLabels]
  return {
    nodeCount: nodeLabels.length,
    edgeCount: edgeLabels.length,
    edgeEdge: countPairs(edgeLabels, edgeLabels, true),
    nodeNode: countPairs(nodeLabels, nodeLabels, true),
    nodeEdge: countPairs(nodeLabels, edgeLabels, false),
    edgeInvolved: involved(edgeLabels, all),
    nodeInvolved: involved(nodeLabels, all),
    totalInvolved: involved(all, all),
    total: all.length,
  }
})

console.log(`\nlabels rendered: ${r.nodeCount} node + ${r.edgeCount} edge = ${r.total}`)
console.log(`\n--- overlapping PAIRS ---`)
console.log(`  edge x edge : ${r.edgeEdge.n}`)
r.edgeEdge.examples.forEach((e) => console.log(`      ${e}`))
console.log(`  node x node : ${r.nodeNode.n}`)
r.nodeNode.examples.forEach((e) => console.log(`      ${e}`))
console.log(`  node x edge : ${r.nodeEdge.n}`)
r.nodeEdge.examples.forEach((e) => console.log(`      ${e}`))

console.log(`\n--- labels involved in at least one collision ---`)
console.log(`  edge labels : ${r.edgeInvolved} / ${r.edgeCount}`)
console.log(`  node labels : ${r.nodeInvolved} / ${r.nodeCount}`)
console.log(`  overall     : ${r.totalInvolved} / ${r.total}  (${Math.round((r.totalInvolved / r.total) * 100)}%)`)

console.log('\n=== READING ===')
console.log(`Visible overlapping pairs: ${r.edgeEdge.n + r.nodeNode.n + r.nodeEdge.n}`)

// Hiding the edge labels is only acceptable if hovering brings them back - otherwise the
// relationship names are simply gone, which is a loss, not a de-clutter.
const firstIcon = frame.locator('svg image.node-image').first()
await firstIcon.hover()
await page.waitForTimeout(700)
const onHover = await frame.evaluate(() => {
  const shown = [...document.querySelectorAll('text.edgelabel')]
    .filter((e) => Number(getComputedStyle(e).opacity) > 0.05)
    .map((e) => (e.textContent || '').trim())
  return { count: shown.length, labels: shown.slice(0, 6) }
})
console.log(`\n--- hovering the first node ---`)
console.log(`  edge labels revealed: ${onHover.count} ${JSON.stringify(onHover.labels)}`)

const ok = r.edgeEdge.n === 0 && r.nodeEdge.n === 0 && r.nodeNode.n === 0 && onHover.count > 0
console.log('\n=== VERDICT ===')
console.log(`no visible label collisions at rest : ${r.edgeEdge.n + r.nodeNode.n + r.nodeEdge.n === 0}`)
console.log(`hover still reveals edge names      : ${onHover.count > 0}`)
console.log(ok ? 'PASS' : 'FAIL')

await browser.close()
process.exit(ok ? 0 : 1)
