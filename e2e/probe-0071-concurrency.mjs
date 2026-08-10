/**
 * docs/issues/0071 — Option 6: does a concurrent WRITE destroy a connection save?
 *
 * ⚠️ First version of this probe used only GET traffic as the "competing load". That does not test a
 * lost update at all — a lost update needs a second *writer*. Corrected here.
 *
 * The competing writer is a second Create Connection save against a DIFFERENT object. That is
 * deliberate: it is the one write endpoint whose payload is known and safe. Calling the bulk
 * `unattached-context/save` with a guessed body could overwrite the whole unattached array, which
 * would destroy demo data to test a theory — not an acceptable trade.
 *
 * If the store is read–modify–written as a whole array, two simultaneous saves race and one field
 * goes missing. If both survive, writes are serialised at the object level and the lost-update
 * hypothesis is genuinely unsupported.
 */
const SAVE =
  'https://flow.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/modal-forms/foreign-key-connections/_jcr_content/rootcontainer/main/form/'
const SPLIT = 'http://localhost:8111/viz-data/unattached-split'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const TARGET = 'identity--9788aafd-507c-4610-9ed6-ba1d47c6ce1c'
const FIELD = 'created_by_ref'
const SUBJECTS = [
  'email-addr--30d9a416-203b-55c8-b796-8eb65ab5275e',
  'user-account--5c0dcb9b-5784-5aaf-b393-d990a4d68dd3',
  'user-account--113460bd-67f7-5611-bbbb-158d5c45255e',
]

const readAll = async () => {
  const j = await (await fetch(SPLIT, { signal: AbortSignal.timeout(30000) })).json()
  const all = [...(j.promo?.nodes || []), ...(j.scratch?.nodes || [])]
  return SUBJECTS.map((id) => {
    const o = (all.find((x) => x.id === id) || {}).original || {}
    return { id, keys: Object.keys(o).length, set: !!o[FIELD] }
  })
}

const save = (id) =>
  fetch(SAVE, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ source_ref: id, target_ref: TARGET, connection_field_list: FIELD }),
    signal: AbortSignal.timeout(60000),
  }).then((r) => r.status)

console.log('before:')
;(await readAll()).forEach((r) => console.log('  ', r.id.slice(0, 34), 'keys', r.keys, 'set', r.set))

// All three at once — genuinely simultaneous writers, not reads.
const codes = await Promise.all(SUBJECTS.map(save))
console.log('\nsave http codes:', codes.join(', '))

await new Promise((r) => setTimeout(r, 10000))
const after = await readAll()
console.log('\nafter (t+10s):')
after.forEach((r) => console.log('  ', r.id.slice(0, 34), 'keys', r.keys, 'set', r.set))

const lost = after.filter((r) => !r.set)
console.log()
console.log(
  lost.length === 0
    ? `=> ALL ${SUBJECTS.length} SURVIVED concurrent writes — lost-update hypothesis NOT supported`
    : `=> ${lost.length}/${SUBJECTS.length} LOST under concurrent writes — lost-update hypothesis SUPPORTED`,
)
