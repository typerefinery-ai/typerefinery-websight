/**
 * docs/issues/0160 — **can the form's field groups actually be reordered?**
 *
 * The design ([`image3.png`](../../docs/mini-app-source/image3.png)) orders the groups
 * **Base → Optional → Object → Extensions**; the build renders
 * **Base Required → Object → Base Optional → Extensions**. 0160 recommended fixing the order and
 * priced it as "M — a content change across ~29 forms". **That estimate assumed a mechanism that has
 * never been tested.**
 *
 * There is **no ordering property** on the composites — measured:
 *
 *     composite    field.name=base_required   -> "Base Required"
 *     composite_1  field.name=object          -> "Object"
 *     composite_2  field.name=base_optional   -> "Base Optional"
 *     composite_3  field.name=extensions      -> "Extensions"
 *
 * …so render order is **JCR child-node order**. Whether `ComponentNodeServlet` preserves the order of
 * a posted JSON object's keys is the whole question, and it decides whether 0160's option 2 costs an
 * afternoon or is impossible without a new servlet capability.
 *
 * 🔑 **Tested on `malware-update`, deliberately.** It was authored today by
 * `author-stix-update-form.mjs`, so whatever this does, one re-run restores it **exactly** — no demo
 * form is put at risk to answer the question, and no throwaway page is left behind in a CMS that has
 * no delete API (docs/issues/0138 R-2).
 *
 *     node e2e/probe-0160-can-composites-be-reordered.mjs           # report current order only
 *     node e2e/probe-0160-can-composites-be-reordered.mjs --apply   # attempt the reorder, read back
 *
 * ⚠️ After --apply, restore with:  node e2e/author-stix-update-form.mjs --apply --only malware
 */
const CMS = process.env.CMS_BASE_HTTP || 'http://localhost:8113'
const AUTH = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const APPLY = process.argv.includes('--apply')

const PARENT = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms/malware-forms'
const NAME = 'malware-update'
const PATH = `${PARENT}/${NAME}`

/** Design order, by the composites' own field names. */
const WANTED = ['base_required', 'base_optional', 'object', 'extensions']

const get = async (url) => {
  const res = await fetch(url, { headers: { Authorization: AUTH } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

const groupOrder = (form) =>
  Object.entries(form)
    .filter(([k, v]) => v && typeof v === 'object' && !k.startsWith('jcr:') && v.field?.name)
    .map(([k, v]) => ({ node: k, group: v.field.name }))

const tree = await get(`${CMS}${PATH}.13.json`)
const form = tree['jcr:content'].rootcontainer.main.form
const before = groupOrder(form)

console.log('current child order:')
before.forEach((g, i) => console.log(`  ${i + 1}. ${g.node.padEnd(14)} ${g.group}`))
console.log(`\ndesign wants: ${WANTED.join(' -> ')}`)

if (!APPLY) {
  console.log('\n(report only — pass --apply to attempt the reorder)')
  process.exit(0)
}

// Rebuild the form object with the composites in the wanted order, everything else untouched.
const byGroup = new Map(before.map((g) => [g.group, g.node]))
const reordered = {}
for (const [k, v] of Object.entries(form)) {
  const isComposite = before.some((g) => g.node === k)
  if (!isComposite) reordered[k] = v // `two` (the button rows), jcr:* props, etc.
}
for (const group of WANTED) {
  const node = byGroup.get(group)
  if (node) reordered[node] = form[node]
  else console.error(`  WARN no composite carries field.name=${group}`)
}
tree['jcr:content'].rootcontainer.main.form = reordered

// Same reserved-property strip the authoring scripts use.
const ALLOWED = new Set(['jcr:primaryType', 'sling:resourceType'])
;(function strip(node) {
  if (!node || typeof node !== 'object') return
  for (const key of Object.keys(node)) {
    const v = node[key]
    if (v && typeof v === 'object' && !Array.isArray(v)) { strip(v); continue }
    if (/^(jcr|rep|oak|ws|mix|nt):/.test(key) && !ALLOWED.has(key)) delete node[key]
  }
})(tree)

const res = await fetch(`${CMS}/bin/typerefinery/component-node`, {
  method: 'POST',
  headers: { Authorization: AUTH, 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ parent: PARENT, name: NAME, json: JSON.stringify(tree) }),
})
console.log(`\nPOST -> ${res.status} ${(await res.text()).slice(0, 90)}`)

// 🔑 Read back the STORED order AND the RENDERED page. A servlet 200 proves nothing
// (docs/issues/0057), and stored order proves nothing about render order either.
const after = groupOrder((await get(`${CMS}${PATH}.13.json`))['jcr:content'].rootcontainer.main.form)
console.log('\nstored child order after POST:')
after.forEach((g, i) => console.log(`  ${i + 1}. ${g.node.padEnd(14)} ${g.group}`))

const html = await (await fetch(`${CMS}${PATH}.html`, { headers: { Authorization: AUTH } })).text()
const captions = [...html.matchAll(/>\s*(Base Required|Object|Base Optional|Extensions)\s*</g)].map((m) => m[1])
console.log(`\nRENDERED caption order: ${captions.join(' -> ') || '(none found)'}`)

const storedOk = after.map((g) => g.group).join(',') === WANTED.join(',')
console.log(
  `\nverdict: stored order ${storedOk ? 'CHANGED as asked' : 'did NOT change'} — ` +
  `reordering is ${storedOk ? 'MECHANISABLE' : 'NOT possible via this servlet'}`,
)
console.log('restore with: node e2e/author-stix-update-form.mjs --apply --only malware')
