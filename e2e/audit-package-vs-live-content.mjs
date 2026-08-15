/**
 * docs/issues/0042 (Option 1) / 0144 / 0150 — size the package↔live content divergence,
 * file by file, so the reconciliation the 0044 deploy window needs stops being a folklore
 * number ("53 findings behind") and becomes a concrete work list.
 *
 * REPORT-ONLY (v1). For every form page in the content package under os-triage, fetch the
 * live page's jcr:content JSON and compare:
 *   - a PROPERTY WHITELIST (the classes the live fix scripts touched: field names, labels,
 *     option sources, templates) — attribute-level diffs, the safely-writable kind;
 *   - STRUCTURE — nodes present on one side only (save-leg _events_, added buttons…) —
 *     reported, never to be auto-written.
 *
 * The vault XML in this package is machine-generated (one attribute per line), parsed with a
 * minimal tag tokenizer — no XML dependency. Values are XML-unescaped before comparison.
 *
 *     node e2e/audit-package-vs-live-content.mjs            # summary
 *     node e2e/audit-package-vs-live-content.mjs --verbose  # every diff
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = path.resolve(
  __dirname,
  '../tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage',
)
const CMS = 'http://localhost:8113'
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const VERBOSE = process.argv.includes('--verbose')

// The property classes the live fix/author scripts have been changing. Anything outside this
// list may still drift but is not what the reconciliation is about (ids, timestamps, layout).
const WHITELIST = new Set([
  'name', 'label', 'title', 'placeholder', 'value', 'hideLabel',
  'readOptionsFromDataSource', 'readMethod', 'readPayload', 'readPayloadType',
  'readUrl', 'writeUrl', 'keyNameInOptionList', 'labelNameInOptionList',
  'flowapi_enable',
])

const unescapeXml = (v) =>
  v.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
   .replace(/&#xd;/gi, '\r').replace(/&#xa;/gi, '\n').replace(/&amp;/g, '&')

/** Minimal vault-XML → tree. Returns {name, props, children[]} for jcr:root. */
function parseVaultXml(xml) {
  const tokens = [...xml.matchAll(/<(\/?)([\w:.\-]+)((?:"[^"]*"|[^>"])*?)(\/?)>/gs)]
  const root = { name: '(root)', props: {}, children: [] }
  const stack = [root]
  for (const [, close, name, attrText, selfClose] of tokens) {
    if (name.startsWith('?')) continue
    if (close) { stack.pop(); continue }
    const node = { name, props: {}, children: [] }
    for (const [, k, v] of attrText.matchAll(/([\w:.\-]+)="([^"]*)"/g)) node.props[k] = unescapeXml(v)
    stack[stack.length - 1].children.push(node)
    if (!selfClose) stack.push(node)
  }
  return root.children[0] // jcr:root
}

async function liveJson(pagePath) {
  // depth 25 covers the deepest form composites; a paging-array answer means "too big" and is
  // detected by the caller (docs/issues: the .infinity.json vacuous-walk trap).
  const res = await fetch(`${CMS}${pagePath}/jcr:content.25.json`, { headers: { Authorization: auth } })
  if (!res.ok) return null
  const j = await res.json()
  return Array.isArray(j) ? null : j
}

function compare(xmlNode, liveNode, nodePath, out) {
  // whitelist attribute diffs
  for (const [k, pkgVal] of Object.entries(xmlNode.props)) {
    if (!WHITELIST.has(k)) continue
    const liveVal = liveNode[k]
    if (liveVal === undefined) continue // property absent live — structural-ish; keep quiet in v1
    // vault encodes an empty/null string property as the literal \0 — equivalent to live ""
    const pkgNorm = pkgVal === '\\0' ? '' : pkgVal
    if (String(liveVal) !== pkgNorm) out.attrDiffs.push({ nodePath, k, pkgVal, liveVal: String(liveVal) })
  }
  // children
  const liveChildren = Object.entries(liveNode).filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v))
  const liveNames = new Set(liveChildren.map(([n]) => n))
  const xmlNames = new Set(xmlNode.children.map((c) => c.name))
  for (const c of xmlNode.children) {
    if (!liveNames.has(c.name)) { out.pkgOnly.push(`${nodePath}/${c.name}`); continue }
    compare(c, liveNode[c.name], `${nodePath}/${c.name}`, out)
  }
  for (const [n] of liveChildren) if (!xmlNames.has(n)) out.liveOnly.push(`${nodePath}/${n}`)
}

// every page dir that has a .content.xml with a jcr:content
const files = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) walk(path.join(d, e.name))
    else if (e.name === '.content.xml') files.push(path.join(d, e.name))
  }
})(PKG_ROOT)

let pagesCompared = 0, pagesSkipped = 0
const totals = { attrDiffs: 0, pkgOnly: 0, liveOnly: 0 }
const perFile = []
for (const f of files) {
  const rel = path.relative(PKG_ROOT, path.dirname(f)).replace(/\\/g, '/')
  const pagePath = `/content/typerefinery-showcase/pages/os-triage${rel ? '/' + rel : ''}`
  const xml = fs.readFileSync(f, 'utf8')
  if (!/jcr:content/.test(xml)) { pagesSkipped++; continue }
  const tree = parseVaultXml(xml)
  const jcrContent = tree.children.find((c) => c.name === 'jcr:content')
  if (!jcrContent) { pagesSkipped++; continue }
  const live = await liveJson(pagePath)
  if (!live) { perFile.push({ rel, note: 'LIVE PAGE MISSING or too large to fetch' }); continue }
  const out = { attrDiffs: [], pkgOnly: [], liveOnly: [] }
  compare(jcrContent, live, '', out)
  pagesCompared++
  if (out.attrDiffs.length || out.pkgOnly.length || out.liveOnly.length) {
    perFile.push({ rel, ...out })
    totals.attrDiffs += out.attrDiffs.length
    totals.pkgOnly += out.pkgOnly.length
    totals.liveOnly += out.liveOnly.length
  }
}

for (const p of perFile) {
  if (p.note) { console.log(`❓ ${p.rel || '(root)'} — ${p.note}`); continue }
  console.log(`◐ ${p.rel || '(root)'} — ${p.attrDiffs.length} attr diff(s), ${p.pkgOnly.length} pkg-only node(s), ${p.liveOnly.length} live-only node(s)`)
  if (VERBOSE) {
    for (const d of p.attrDiffs) console.log(`    ${d.nodePath} @${d.k}: pkg=${JSON.stringify(d.pkgVal.slice(0, 60))} live=${JSON.stringify(d.liveVal.slice(0, 60))}`)
    for (const n of p.liveOnly) console.log(`    live-only: ${n}`)
    for (const n of p.pkgOnly) console.log(`    pkg-only:  ${n}`)
  }
}
console.log(`\npages compared: ${pagesCompared} (skipped ${pagesSkipped} non-page files)`)
console.log(`whitelist attribute diffs: ${totals.attrDiffs}`)
console.log(`package-only nodes: ${totals.pkgOnly}   live-only nodes: ${totals.liveOnly}`)
console.log('\nattr diffs are the safely-writable class (v2 --apply will update them in place);')
console.log('node-level drift needs the authored-content story per node — never auto-written.')
