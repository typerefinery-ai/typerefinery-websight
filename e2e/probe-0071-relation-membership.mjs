/**
 * docs/issues/0071 — controlled test of the relation-membership hypothesis.
 *
 * Two Create Connection saves that differ in ONE variable: whether the source object also appears
 * in unattached_relation.json. Same source TYPE (email-addr), same target, same field, same route.
 *
 *   A  email-addr--b8048a91   standalone       -> hypothesis says PERSISTS
 *   B  email-addr--4722424c   in a relation    -> hypothesis says NO-OPS
 *
 * B is deliberately the object docs/issues/0046 recorded writing successfully on 2026-08-05, so the
 * result also speaks to that contradiction.
 */
const SAVE =
  'https://flow.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/modal-forms/foreign-key-connections/_jcr_content/rootcontainer/main/form/'
const SPLIT = 'http://localhost:8111/viz-data/unattached-split'
const TYPES = 'http://localhost:8111/os-triage/rmb-force/get-connection-types'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const TARGET = 'identity--a9f10ba2-9773-48b6-a97b-ac9c47f532a1'
const FIELD = 'created_by_ref'
const CASES = [
  { label: 'A standalone  ', id: 'email-addr--b8048a91-def8-5ef7-8cd3-a7b3db9278e5', expect: 'PERSISTS' },
  { label: 'B in-relation ', id: 'email-addr--4722424c-7012-56b0-84d5-01d076fc547b', expect: 'NO-OPS' },
]

const readBack = async (id) => {
  const j = await (await fetch(SPLIT, { signal: AbortSignal.timeout(30000) })).json()
  const all = [...(j.promo?.nodes || []), ...(j.scratch?.nodes || [])]
  const n = all.find((x) => x.id === id)
  if (!n) return { present: false }
  const o = n.original || {}
  return { present: true, keys: Object.keys(o).length, field: o[FIELD] ?? null }
}

// The oracle first: does the API even allow this field for this pair? If not, a no-op is correct
// behaviour and proves nothing (docs/issues/0071 — P3-S7 passes vacuously for exactly this reason).
for (const c of CASES) {
  const r = await fetch(TYPES, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ source_ref: c.id, target_ref: TARGET }),
    signal: AbortSignal.timeout(30000),
  })
  const t = await r.text()
  c.allowed = t.includes(FIELD)
  console.log(`${c.label} connection-types allows ${FIELD}: ${c.allowed ? 'YES' : 'NO  <-- test invalid for this case'}`)
}
console.log()

for (const c of CASES) {
  const before = await readBack(c.id)
  const res = await fetch(SAVE, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ source_ref: c.id, target_ref: TARGET, connection_field_list: FIELD }),
    signal: AbortSignal.timeout(60000),
  })
  const body = (await res.text()).slice(0, 120).replace(/\s+/g, ' ')
  await new Promise((r) => setTimeout(r, 6000))
  const after = await readBack(c.id)

  const persisted = after.field && String(after.field).includes(TARGET.split('--')[1].slice(0, 8))
  console.log(`${c.label} ${c.id.slice(0, 30)}`)
  console.log(`   allowed=${c.allowed}  http=${res.status}  resp="${body}"`)
  console.log(`   before: keys=${before.keys} field=${before.field ?? 'unset'}`)
  console.log(`   after : keys=${after.keys} field=${after.field ?? 'unset'}`)
  console.log(`   => ${persisted ? 'PERSISTED' : 'NO-OP'}   (hypothesis predicted ${c.expect})`)
  console.log()
}
