/**
 * docs/issues/0127 (obs 71) — the docx renders the base system fields (id, created,
 * spec_version, modified) READ-ONLY. The input component only supported `disabled`, which
 * EXCLUDES fields from form serialization and would break update saves — so the component
 * gained a one-line `readonly` attribute passthrough (rides the 0044 deploy; readonly submits
 * but blocks editing). This sweep authors `readOnly=true` on those fields across every stixorm
 * object form NOW — inert until the deploy, active the moment it lands. `type` keeps its
 * existing `disabled` (its value is also authored, so serialization loss is moot).
 *
 * User directive 2026-08-16 ~21:45Z: validate Act screens against the docx and make the changes.
 *
 *     node e2e/author-0127-readonly-basefields.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const PROP = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
const APPLY = process.argv.includes('--apply')
const TARGET_NAMES = new Set(['id', 'created', 'modified', 'spec_version'])

const PKG = path.resolve(__dirname, '../tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms')
const pages = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (/-(create|update)$/.test(e.name)) pages.push(path.relative(PKG, path.join(d, e.name)).replace(/\\/g, '/'))
      else walk(path.join(d, e.name))
    }
  }
})(PKG)

let total = 0
for (const rel of pages) {
  const base = `/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/${rel}/jcr:content/rootcontainer/main/form/composite`
  let tree
  try { tree = await (await fetch(`${CMS}${base}.6.json`, { headers: { Authorization: auth } })).json() } catch { continue }
  if (!tree || Array.isArray(tree)) { console.log(`- ${rel}: composite unreadable, skip`); continue }
  const hits = []
  const walk = (o, p) => {
    for (const k in o) {
      const v = o[k]
      if (v && typeof v === 'object') {
        if (TARGET_NAMES.has(v.name) && (v['sling:resourceType'] || '').includes('fields/input')) hits.push({ path: `${base}${p}/${k}`, name: v.name, has: v.readOnly })
        walk(v, `${p}/${k}`)
      }
    }
  }
  walk(tree, '')
  for (const h of hits) {
    if (h.has === true) continue
    if (!APPLY) { total++; continue }
    const r = await fetch(PROP, { method: 'POST', headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ path: h.path, name: 'readOnly', value: 'true' }) })
    if (r.status === 200) total++
    else console.log(`✗ ${rel} ${h.name} -> ${r.status}`)
  }
  if (hits.length) console.log(`${APPLY ? '✓' : '~'} ${rel}: ${hits.map((h) => h.name).join(', ')}`)
}
console.log(`${APPLY ? 'authored' : 'would author'} readOnly on ${total} field(s)`)
