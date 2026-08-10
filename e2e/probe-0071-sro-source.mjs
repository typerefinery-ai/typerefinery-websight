/**
 * docs/issues/0071 — the test that was never actually run.
 *
 * The SRO-vs-SDO hypothesis was refuted on a single counterexample (a 07:02 identity save that also
 * failed). But probe-0071-relation-membership.mjs, which was supposed to settle it, used email-addr
 * sources throughout: its "in-relation" case was an object that *participates in* a relation, NOT a
 * `relationship--` object. So a relationship SOURCE has never been driven directly.
 *
 * Meanwhile every relationship source seen through the UI has failed (07:00, 11:51, 12:49 — 3 of 3)
 * while 8 of 9 non-relationship sources succeeded.
 *
 * This drives both, back to back, through the same route with the same target and field.
 */
const SAVE =
  'https://flow.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/modal-forms/foreign-key-connections/_jcr_content/rootcontainer/main/form/'
const SPLIT = 'http://localhost:8111/viz-data/unattached-split'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const TARGET = 'identity--eb49d54d-7830-4d0f-9812-fdcea5a505b3'
const FIELD = 'created_by_ref'

const snap = async () => {
  const j = await (await fetch(SPLIT, { signal: AbortSignal.timeout(30000) })).json()
  const all = [...(j.promo?.nodes || []), ...(j.scratch?.nodes || [])]
  return (id) => {
    const o = (all.find((x) => x.id === id) || {}).original || {}
    return { keys: Object.keys(o).length, set: !!o[FIELD] }
  }
}

// Pick live subjects: one relationship, one non-relationship, both currently without the field.
const first = await snap()
const j = await (await fetch(SPLIT, { signal: AbortSignal.timeout(30000) })).json()
const all = [...(j.promo?.nodes || []), ...(j.scratch?.nodes || [])]
const clean = (n) => n.original && !n.original[FIELD] && n.id !== TARGET
const sro = all.find((n) => n.id.startsWith('relationship--') && clean(n))
const sdo = all.find((n) => !n.id.startsWith('relationship--') && !n.id.startsWith('identity--') && clean(n))

if (!sro) console.log('!! no relationship source without the field — cannot run the SRO arm')
if (!sdo) console.log('!! no clean non-relationship source — cannot run the control arm')

for (const [label, node] of [
  ['SRO     ', sro],
  ['non-SRO ', sdo],
]) {
  if (!node) continue
  const before = first(node.id)
  const res = await fetch(SAVE, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ source_ref: node.id, target_ref: TARGET, connection_field_list: FIELD }),
    signal: AbortSignal.timeout(60000),
  })
  await new Promise((r) => setTimeout(r, 8000))
  const after = (await snap())(node.id)
  console.log(
    `${label} ${node.id.slice(0, 40).padEnd(42)} http=${res.status}  ` +
      `before(keys=${before.keys},set=${before.set})  after(keys=${after.keys},set=${after.set})  ` +
      `=> ${after.set ? 'PERSISTED' : 'NO-OP'}`,
  )
}
