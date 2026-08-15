/**
 * docs/issues/0124 / 0125 — Act 2/3's docx chrome (image1/image5): a per-page breadcrumb plus
 * the INNER tab bar (Overview · Composer · Navigator · AI Atlas · Malware MBC · D3FEND) above
 * the content. Authored per page (breadcrumbs is page-context — the shared header mis-scopes
 * it, learned in 0123's pass), rendered above the existing content via flexEnabled +
 * order-first w-100 (equal order keeps source order: breadcrumb, then tab bar, then content).
 * Live targets: Overview/Composer/Navigator pages; AI Atlas/Malware MBC/D3FEND render disabled.
 *
 * User directive 2026-08-16 ~21:45Z: validate Act screens against the docx and make the changes.
 *
 *     node e2e/author-0124-pagebar.mjs overview-local --apply
 *     node e2e/author-0124-pagebar.mjs composer-local --apply
 */
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const NODE_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-node'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const PAGE = process.argv[2]
const APPLY = process.argv.includes('--apply')
if (!PAGE || PAGE.startsWith('--')) { console.log('usage: node author-0124-pagebar.mjs <page> [--apply]'); process.exit(1) }

const BASE = 'https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage'
const MAIN = `/content/typerefinery-showcase/pages/os-triage/forms/${PAGE}/jcr:content/rootcontainer/main`
const ACTIVE = PAGE.startsWith('overview') ? 'Overview' : PAGE.startsWith('composer') ? 'Composer' : ''

const TABS = [
  { name: 'itab_overview', label: 'Overview', navigateTo: `${BASE}/forms/overview-local.html` },
  { name: 'itab_composer', label: 'Composer', navigateTo: `${BASE}/forms/composer-local.html` },
  { name: 'itab_navigator', label: 'Navigator', navigateTo: `${BASE}/pages/attack-navigator.html` },
  { name: 'itab_aiatlas', label: 'AI Atlas', disabled: true },
  { name: 'itab_mbc', label: 'Malware MBC', disabled: true },
  { name: 'itab_d3fend', label: 'D3FEND', disabled: true },
]

if (!APPLY) { console.log(`report only — would author breadcrumb + inner tab bar on ${PAGE} (active: ${ACTIVE})`); process.exit(0) }

const post = (url, body) => fetch(url, { method: 'POST', headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body) })

await post(PROP_SERVLET, { path: MAIN, name: 'flexEnabled', value: 'true' }).then((r) => console.log('main flexEnabled ->', r.status))

const kids = Object.keys(await (await fetch(`${CMS}${MAIN}.1.json`, { headers: { Authorization: auth } })).json())
if (!kids.includes('breadcrumbs')) {
  await post(NODE_SERVLET, {
    parent: MAIN, name: 'breadcrumbs',
    json: JSON.stringify({ 'jcr:primaryType': 'nt:unstructured', 'sling:resourceType': 'typerefinery/components/layout/breadcrumbs', id: `breadcrumbs_${PAGE.replace(/-/g, '')}`, startLevel: '3', classes: 'order-first w-100' }),
  }).then((r) => console.log('breadcrumbs ->', r.status))
} else console.log('breadcrumbs exists')

if (!kids.includes('innertabs')) {
  await post(NODE_SERVLET, {
    parent: MAIN, name: 'innertabs',
    json: JSON.stringify({ 'jcr:primaryType': 'nt:unstructured', 'sling:resourceType': 'typerefinery/components/layout/container', id: `innertabs_${PAGE.replace(/-/g, '')}`, flexEnabled: 'true', classes: 'order-first w-100 d-flex flex-row gap-1 mb-2' }),
  }).then((r) => console.log('innertabs ->', r.status))
}
for (const t of TABS) {
  const strip = Object.keys(await (await fetch(`${CMS}${MAIN}/innertabs.1.json`, { headers: { Authorization: auth } })).json())
  if (strip.includes(t.name)) { console.log(`${t.name} exists`); continue }
  const active = t.label === ACTIVE
  const json = {
    'jcr:primaryType': 'nt:unstructured',
    'sling:resourceType': 'typerefinery/components/forms/fields/button',
    id: `${t.name}_${PAGE.replace(/-/g, '')}`,
    label: t.label,
    buttonType: 'navigate',
    classes: t.disabled ? 'btn-sm w-auto disabled' : 'btn-sm w-auto',
    buttonStyle: t.disabled ? 'light' : active ? 'primary' : 'secondary',
    isOutlinedButton: active ? 'false' : 'true',
  }
  if (t.navigateTo && !t.disabled) json.navigateTo = t.navigateTo
  await post(NODE_SERVLET, { parent: `${MAIN}/innertabs`, name: t.name, json: JSON.stringify(json) }).then((r) => console.log(`${t.name} -> ${r.status}`))
}
console.log('done for', PAGE)
