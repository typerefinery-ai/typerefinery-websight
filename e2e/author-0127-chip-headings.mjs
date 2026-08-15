/**
 * docs/issues/0127 — the docx's "Options" / "Extensions" headings over the chip rows
 * (image3.png). Per form: two/container1 holds the quoted-type title + the blue option chips;
 * two/container2 the orange extension chip(s). Headings are new small text components; flex
 * order makes appended nodes render in the docx's sequence (title → heading → chips):
 * title order-first · heading default 0 · chips order-1.
 *
 * User directive 2026-08-16 ~21:45Z: validate Act screens against the docx and make the changes.
 *
 *     node e2e/author-0127-chip-headings.mjs identity-update --apply     # one form
 *     node e2e/author-0127-chip-headings.mjs --all --apply               # sweep
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const NODE_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-node'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
const APPLY = process.argv.includes('--apply')
const ALL = process.argv.includes('--all')
const ONE = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null

const PKG = path.resolve(__dirname, '../tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms')
// enumerate form page dirs directly
const pages = []
;(function walk2(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (/-(create|update)$/.test(e.name)) pages.push(path.relative(PKG, path.join(d, e.name)).replace(/\\/g, '/'))
      else walk2(path.join(d, e.name))
    }
  }
})(PKG)

const targets = ONE ? pages.filter((p) => p.endsWith('/' + ONE) || p === ONE) : ALL ? pages : []
if (!targets.length) { console.log('specify a form or --all; known:', pages.length, 'pages'); process.exit(1) }

const post = (url, body) => fetch(url, { method: 'POST', headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body) })
const getJson = async (p) => { try { return await (await fetch(`${CMS}${p}.1.json`, { headers: { Authorization: auth } })).json() } catch { return null } }

let done = 0
for (const rel of targets) {
  const base = `/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/${rel}/jcr:content/rootcontainer/main/form/two`
  const c1 = await getJson(`${base}/container1`)
  if (!c1) { console.log(`- ${rel}: no two/container1, skip`); continue }
  const c1kids = Object.keys(c1).filter((k) => c1[k] && typeof c1[k] === 'object')
  const buttons = c1kids.filter((k) => k.startsWith('button'))
  const hasText = c1kids.includes('text')
  const c2 = await getJson(`${base}/container2`)
  const c2kids = c2 ? Object.keys(c2).filter((k) => c2[k] && typeof c2[k] === 'object') : []
  if (!APPLY) { console.log(`~ ${rel}: c1 buttons=${buttons.length} title=${hasText} c2 kids=${c2kids.length}`); continue }

  // container flex so orders apply
  await post(PROP_SERVLET, { path: `${base}/container1`, name: 'flexEnabled', value: 'true' })
  // title first
  if (hasText) await post(PROP_SERVLET, { path: `${base}/container1/text`, name: 'classes', value: 'order-first w-100' })
  // chips after the heading
  for (const b of buttons) {
    const cur = c1[b].classes || ''
    if (!String(cur).includes('order-1')) await post(PROP_SERVLET, { path: `${base}/container1/${b}`, name: 'classes', value: (cur ? cur + ' ' : '') + 'order-1' })
  }
  // Options heading (order 0 default → sits between title and chips)
  if (!c1kids.includes('optheading')) {
    await post(NODE_SERVLET, {
      parent: `${base}/container1`, name: 'optheading',
      json: JSON.stringify({ 'jcr:primaryType': 'nt:unstructured', 'sling:resourceType': 'typerefinery/components/content/text', id: `optheading_${rel.replace(/[^a-z]/g, '')}`.slice(0, 40), text: '<h6 class="text-muted mb-1">Options</h6>', classes: 'w-100' }),
    })
  }
  // Extensions heading above the orange chip(s)
  if (c2 && !c2kids.includes('extheading')) {
    await post(PROP_SERVLET, { path: `${base}/container2`, name: 'flexEnabled', value: 'true' })
    for (const k of c2kids.filter((k) => k.startsWith('button'))) {
      const cur = c2[k].classes || ''
      if (!String(cur).includes('order-1')) await post(PROP_SERVLET, { path: `${base}/container2/${k}`, name: 'classes', value: (cur ? cur + ' ' : '') + 'order-1' })
    }
    await post(NODE_SERVLET, {
      parent: `${base}/container2`, name: 'extheading',
      json: JSON.stringify({ 'jcr:primaryType': 'nt:unstructured', 'sling:resourceType': 'typerefinery/components/content/text', id: `extheading_${rel.replace(/[^a-z]/g, '')}`.slice(0, 40), text: '<h6 class="text-muted mb-1">Extensions</h6>', classes: 'w-100' }),
    })
  }
  console.log(`✓ ${rel}`)
  done++
}
console.log(`${APPLY ? 'applied' : 'would apply'} on ${APPLY ? done : targets.length} form(s)`)
