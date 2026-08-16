/**
 * docs/issues/0127, last likeness item — draw image3's labelled BOX around each field group.
 *
 * The captions (Base Required · Optional · Object · Extensions) have existed since 0113; the mockup's
 * grouping borders never landed, and the issue assumed they needed CSS in a clientlib — i.e. a bundle
 * deploy. Measured instead (`probe-0127-group-boxes.mjs`), and they do not:
 *
 *   caption <div class="form-group-caption">base required</div>
 *     -> ancestor <div id="field_GZSX3H5XS" class="col-lg-12 …">  7 fields, border 0px none
 *   caption "object"      -> <div id="field_NLAIHDIWK">  10 fields
 *   caption "extensions"  -> <div id="field_ZM8NCZZOS">   2 fields
 *
 * Each group has its OWN container holding exactly its own fields, and those containers are the
 * authored `composite<N>` -> `field` nodes — which accept a `classes` property that reaches the
 * rendered element (proven when the system-field fill landed). So this is authored content: **no
 * deploy**. (Written `composite<N>` rather than with a star: a star-slash inside a block comment ends
 * it, which is exactly how the first version of this file failed to parse.)
 *
 * ⚠️ Bootstrap utilities (`border rounded p-3 mb-3`), not a bespoke rule — the same reasoning as the
 * `bg-light` fill: the authored content already uses utilities throughout, a custom border style would
 * need a clientlib change, and inventing one would be inventing design. Swap `BOX` if a designer wants
 * something specific.
 *
 * ⚠️ The **Optional** group is empty until its chips add fields, so it will render as a bordered box
 * with a caption and nothing in it. That matches image3 (which shows all four boxes) and it tells the
 * viewer where optional properties will appear — but it is a visible consequence, so it is stated here
 * rather than discovered on stage.
 *
 *     node e2e/fix-0127-group-boxes.mjs identity-update
 *     node e2e/fix-0127-group-boxes.mjs identity-update --apply
 *     node e2e/fix-0127-group-boxes.mjs --all --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
const ROOT = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms'
const PKG = path.resolve(
  __dirname,
  '../tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms',
)
const BOX = process.env.BOX || 'border rounded p-3 mb-3'
const APPLY = process.argv.includes('--apply')
const ALL = process.argv.includes('--all')
const ONE = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null

const pages = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (!e.isDirectory()) continue
    if (/-(create|update)$/.test(e.name)) pages.push(path.relative(PKG, path.join(d, e.name)).replace(/\\/g, '/'))
    else walk(path.join(d, e.name))
  }
})(PKG)

const targets = ONE ? pages.filter((p) => p.endsWith('/' + ONE) || p === ONE) : ALL ? pages : []
if (!targets.length) {
  console.log(`specify a form or --all. known form panels: ${pages.length}`)
  process.exit(1)
}

let totalFound = 0
let totalWritten = 0
const failures = []
for (const rel of targets) {
  const formPath = `${ROOT}/${rel}/jcr:content/rootcontainer/main/form`
  const form = await (await fetch(`${CMS}${formPath}.1.json`, { headers: { Authorization: auth } })).json().catch(() => null)
  if (!form) {
    console.log(`- ${rel}: no form node, skip`)
    continue
  }
  // The group containers are `<composite*>/field` — one per field group, each holding that group's
  // own fields. Enumerate them rather than hardcoding composite/composite_1/… which differ per form.
  const groups = []
  for (const key of Object.keys(form)) {
    if (!/^composite(_\d+)?$/.test(key)) continue
    const fieldPath = `${formPath}/${key}/field`
    const node = await (await fetch(`${CMS}${fieldPath}.json`, { headers: { Authorization: auth } })).json().catch(() => null)
    if (!node || !/composite$/.test(String(node['sling:resourceType'] || ''))) continue
    const classes = String(node.classes || '')
    if (classes.split(/\s+/).includes('border')) continue // already boxed
    groups.push({ path: fieldPath, key, classes })
  }
  totalFound += groups.length

  if (!APPLY) {
    console.log(`~ ${rel}: ${groups.length} group container(s) to box${groups.length ? ` — ${groups.map((g) => g.key).join(', ')}` : ''}`)
    continue
  }
  let ok = 0
  for (const g of groups) {
    const value = (g.classes.trim() ? g.classes.trim() + ' ' : '') + BOX
    const res = await fetch(PROP_SERVLET, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ path: g.path, name: 'classes', value }),
    })
    // A 200 is not evidence the property landed (docs/issues/0057) — read it back.
    const back = await (await fetch(`${CMS}${g.path}.json`, { headers: { Authorization: auth } })).json().catch(() => ({}))
    if (String(back.classes || '').includes('border')) ok++
    else failures.push(`${rel} ${g.key} -> http ${res.status}, reads back ${JSON.stringify(back.classes)}`)
  }
  totalWritten += ok
  console.log(`✓ ${rel}: ${ok}/${groups.length}`)
}

console.log(`\n${APPLY ? `written ${totalWritten}/${totalFound}` : `would box ${totalFound}`} group container(s) across ${targets.length} form(s)`)
if (failures.length) {
  console.log(`\n⚠️ ${failures.length} did not land:`)
  for (const f of failures.slice(0, 20)) console.log(`   ${f}`)
  process.exit(1)
}
if (!APPLY) console.log('(report only — pass --apply)')
