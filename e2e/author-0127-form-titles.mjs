/**
 * docs/issues/0127 (obs 51) — the docx form panel is titled with the QUOTED TYPE NAME
 * ("identity"), modestly sized; the build shows ~40 px "<Type> Form" h1 text components that
 * push the first field below the fold. Sweep every stixorm OBJECT form (create/update under
 * sco-/sdo-/sro-forms; modal-forms keep their descriptive titles) and rewrite the text
 * component to <h5>"<type>"</h5>. Node paths are derived from the reconciled package XML
 * (zero-drift mirror), values written live via the property servlet, then re-mirrored.
 *
 * User directive 2026-08-16 ~21:45Z: validate Act screens against the docx and make the changes.
 *
 *     node e2e/author-0127-form-titles.mjs            # report
 *     node e2e/author-0127-form-titles.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const PROP = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
const PKG = path.resolve(__dirname, '../tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms')
const APPLY = process.argv.includes('--apply')

const decodeName = (n) => n.replace(/_x([0-9a-fA-F]{4})_/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
function findTitleTextPath(xml) {
  // walk tags, track path, find <text ...> whose text attr contains &lt;h1>
  const stack = []
  for (const m of xml.matchAll(/<(\/?)([\w:.\-]+)((?:"[^"]*"|[^>"])*?)(\/?)>/gs)) {
    const [, close, name, attrs, selfClose] = m
    if (name.startsWith('?')) continue
    if (close) { stack.pop(); continue }
    stack.push(decodeName(name))
    if (/text="&lt;h1>/.test(attrs)) {
      const p = [...stack]
      if (selfClose) stack.pop()
      return p
    }
    if (selfClose) stack.pop()
  }
  return null
}

const files = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) walk(path.join(d, e.name))
    else if (e.name === '.content.xml') files.push(path.join(d, e.name))
  }
})(PKG)

let changed = 0
for (const f of files) {
  const rel = path.relative(PKG, path.dirname(f)).replace(/\\/g, '/')
  const leaf = rel.split('/').pop() // e.g. identity-update
  const m = leaf && leaf.match(/^(.+)-(create|update)$/)
  if (!m) continue // skip non create/update pages (modal-forms parents etc.)
  const type = m[1]
  const xml = fs.readFileSync(f, 'utf8')
  if (!/text="&lt;h1>/.test(xml)) continue
  const tagPath = findTitleTextPath(xml)
  if (!tagPath) { console.log(`? ${rel} — h1 present but node path not found`); continue }
  const jcrPath = `/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/${rel}/` + tagPath.slice(1).join('/') // drop jcr:root
  const newText = `<h5>"${type}"</h5>`
  if (!APPLY) { console.log(`~ ${rel}: ${jcrPath.split('/').slice(-3).join('/')} -> ${newText}`); changed++; continue }
  const r = await fetch(PROP, {
    method: 'POST', headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ path: jcrPath, name: 'text', value: newText }),
  })
  const ok = r.status === 200
  // read back
  const after = ok ? await (await fetch(`http://localhost:8113${jcrPath}.json`, { headers: { Authorization: auth } })).json() : {}
  const landed = after.text === newText
  console.log(`${landed ? '✓' : '✗'} ${rel} -> ${newText} (${r.status})`)
  if (landed) changed++
}
console.log(`${APPLY ? 'changed' : 'would change'}: ${changed} form titles`)
