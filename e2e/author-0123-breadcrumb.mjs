/**
 * docs/issues/0123 / 0124 — the docx shows a breadcrumb band on every full page
 * ("OS-Triage → My Incidents", image2.png). The platform HAS a breadcrumbs layout component
 * (page-hierarchy-derived, hideInNav-aware, startLevel from root). One node authored into the
 * SHARED header reference target gives every os-triage page its crumb trail; the intermediate
 * "Pages" page is hidden from crumbs via hideInNav (its own nav role is untouched — the
 * treeview lists its CHILDREN).
 *
 * User directive 2026-08-16 ~21:45Z: validate Act screens against the docx and make the changes.
 *
 *     node e2e/author-0123-breadcrumb.mjs            # report only
 *     node e2e/author-0123-breadcrumb.mjs --apply
 */
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const NODE_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-node'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const HEADER = '/content/typerefinery-showcase/pages/os-triage/admin/header/default/jcr:content/container'
const PAGES_JCR = '/content/typerefinery-showcase/pages/os-triage/pages/jcr:content'
const APPLY = process.argv.includes('--apply')

const kids = Object.keys(await (await fetch(`${CMS}${HEADER}.1.json`, { headers: { Authorization: auth } })).json())
  .filter((k) => !k.startsWith('jcr:'))
console.log('header container children:', kids.join(', '))

if (!APPLY) {
  console.log('~ would create breadcrumbs node (startLevel=4) + set hideInNav=true on the Pages page')
  process.exit(0)
}

if (!kids.includes('breadcrumbs')) {
  const res = await fetch(NODE_SERVLET, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      parent: HEADER,
      name: 'breadcrumbs',
      json: JSON.stringify({
        'jcr:primaryType': 'nt:unstructured',
        'sling:resourceType': 'typerefinery/components/layout/breadcrumbs',
        id: 'breadcrumbs_OSTRIAGE1',
        startLevel: '4',
      }),
    }),
  })
  console.log(`create breadcrumbs -> ${res.status}`)
} else console.log('breadcrumbs already present')

const hin = await fetch(PROP_SERVLET, {
  method: 'POST',
  headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ path: PAGES_JCR, name: 'hideInNav', value: 'true' }),
})
console.log(`Pages hideInNav=true -> ${hin.status}`)

// read back
const after = await (await fetch(`${CMS}${HEADER}/breadcrumbs.json`, { headers: { Authorization: auth } })).json()
const pj = await (await fetch(`${CMS}${PAGES_JCR}.json`, { headers: { Authorization: auth } })).json()
console.log('breadcrumbs node:', JSON.stringify(after))
console.log('Pages hideInNav:', pj.hideInNav)
