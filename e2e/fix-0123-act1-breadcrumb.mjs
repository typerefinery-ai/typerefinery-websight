/**
 * docs/issues/0123 / 0124 — give the `pages/*` Acts the breadcrumb band image2 shows on every full page.
 *
 * Measured root cause (2026-08-16), after `probe-0124-breadcrumb.mjs` showed Acts 2 and 3 painting a
 * crumb trail while Acts 1 and 4 painted nothing:
 *
 *   node                                                    classes              startLevel  paints
 *   admin/header/default/.../container/breadcrumbs          "d-none"             4           NO
 *   pages/notes/.../rootcontainer/header/breadcrumbs        "d-none"             4           NO
 *   forms/overview-local/.../rootcontainer/main/breadcrumbs "order-first w-100"  3           YES
 *
 * Two findings, and the second is the one that matters:
 *
 * 1. **The component derives its trail from where the COMPONENT sits, not from the requested page.**
 *    The shared-header node renders the header page's own location — "Admin Pages Content Default
 *    Header" — on every page that includes it. So a single node in the shared header can never give
 *    each page its own crumbs, which is what `author-0123-breadcrumb.mjs` assumed.
 * 2. **Both non-painting nodes carry `classes="d-none"`.** They are not broken, they are HIDDEN —
 *    presumably by whoever saw the wrong trail and suppressed it rather than removing it. That is why
 *    changing `startLevel` on the notes page (tried 4 -> 3 -> 2) moved nothing: the element was
 *    display:none the whole time, and the text never stopped being the header's hierarchy.
 *
 * So the working pattern is Act 2's: a **per-page** node in the page's own content container, with
 * `order-first w-100` and `startLevel=3`. This authors exactly that for the `pages/*` Acts.
 *
 * ⚠️ It does NOT touch the two `d-none` nodes. They are inert, and deleting authored content to tidy
 * up is a separate decision — recorded on 0123 instead.
 *
 *     node e2e/fix-0123-act1-breadcrumb.mjs                # report
 *     node e2e/fix-0123-act1-breadcrumb.mjs --apply
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const NODE_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-node'
const B = '/content/typerefinery-showcase/pages/os-triage'
const APPLY = process.argv.includes('--apply')

// The `pages/*` Acts. Their structure is rootcontainer -> aside, header, container1 (Act 2's is
// rootcontainer -> main, and that is where its working node lives), so container1 is the analogue.
const TARGETS = [
  { name: 'Act 1 incidents', parent: `${B}/pages/incidents/jcr:content/rootcontainer/container1`, id: 'breadcrumbs_incidents' },
  { name: 'Act 4 navigator', parent: `${B}/pages/attack-navigator/jcr:content/rootcontainer/container1`, id: 'breadcrumbs_attacknavigator' },
]

const SHAPE = {
  'jcr:primaryType': 'nt:unstructured',
  'sling:resourceType': 'typerefinery/components/layout/breadcrumbs',
  classes: 'order-first w-100',
  startLevel: '3',
}

for (const t of TARGETS) {
  const parent = await (await fetch(`${CMS}${t.parent}.1.json`, { headers: { Authorization: auth } })).json().catch(() => null)
  if (!parent) {
    console.log(`- ${t.name}: no container at ${t.parent.split('jcr:content')[1]}, skip`)
    continue
  }
  const has = Object.keys(parent).includes('breadcrumbs')
  console.log(`${has ? '=' : '~'} ${t.name}: breadcrumbs ${has ? 'ALREADY present' : 'would be created'} under ${t.parent.split('jcr:content')[1]}`)
  if (!APPLY || has) continue

  const res = await fetch(NODE_SERVLET, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ parent: t.parent, name: 'breadcrumbs', json: JSON.stringify({ ...SHAPE, id: t.id }) }),
  })
  // A 200 is not evidence the node landed (docs/issues/0057) — read it back.
  const back = await (await fetch(`${CMS}${t.parent}/breadcrumbs.json`, { headers: { Authorization: auth } })).json().catch(() => ({}))
  const ok = back['sling:resourceType'] === SHAPE['sling:resourceType'] && back.startLevel === '3'
  console.log(`  create -> ${res.status} · reads back ${ok ? 'OK' : JSON.stringify(back).slice(0, 120)}`)
}

if (!APPLY) console.log('\n(report only — pass --apply)')
else console.log('\nNext: node e2e/probe-0124-breadcrumb.mjs — the band must PAINT and name the page, not the header.')
