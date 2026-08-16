/**
 * docs/issues/0127 — which form panels actually carry the docx's "Options" / "Extensions" headings?
 *
 * 0127's gap list records both headings as absent. On 2026-08-16 `identity-update` was found to have
 * them **authored AND rendering** (`optheading` / `extheading` nodes; `<h6>Options</h6>` in the served
 * HTML), so the gap list is stale for at least one form. `author-0127-chip-headings.mjs` can author
 * them per-form or with `--all`, but nothing recorded which forms it was actually run against.
 *
 * This counts, per form, on the LIVE tree: the heading nodes, and — because a node is not a rendering
 * (docs/issues/0057) — whether the heading text reaches the served page.
 *
 *     node e2e/audit-0127-chip-headings.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const ROOT = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms'
const PKG = path.resolve(
  __dirname,
  '../tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms',
)

const pages = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (!e.isDirectory()) continue
    if (/-(create|update)$/.test(e.name)) pages.push(path.relative(PKG, path.join(d, e.name)).replace(/\\/g, '/'))
    else walk(path.join(d, e.name))
  }
})(PKG)

const getJson = async (p) => {
  const r = await fetch(`${CMS}${p}.1.json`, { headers: { Authorization: auth } })
  return r.ok ? r.json() : null
}

const rows = []
for (const rel of pages) {
  const base = `${ROOT}/${rel}/jcr:content/rootcontainer/main/form/two`
  const c1 = await getJson(`${base}/container1`)
  const c2 = await getJson(`${base}/container2`)
  const kids = (j) => (j ? Object.keys(j).filter((k) => j[k] && typeof j[k] === 'object') : [])
  const hasOpt = kids(c1).includes('optheading')
  const hasExt = kids(c2).includes('extheading')
  const chips1 = kids(c1).filter((k) => k.startsWith('button')).length
  const chips2 = kids(c2).filter((k) => k.startsWith('button')).length

  // A node is not a rendering (0057) — read the served page too.
  const res = await fetch(`${CMS}${ROOT}/${rel}.html`, { headers: { Authorization: auth } })
  const html = res.ok ? await res.text() : ''
  const rendersOpt = html.includes('>Options<')
  const rendersExt = html.includes('>Extensions<')

  rows.push({ rel, hasC1: !!c1, hasC2: !!c2, chips1, chips2, hasOpt, hasExt, rendersOpt, rendersExt, http: res.status })
}

const mark = (b) => (b ? '✓' : '·')
console.log(`form panels: ${rows.length}\n`)
console.log('  opt/ext = heading NODE present · render = heading TEXT in the served page')
for (const r of rows.sort((a, b) => a.rel.localeCompare(b.rel))) {
  console.log(
    `  ${mark(r.hasOpt)}${mark(r.rendersOpt)} ${mark(r.hasExt)}${mark(r.rendersExt)}  ` +
      `chips ${String(r.chips1).padStart(2)}/${r.chips2}  http ${r.http}  ${r.rel}`,
  )
}

const withC1 = rows.filter((r) => r.hasC1)
const optNode = withC1.filter((r) => r.hasOpt).length
const optRender = withC1.filter((r) => r.rendersOpt).length
const withC2 = rows.filter((r) => r.hasC2)
const extNode = withC2.filter((r) => r.hasExt).length
const extRender = withC2.filter((r) => r.rendersExt).length
console.log(`\n"Options"    node ${optNode}/${withC1.length} · rendering ${optRender}/${withC1.length} (of forms that have a chip row)`)
console.log(`"Extensions" node ${extNode}/${withC2.length} · rendering ${extRender}/${withC2.length} (of forms that have container2)`)

const authoredNotRendering = rows.filter((r) => (r.hasOpt && !r.rendersOpt) || (r.hasExt && !r.rendersExt))
if (authoredNotRendering.length) {
  console.log(`\n⚠️ authored but NOT rendering on ${authoredNotRendering.length} form(s) — the 0057 gap:`)
  for (const r of authoredNotRendering) console.log(`   ${r.rel}`)
}
fs.writeFileSync(path.join(__dirname, 'audit-0127-chip-headings.json'), JSON.stringify(rows, null, 2))
console.log('\nwritten: e2e/audit-0127-chip-headings.json')
