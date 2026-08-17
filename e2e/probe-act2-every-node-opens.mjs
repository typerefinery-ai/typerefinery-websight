/**
 * Act 2's spoken claim: "Every node opens now — coverage 29/29."
 *
 * The presenter runsheet says that out loud, and it was verified by hand on 2026-08-12. Since then
 * docs/issues/0140 measured **28** nodes on the demo incident, not 29, and two more Update forms were
 * authored on 2026-08-16 — so both the numerator and the denominator may have moved.
 *
 * ⚠️ A claim a presenter states to an investor has to be true when they state it. This re-measures it
 * the only way that means anything: every node on the incident the demo actually runs, through the
 * `form_path` its own stored wrapper carries — the value the Overview navigates to on left-select.
 *
 *     node e2e/probe-act2-every-node-opens.mjs
 */
const FLOW = process.env.FLOW_BASE || 'https://flow.typerefinery.localhost:8101'
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const payload = await fetch(`${FLOW}/viz-data/overview-default-incident`).then((r) => r.json()).catch(() => null)
if (!payload) {
  console.error('could not read overview-default-incident — is Flow up?')
  process.exit(2)
}
const nodes = payload.nodes || []
console.log(`Act 2 graph: ${nodes.length} node(s) on the current incident`)

const seen = new Map()
let opens = 0
const failures = []

for (const n of nodes) {
  const id = n.original?.id || n.id || '?'
  const type = n.original?.type || n.type || '?'
  const formPath = n.form_path || n.formPath || n.form
  if (!formPath) { failures.push(`${type}: no form_path on the stored wrapper`); continue }
  if (!seen.has(formPath)) {
    const url = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/${formPath}-update.html`
    const res = await fetch(url, { headers: { Authorization: auth } }).catch(() => null)
    const html = res ? await res.text() : ''
    const inputs = (html.match(/<input/g) || []).length
    // A 200 that renders no inputs is a page, not a form — 0049's symptom was an EMPTY frame.
    seen.set(formPath, { status: res ? res.status : 0, inputs, ok: !!res && res.status === 200 && inputs >= 5 })
  }
  const r = seen.get(formPath)
  if (r.ok) opens++
  else failures.push(`${type} -> ${formPath} (${r.status}, ${r.inputs} input(s))`)
}

console.log(`distinct form paths: ${seen.size}`)
console.log(`nodes that open a populated form: ${opens}/${nodes.length}`)

if (failures.length) {
  console.log(`\n🚩 ${failures.length} node(s) do NOT open:`)
  for (const f of [...new Set(failures)]) console.log(`   ${f}`)
}

console.log('\n=== VERDICT ===')
if (!nodes.length) {
  console.log('no nodes — nothing measured. Not a pass.')
  process.exit(2)
}
if (opens === nodes.length) {
  console.log(`every node opens: ${opens}/${nodes.length}.`)
  console.log(`⚠️ The presenter runsheet says "29/29". Say ${opens}/${nodes.length} — the graph has changed size.`)
} else {
  console.log(`${nodes.length - opens} of ${nodes.length} node(s) do not open. The "every node opens" claim is NOT true as written.`)
  process.exitCode = 1
}
