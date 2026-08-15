/**
 * docs/issues/0123 / 0178 — the docx's outer tab strip (image2.png):
 * OS-Triage · Jupyter · Roaster · Attack-Flow · Workbench · D3FEND · Caldera.
 *
 * Authored into the SHARED header (static content renders fine by reference — only
 * page-context components mis-scope there). Honesty per tab, probed before authoring:
 * OS-Triage → incidents (active style); Attack-Flow → the live bpmn host; Workbench → the live
 * composer workbench; Jupyter/Roaster/D3FEND/Caldera render DISABLED (their services exist in
 * the repo but are not running/routed — a dead link would be a fake claim).
 * Rendered above the Create row via flexEnabled + order-first (the 0139 append-order beat).
 *
 * User directive 2026-08-16 ~21:45Z: validate Act screens against the docx and make the changes.
 *
 *     node e2e/author-0123-tabstrip.mjs --apply
 */
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const NODE_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-node'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const HEADER = '/content/typerefinery-showcase/pages/os-triage/admin/header/default/jcr:content/container'
const APPLY = process.argv.includes('--apply')

const TABS = [
  { name: 'tab_ostriage', label: 'OS-Triage', style: 'primary', navigateTo: '/content/typerefinery-showcase/pages/os-triage/pages/incidents.html' },
  { name: 'tab_jupyter', label: 'Jupyter', disabled: true },
  { name: 'tab_roaster', label: 'Roaster', disabled: true },
  { name: 'tab_attackflow', label: 'Attack-Flow', style: 'secondary', navigateTo: 'https://bpmn.typerefinery.localhost:8101/', newTab: true },
  { name: 'tab_workbench', label: 'Workbench', style: 'secondary', navigateTo: 'https://widgetdevcomposer.typerefinery.localhost:8101/workbench.html', newTab: true },
  { name: 'tab_d3fend', label: 'D3FEND', disabled: true },
  { name: 'tab_caldera', label: 'Caldera', disabled: true },
]

if (!APPLY) { console.log('report only — would author tabstrip with', TABS.length, 'tabs'); process.exit(0) }

// parent must be flex for order-first to lift the strip above the Create row
await fetch(PROP_SERVLET, {
  method: 'POST', headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ path: HEADER, name: 'flexEnabled', value: 'true' }),
}).then((r) => console.log('header flexEnabled=true ->', r.status))

const kids = Object.keys(await (await fetch(`${CMS}${HEADER}.1.json`, { headers: { Authorization: auth } })).json())
if (!kids.includes('tabstrip')) {
  const r = await fetch(NODE_SERVLET, {
    method: 'POST', headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      parent: HEADER, name: 'tabstrip',
      json: JSON.stringify({
        'jcr:primaryType': 'nt:unstructured',
        'sling:resourceType': 'typerefinery/components/layout/container',
        id: 'tabstrip_OSTRIAGE1',
        flexEnabled: 'true',
        classes: 'order-first w-100 d-flex flex-row gap-1 mb-1',
      }),
    }),
  })
  console.log('create tabstrip ->', r.status)
}
for (const t of TABS) {
  const strip = Object.keys(await (await fetch(`${CMS}${HEADER}/tabstrip.1.json`, { headers: { Authorization: auth } })).json())
  if (strip.includes(t.name)) { console.log(`${t.name} exists, skip`); continue }
  const json = {
    'jcr:primaryType': 'nt:unstructured',
    'sling:resourceType': 'typerefinery/components/forms/fields/button',
    id: `${t.name}_1`,
    label: t.label,
    buttonType: 'navigate',
    classes: t.disabled ? 'btn-sm disabled' : 'btn-sm',
    buttonStyle: t.disabled ? 'light' : t.style,
    isOutlinedButton: t.style === 'primary' ? 'false' : 'true',
  }
  if (t.navigateTo) json.navigateTo = t.navigateTo
  if (t.newTab) json.navigateToInNewWindow = 'true'
  const r = await fetch(NODE_SERVLET, {
    method: 'POST', headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ parent: `${HEADER}/tabstrip`, name: t.name, json: JSON.stringify(json) }),
  })
  console.log(`${t.name} -> ${r.status}`)
}
const after = Object.keys(await (await fetch(`${CMS}${HEADER}/tabstrip.1.json`, { headers: { Authorization: auth } })).json())
  .filter((k) => k.startsWith('tab_'))
console.log('tabstrip children:', after.join(', '))
