/**
 * docs/issues/0193 — which OTHER selects will 0150's degradation replace with a text input?
 *
 * 0150's rule (`2c1dcf6e`, 2026-08-16) degrades any select that has 0 non-empty `<option>`s at init.
 * It was assessed against the 19 `labels` controls it was written for. It was NOT assessed against
 * fields whose options arrive from the HOST at runtime, because nobody had enumerated that class —
 * and the SRO modal's `relationship_type` turned out to be in it, silently.
 *
 * A field degrades when it has none of:
 *   - authored `selectOptions`            (options in the content)
 *   - authored `readOptionsFromDataSource` (the component fetches its own)
 *   - authored `deferredOptions`           (0193's opt-out: the host fills it later)
 *
 * ⚠️ This is a STATIC read of the authored content, so it reports CANDIDATES, not confirmed defects:
 * it cannot tell a field that is *meant* to be free text (the `labels` case — correct behaviour) from
 * one whose options arrive later (the `relationship_type` case — broken). Naming the difference is a
 * human call per field. Reporting, not judging.
 *
 *     node e2e/audit-0193-degrading-selects.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(
  __dirname,
  '../tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage',
)

if (!fs.existsSync(ROOT)) {
  console.error(`content root not found: ${ROOT} — failing rather than reporting green`)
  process.exit(2)
}

const files = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name === '.content.xml') files.push(p)
  }
})(ROOT)

/**
 * Each select-field element, whitespace and all.
 *
 * ⚠️ TWO resource types, and a first version matched only the first — which reported **0** fields
 * named `labels` while docs/issues/0150 says its rule was written for 19 of them. That gap was the
 * clue: the `labels` controls are authored as `components/stix/forms/fields/select`, whose
 * `.content.json` declares `sling:resourceSuperType: typerefinery/components/forms/fields/select`.
 * It **inherits the generic component**, so it renders the same HTL and runs the same clientlib —
 * the 0150 degradation applies to it identically. Missing it made this sweep's "1 remaining" a
 * statement about a third of the selects in the tree.
 */
const SELECT_EL =
  /<[a-zA-Z_][\w:.-]*\s[^>]*?sling:resourceType="typerefinery\/components\/(?:stix\/)?forms\/fields\/select"[^>]*?\/?>/gs

const attr = (el, name) => {
  const m = el.match(new RegExp(`\\s${name}="([^"]*)"`))
  return m ? m[1] : null
}

/**
 * Is an authored attribute actually SET?
 *
 * ⚠️ `\0` is WebSight's escape for the empty string in `.content.xml`, and it is authored explicitly
 * all over this tree. A first version of this sweep tested `!!attr(...)`, which is true for the
 * two-character string `\0` — so **14 of the 16 `labels` fields, whose
 * `readOptionsFromDataSource` is authored EMPTY, were counted as having a data source**. That is why
 * the sweep reported 0 fields named `labels` while 0150 says its rule was written for 19 of them,
 * and it made the "will degrade" count an undercount rather than a conservative one.
 */
const isSet = (v) => v !== null && v.trim() !== '' && v.trim() !== '\\0' && v.trim() !== '\0'

const rows = []
for (const f of files) {
  const xml = fs.readFileSync(f, 'utf8')
  for (const m of xml.matchAll(SELECT_EL)) {
    const el = m[0]
    const name = attr(el, 'name') || '(unnamed)'
    const has = {
      selectOptions: /selectOptions/.test(xml.slice(m.index, m.index + 4000)) && /selectOptions/.test(el),
      dataSource: isSet(attr(el, "readOptionsFromDataSource")),
      deferred: /^(\{Boolean\})?true$/i.test(attr(el, 'deferredOptions') || ''),
    }
    // selectOptions is authored as CHILD nodes, not an attribute — look just after the element for a
    // <selectOptions> subtree belonging to it.
    const after = xml.slice(m.index, m.index + 3000)
    const childOptions = /<selectOptions[\s>]/.test(after) || el.endsWith('>') === false
    rows.push({
      page: path.relative(ROOT, path.dirname(f)).replace(/\\/g, '/'),
      name,
      dataSource: has.dataSource,
      deferred: has.deferred,
      childOptions: /<selectOptions[\s>]/.test(after),
      selfClosing: /\/>$/.test(el.trim()),
    })
  }
}

const willDegrade = rows.filter((r) => !r.dataSource && !r.deferred && !r.childOptions)
const labelsLike = willDegrade.filter((r) => /^labels$/i.test(r.name))
const others = willDegrade.filter((r) => !/^labels$/i.test(r.name))

console.log(`${files.length} .content.xml file(s) · ${rows.length} select field(s) authored`)
console.log(`  with a data source      : ${rows.filter((r) => r.dataSource).length}`)
console.log(`  with authored options   : ${rows.filter((r) => r.childOptions).length}`)
console.log(`  with deferredOptions    : ${rows.filter((r) => r.deferred).length}`)
console.log(`  → will DEGRADE to text  : ${willDegrade.length}  (${labelsLike.length} named "labels", ${others.length} other)`)

console.log(`\n"labels" — 0150's intended case, degrading is CORRECT (${labelsLike.length}):`)
const byName = new Map()
for (const r of labelsLike) byName.set(r.page, (byName.get(r.page) || 0) + 1)
console.log(`  across ${byName.size} page(s)`)

console.log(`\n⚠️ NOT "labels" — each needs a human call: free-text by design, or options-arrive-later like 0193? (${others.length}):`)
for (const r of others) console.log(`  ${r.name.padEnd(28)} ${r.page}`)

if (!others.length) {
  console.log('  (none — `relationship_type` was the only non-labels member, and it now carries deferredOptions)')
}
console.log('\nStatic read of authored content: these are CANDIDATES. A field that is meant to be free')
console.log('text and one whose options arrive later look identical here. See docs/issues/0193.')
