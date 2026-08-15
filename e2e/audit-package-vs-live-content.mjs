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
 *     node e2e/audit-package-vs-live-content.mjs --apply    # write the WHITELIST attr diffs
 *                                                             into the package XML (live wins)
 *
 * --apply touches ONLY attribute values already reported as diffs, by exact unique-string
 * replacement of `attr="escaped-old"` within the file — if the escaped old string is not unique
 * in the file, the diff is SKIPPED with a warning rather than guessed at. Structural drift is
 * never written.
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
const APPLY = process.argv.includes('--apply')
const WRITE_NODES = process.argv.includes('--write-live-only')

const escapeXml = (v) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
   .replace(/\r/g, '&#xd;').replace(/\n/g, '&#xa;')

// The property classes the live fix/author scripts have been changing. Anything outside this
// list may still drift but is not what the reconciliation is about (ids, timestamps, layout).
const WHITELIST = new Set([
  'name', 'label', 'title', 'placeholder', 'value', 'hideLabel',
  'readOptionsFromDataSource', 'readMethod', 'readPayload', 'readPayloadType',
  'readUrl', 'writeUrl', 'keyNameInOptionList', 'labelNameInOptionList',
  'flowapi_enable',
])

// Vault ISO9075-encodes element names that XML cannot express — a child named "0" is stored as
// <_x0030_>. Decode for comparison with live JSON names (which are the real JCR names); without
// this, every numbered child reports as a pkg-only/live-only PAIR (652 of the first run's ~890
// "structural drift" lines were this artifact).
const decodeName = (n) => n.replace(/_x([0-9a-fA-F]{4})_/g, (_, h) => String.fromCharCode(parseInt(h, 16)))

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
    const node = { name: decodeName(name), props: {}, children: [] }
    for (const [, k, v] of attrText.matchAll(/([\w:.\-]+)="([^"]*)"/g)) node.props[k] = unescapeXml(v)
    stack[stack.length - 1].children.push(node)
    if (!selfClose) stack.push(node)
  }
  return root.children[0] // jcr:root
}

// Inverse of decodeName — vault ISO9075 encoding for element names XML cannot express.
const encodeName = (n) => n.replace(/^[0-9]|[^\w.\-]/g, (c) => `_x${c.charCodeAt(0).toString(16).padStart(4, '0')}_`)

/** Serialize a live JSON subtree as vault XML, indented to sit at `depth` levels (4 spaces each). */
function serializeNode(name, node, depth) {
  const pad = '    '.repeat(depth)
  const attrs = [`jcr:primaryType="${node['jcr:primaryType'] || 'nt:unstructured'}"`]
  for (const [k, v] of Object.entries(node)) {
    if (k === 'jcr:primaryType' || k.startsWith('jcr:created')) continue
    if (v === null || typeof v === 'object') continue
    const val = typeof v === 'boolean' ? `{Boolean}${v}` : String(v)
    attrs.push(`${k}="${escapeXml(val) === '' ? '\\0' : escapeXml(val)}"`)
  }
  const children = Object.entries(node).filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v))
  const open = `${pad}<${encodeName(name)}\n${pad}    ${attrs.join(`\n${pad}    `)}`
  if (!children.length) return `${open}/>\n`
  return `${open}>\n${children.map(([cn, cv]) => serializeNode(cn, cv, depth + 1)).join('')}${pad}</${encodeName(name)}>\n`
}

/**
 * Find the [start, end) span of the OPENING TAG of the element at `nodePath`
 * (path segments relative to jcr:content, e.g. "/rootcontainer/container1/form"). Walks the
 * same tokenizer as parseVaultXml, tracking the element stack, and returns the span of the
 * matching open tag — attribute edits are then scoped to that span alone.
 */
function findTagSpan(xml, nodePath) {
  const want = ['jcr:root', 'jcr:content', ...nodePath.split('/').filter(Boolean)]
  const stack = []
  for (const m of xml.matchAll(/<(\/?)([\w:.\-]+)((?:"[^"]*"|[^>"])*?)(\/?)>/gs)) {
    const [full, close, name, , selfClose] = m
    if (name.startsWith('?')) continue
    if (close) { stack.pop(); continue }
    stack.push(decodeName(name))
    const matches = stack.length === want.length && stack.every((n, i) => n === want[i])
    if (matches) return [m.index, m.index + full.length]
    if (selfClose) stack.pop()
  }
  return null
}

/** Like findTagSpan, but returns the whole element range: { openStart, openEnd, closeStart,
 *  closeEnd, selfClosing } — closeStart is where a new child can be inserted. */
function findElementRange(xml, nodePath) {
  const want = ['jcr:root', 'jcr:content', ...nodePath.split('/').filter(Boolean)]
  const stack = []
  let found = null
  for (const m of xml.matchAll(/<(\/?)([\w:.\-]+)((?:"[^"]*"|[^>"])*?)(\/?)>/gs)) {
    const [full, close, name, , selfClose] = m
    if (name.startsWith('?')) continue
    if (close) {
      if (found && stack.length === want.length) {
        return { ...found, closeStart: m.index, closeEnd: m.index + full.length, selfClosing: false }
      }
      stack.pop()
      continue
    }
    stack.push(decodeName(name))
    const matches = !found && stack.length === want.length && stack.every((n, i) => n === want[i])
    if (matches) {
      found = { openStart: m.index, openEnd: m.index + full.length }
      if (selfClose) return { ...found, closeStart: found.openEnd, closeEnd: found.openEnd, selfClosing: true }
    }
    if (selfClose) stack.pop()
  }
  return null
}

