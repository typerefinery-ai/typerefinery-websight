/**
 * docs/issues/0049 — can a COPIED ATT&CK object actually be opened in the Composer?
 *
 * Two ATT&CK Update forms were authored on 2026-08-16 and both serve **200** when fetched directly.
 * That is not the claim the Act makes. The claim is that an analyst copies a technique to Scratch in
 * Act 4 and can then **work on it** — and "the form exists at a URL" is a different statement from
 * "the object routes to it".
 *
 * 🔑 That gap is exactly what docs/issues/0193 turned on: `get-relationship-types` returned three
 * types (true) while the modal offered none (also true). Verifying the form and calling the capability
 * done would be the same mistake with the same shape.
 *
 * So: copy both objects through **Act 4's own route**, read each stored wrapper's `form_path` — the
 * value the Composer navigates to — and fetch it. 0049 recorded both as 404 before the forms existed;
 * a 200 here is the end-to-end statement.
 *
 *     node e2e/probe-0049-copied-attack-opens.mjs
 */
const FLOW = process.env.FLOW_BASE || 'https://flow.typerefinery.localhost:8101'
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const ROUTE = `${FLOW}/os-triage/transport/attack`
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

/** The two types Act 4 copies — P4-S3 copies a technique, P4-S4 its tactic. */
const TARGETS = [
  { step: 'P4-S3', label: 'attack-pattern (technique)', match: (t) => t === 'attack-pattern' },
  { step: 'P4-S4', label: 'x-mitre-tactic (tactic)', match: (t) => t === 'x-mitre-tactic' },
]

const split = await fetch(`${FLOW}/viz-data/unattached-split`).then((r) => r.json()).catch(() => null)
if (!split) {
  console.error('could not read unattached-split — is Flow up?')
  process.exit(2)
}
const pool = [...(split.promo?.nodes || []), ...(split.scratch?.nodes || [])]
console.log(`unattached pool: ${pool.length} object(s)`)

const typeOf = (n) => n.original?.type || n.type || n.heading || ''
let failures = 0
let found = 0

for (const t of TARGETS) {
  const hits = pool.filter((n) => t.match(typeOf(n)))
  if (!hits.length) {
    console.log(`\n${t.step} — ${t.label}: none in the pool right now.`)
    console.log('     Run walk-act4-gestures.mjs first (it copies one of each), then re-run this.')
    continue
  }
  found++
  const n = hits[0]
  const formPath = n.form_path || n.formPath || n.form || '(none)'
  console.log(`\n${t.step} — ${t.label}`)
  console.log(`  id        : ${(n.original?.id || n.id || '?').slice(0, 60)}`)
  console.log(`  form_path : ${formPath}`)

  if (formPath === '(none)') { console.log('  🚩 no form_path on the stored wrapper'); failures++; continue }

  // The Composer navigates to <forms root>/<form_path>-update.html — fetch exactly that.
  const url = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/${formPath}-update.html`
  const res = await fetch(url, { headers: { Authorization: auth } }).catch(() => null)
  const status = res ? res.status : 0
  const body = res ? await res.text() : ''
  const inputs = (body.match(/<input/g) || []).length
  const h1 = (/<h1>\s*([^<]+?)\s*<\/h1>/.exec(body) || [, '(none)'])[1]
  console.log(`  GET       : ${status}, ${inputs} input(s), h1="${h1}"`)
  // A 200 that renders no inputs is a page, not a form — 0049's original symptom was an empty frame.
  if (status !== 200 || inputs < 5) { console.log('  🚩 the copied object does NOT open a usable form'); failures++ }
  else console.log('  ✅ the copied object opens a populated form')
}

console.log('\n=== VERDICT ===')
if (!found) {
  console.log('neither type is in the pool — nothing was measured. Not a pass.')
  process.exit(2)
}
if (failures) {
  console.log(`${failures} of ${found} copied ATT&CK type(s) still cannot be opened. docs/issues/0049 stands.`)
  process.exitCode = 1
} else {
  console.log(`all ${found} copied ATT&CK type(s) open a populated form — Act 4's "and then work on it" half holds.`)
}
