/**
 * Measure Act 3's Promotable pane LEGIBILITY — how much of the text actually collides.
 *
 * 0171 records the pane as filling ~12% of its area, but the screenshot shows a second, separable
 * problem: the text. Node labels sit on top of their neighbours' icons, and the edges carry their
 * own labels (`derived-from`, `sighting-of-ref`, `where-sighted-refs`, `observed-data-refs`) which
 * pile up in the middle of the cluster. image5 draws the same graph with node labels clear of the
 * icons and **no edge labels at all** — the edges are plain curves.
 *
 * Fill and label collision need different fixes and are worth separating before either is chosen:
 * scaling the cluster up spreads the icons but multiplies the label text with it, so a fit step
 * alone may not make the pane readable.
 *
 * Reported:
 *   node labels          count, and how many pairs overlap each other
 *   labels over icons    labels whose box intersects an icon that is not their own
 *   edge labels          count (image5 has ZERO)
 *   worst offenders      the actual colliding strings, so the claim is checkable
 *
 *     node e2e/probe-act3-label-legibility.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html'
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

await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(26_000)

const frame = page.frames().find((f) => /widgetdevcomposer/.test(f.url()))
if (!frame) { console.log('composer frame not found'); await browser.close(); process.exit(1) }

const r = await frame.evaluate(() => {
  const svg = document.querySelector('svg.promo_svg')
  if (!svg) return { error: 'promo_svg not found' }

  const rect = (el) => { const b = el.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height } }
  const hit = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b
  const area = (a, b) => {
    const w = Math.min(a.r, b.r) - Math.max(a.l, b.l)
    const h = Math.min(a.b, b.b) - Math.max(a.t, b.t)
    return w > 0 && h > 0 ? w * h : 0
  }

  const icons = [...svg.querySelectorAll('image')].map((n) => ({ box: rect(n) })).filter((x) => x.box.w > 0)

  // ⚠️ The Composer has NO `g.node-labels` group — that is the OVERVIEW widget's structure. Here
  // every label is a bare <text>, so splitting on that selector reported "0 node labels", which is a
  // classifier artifact and not a fact about the pane. Classify by CONTENT instead: a label ending
  // in `-ref` / `-refs` is an embedded-reference edge label (object-refs, sighting-of-ref,
  // where-sighted-refs, observed-data-refs) — exactly the class image5 does not draw. Everything
  // else is a node name or the pane heading, which image5 DOES draw.
  const all = [...svg.querySelectorAll('text')]
    .map((t) => ({ s: t.textContent.trim(), box: rect(t) }))
    .filter((x) => x.box.w > 0 && x.s)
  const isRefLabel = (s) => /-refs?$/.test(s)
  const edgeLabels = all.filter((x) => isRefLabel(x.s))
  const nodeLabels = all.filter((x) => !isRefLabel(x.s))

  const collisions = []
  for (let i = 0; i < nodeLabels.length; i++) {
    for (let j = i + 1; j < nodeLabels.length; j++) {
      if (hit(nodeLabels[i].box, nodeLabels[j].box)) collisions.push([nodeLabels[i].s, nodeLabels[j].s])
    }
  }
  // A label over an icon is only a problem when it is not that label's OWN icon; approximate "own"
  // as the nearest icon by centre distance, and only count overlaps with others.
  const centre = (b) => ({ x: (b.l + b.r) / 2, y: (b.t + b.b) / 2 })
  let labelsOverForeignIcons = 0
  const overIcon = []
  for (const lab of nodeLabels) {
    const lc = centre(lab.box)
    let nearest = -1, best = Infinity
    icons.forEach((ic, k) => {
      const c = centre(ic.box)
      const d = (c.x - lc.x) ** 2 + (c.y - lc.y) ** 2
      if (d < best) { best = d; nearest = k }
    })
    icons.forEach((ic, k) => {
      if (k !== nearest && area(lab.box, ic.box) > 0) { labelsOverForeignIcons++; overIcon.push(lab.s) }
    })
  }

  const allEdgeText = [...new Set(edgeLabels.map((e) => e.s))]
  let edgeEdgeCollisions = 0
  for (let i = 0; i < edgeLabels.length; i++) {
    for (let j = i + 1; j < edgeLabels.length; j++) if (hit(edgeLabels[i].box, edgeLabels[j].box)) edgeEdgeCollisions++
  }

  // The decisive number for the decision: of ALL colliding text pairs in the pane, how many involve
  // a `-ref(s)` label? That is the share that suppressing edge labels would remove outright, with no
  // change to layout, forces or scale — i.e. the part of the fix that does NOT revise 0065.
  let totalPairs = 0, pairsWithRef = 0
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      if (!hit(all[i].box, all[j].box)) continue
      totalPairs++
      if (isRefLabel(all[i].s) || isRefLabel(all[j].s)) pairsWithRef++
    }
  }

  return {
    icons: icons.length,
    nodeLabels: nodeLabels.length,
    nodeLabelCollisions: collisions.length,
    collisionSamples: collisions.slice(0, 6),
    labelsOverForeignIcons,
    overIconSamples: [...new Set(overIcon)].slice(0, 6),
    edgeLabels: edgeLabels.length,
    edgeLabelStrings: allEdgeText.slice(0, 10),
    edgeEdgeCollisions,
    totalPairs, pairsWithRef,
  }
})

if (r.error) { console.log(r.error); await browser.close(); process.exit(1) }

console.log(`icons                       : ${r.icons}`)
console.log(`node labels                 : ${r.nodeLabels}`)
console.log(`  overlapping label PAIRS   : ${r.nodeLabelCollisions}`)
r.collisionSamples.forEach((c) => console.log(`      "${c[0]}"  ×  "${c[1]}"`))
console.log(`  labels over FOREIGN icons : ${r.labelsOverForeignIcons}`)
r.overIconSamples.forEach((s) => console.log(`      "${s}"`))
console.log(`edge labels                 : ${r.edgeLabels}   ⚠️ image5 has ZERO`)
console.log(`  distinct strings          : ${r.edgeLabelStrings.join(' · ')}`)
console.log(`  edge-label collisions     : ${r.edgeEdgeCollisions}`)
console.log(`
ALL colliding text pairs     : ${r.totalPairs}`)
console.log(`  involving a -ref(s) label : ${r.pairsWithRef}  (${r.totalPairs?Math.round(r.pairsWithRef/r.totalPairs*100):0}% — removed outright by suppressing edge labels, no layout change)`)

await browser.close()