async function liveJson(pagePath) {
  return liveJsonDeep(`${pagePath}/jcr:content`)
}

/**
 * Two Sling depth traps, both hit by this audit (the .infinity.json vacuous-walk family):
 *  1. A too-deep selector answers **HTTP 300** with a paging array — `res.ok` is false, so a
 *     naive fetcher reports the page "missing" (which silently excluded the 16 biggest form
 *     pages, identity/indicator/task among them, from the first sizing run).
 *  2. A depth-N answer TRUNCATES SILENTLY below level N — nodes deeper than N simply vanish
 *     with no marker (identity-update's external-reference labels sit at level 14).
 * Fix: fetch at a workable depth, then re-fetch every node sitting AT the depth boundary —
 * those are the only nodes whose children could have been dropped.
 */
async function liveJsonDeep(nodePath, depth = 10) {
  const res = await fetch(`${CMS}${nodePath}.${depth}.json`, { headers: { Authorization: auth } })
  const j = await res.json().catch(() => null)
  if (!j) return null
  if (Array.isArray(j)) {
    // paging array (HTTP 300): node itself too big at this depth — take it shallow, recurse children
    const shallow = await (await fetch(`${CMS}${nodePath}.1.json`, { headers: { Authorization: auth } })).json().catch(() => null)
    if (!shallow || Array.isArray(shallow)) return null
    for (const [k, v] of Object.entries(shallow)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const child = await liveJsonDeep(`${nodePath}/${encodeURIComponent(k)}`, depth)
        if (child) shallow[k] = child
      }
    }
    return shallow
  }
  // re-fetch boundary nodes (at exactly `depth` levels down) — their children may be truncated
  const refetch = async (node, subPath, level) => {
    for (const [k, v] of Object.entries(node)) {
      if (!v || typeof v !== 'object' || Array.isArray(v)) continue
      if (level + 1 >= depth) {
        const full = await liveJsonDeep(`${nodePath}${subPath}/${encodeURIComponent(k)}`, depth)
        if (full) node[k] = full
      } else await refetch(v, `${subPath}/${encodeURIComponent(k)}`, level + 1)
    }
  }
  await refetch(j, '', 0)
  return j
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
  if (APPLY && out.attrDiffs.length) {
    let updated = fs.readFileSync(f, 'utf8')
    let applied = 0
    for (const d of out.attrDiffs) {
      const oldStr = `${d.k}="${escapeXml(d.pkgVal)}"`
      const newStr = `${d.k}="${escapeXml(d.liveVal)}"`
      const count = updated.split(oldStr).length - 1
      if (count === 1) {
        updated = updated.replace(oldStr, newStr)
        applied++
        continue
      }
      // Non-unique old string: locate the exact opening tag by walking the element path from
      // jcr:content, then replace the attribute within that tag's span only.
      const span = findTagSpan(updated, d.nodePath)
      if (!span) { console.log(`  ⚠️ SKIP ${rel} ${d.nodePath} @${d.k} — tag not found by path`); continue }
      const tagText = updated.slice(span[0], span[1])
      if (tagText.split(oldStr).length - 1 !== 1) { console.log(`  ⚠️ SKIP ${rel} ${d.nodePath} @${d.k} — ambiguous within tag`); continue }
      updated = updated.slice(0, span[0]) + tagText.replace(oldStr, newStr) + updated.slice(span[1])
      applied++
    }
    if (applied) { fs.writeFileSync(f, updated); console.log(`  ✍️ ${rel}: ${applied}/${out.attrDiffs.length} attr diff(s) written`) }
  }
  // --write-live-only: serialize live-only subtrees into the package (explicit opt-in — node
  // insertion is a bigger claim than an attribute edit; each write is logged and the file is
  // re-parsed as a sanity check before saving).
  if (WRITE_NODES && out.liveOnly.length) {
    let updated = fs.readFileSync(f, 'utf8')
    let wrote = 0
    for (const lo of out.liveOnly) {
      const segs = lo.split('/').filter(Boolean)
      const nodeName = segs.pop()
      const parentPath = '/' + segs.join('/')
      let subtree = live
      for (const s of segs) subtree = subtree?.[s]
      const nodeJson = subtree?.[nodeName]
      if (!nodeJson) { console.log(`  ⚠️ SKIP write ${rel}${lo} — live subtree unavailable`); continue }
      const range = findElementRange(updated, parentPath)
      if (!range) { console.log(`  ⚠️ SKIP write ${rel}${lo} — parent tag not found`); continue }
      const childXml = serializeNode(nodeName, nodeJson, segs.length + 2)
      if (range.selfClosing) {
        const openTag = updated.slice(range.openStart, range.openEnd)
        const parentTag = openTag.match(/^<([\w:.\-]+)/)[1]
        const pad = '    '.repeat(segs.length + 1)
        const reopened = openTag.replace(/\/>$/, '>')
        updated = updated.slice(0, range.openStart) + reopened + '\n' + childXml + pad + `</${parentTag}>` + updated.slice(range.openEnd)
      } else {
        updated = updated.slice(0, range.closeStart) + childXml + '    '.repeat(segs.length + 1) + updated.slice(range.closeStart).replace(/^[ ]*/, '')
      }
      wrote++
      console.log(`  ✍️ ${rel}: inserted live-only node ${lo}`)
    }
    if (wrote) {
      try { parseVaultXml(updated) } catch (e) { console.log(`  🔴 ${rel}: post-insert parse FAILED — not saving`); continue }
      fs.writeFileSync(f, updated)
    }
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
