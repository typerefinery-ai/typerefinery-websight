/**
 * docs/issues/0057 — strip the stray trailing comma from `object_marking_refs,` field names.
 *
 * The authored name is `object_marking_refs,` — with a comma — so anything the field collects is
 * posted under a key the STIX property can never match. Same fault as
 * [0013](../../docs/issues/0013-form-field-names-trailing-space.md), different character.
 *
 * ⚠️ **Do not detect this with a page `.infinity.json` walk.** Sling truncates deep trees, and a
 * truncated read reports "0 remaining" for nodes it never reached — which briefly made a failed fix
 * look successful here. Read and write the exact node path, and read it back afterwards: a 200 from
 * the servlet is not evidence that the property changed.
 *
 *     node e2e/fix-comma-field-names.mjs            # report
 *     node e2e/fix-comma-field-names.mjs --apply    # fix, verifying each write
 */
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const ROOT = '/content/typerefinery-showcase/pages/os-triage/forms'
const SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const APPLY = process.argv.includes('--apply')
const strip = (s) => s.trim().replace(/[,;]+$/, '')

/** Every content node under the forms tree, one `.1.json` level at a time. */
async function descend(path, depth) {
  const r = await fetch(`${CMS}${path}.1.json`, { headers: { Authorization: auth } })
  if (!r.ok) return []
  let j
  try {
    j = await r.json()
  } catch {
    return []
  }
  const out = []
  for (const [k, v] of Object.entries(j)) {
    if (!v || typeof v !== 'object' || k.startsWith('jcr:')) continue
    const child = `${path}/${k}`
    out.push(child)
    if (depth > 0) out.push(...(await descend(child, depth - 1)))
  }
  return out
}

// The field sits at a fixed sub-path inside each form's Object Marking template.
const FIELD_SUBPATH =
  '/jcr:content/rootcontainer/main/form/composite_2/field/one/container1/template_5/container/selector/field'

const pages = await descend(ROOT, 4)
console.log(`checking ${pages.length} candidate form pages`)

const bad = []
for (const p of pages) {
  const nodePath = p + FIELD_SUBPATH
  const r = await fetch(`${CMS}${nodePath}.json`, { headers: { Authorization: auth } })
  if (!r.ok) continue
  let j
  try {
    j = await r.json()
  } catch {
    continue
  }
  if (typeof j.name === 'string' && j.name !== strip(j.name)) {
    bad.push({ path: nodePath, name: j.name, fixed: strip(j.name) })
  }
}

console.log(`field names with a stray trailing character: ${bad.length}`)
for (const b of bad) console.log(`   ${JSON.stringify(b.name)} -> ${JSON.stringify(b.fixed)}   ${b.path.slice(0, 100)}`)

if (!APPLY) {
  console.log('\n(report only — pass --apply to strip)')
  process.exit(bad.length ? 1 : 0)
}

let fixed = 0
for (const b of bad) {
  const body = new URLSearchParams({ path: b.path, name: 'name', value: b.fixed })
  const w = await fetch(SERVLET, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const wrote = await w.text()
  const after = await (await fetch(`${CMS}${b.path}.json`, { headers: { Authorization: auth } })).json()
  const ok = after.name === b.fixed
  if (ok) fixed++
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${w.status} now=${JSON.stringify(after.name)}  ${b.path.slice(60, 132)}`)
  if (!ok) console.log(`      servlet said: ${wrote.slice(0, 220)}`)
}
console.log(`\nverified fixed: ${fixed}/${bad.length}`)
process.exitCode = fixed === bad.length ? 0 : 1
