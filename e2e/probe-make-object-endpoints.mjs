/**
 * docs/issues/0046 — which of the still-unrouted **create** forms actually have a Make-Object
 * endpoint, and which are genuinely blocked?
 *
 * Last tick recorded "the 14 remaining forms are blocked on missing Make-Object endpoints". That
 * rested on **one** measured 404 (`/stix-orm/sdo/note`) and was generalised to the rest. This probes
 * every one, so the claim is measured rather than assumed.
 *
 * ⚠️ Getting a usable answer needs the exact payload shape (docs/issues/0046):
 *   - wrap under the **type key**, hyphens becoming underscores: `email-addr` -> `email_addr_form`
 *   - the value goes in the **`object`** category, not `base_required`
 *   - a wrong shape returns **200 with `{"error":"true"}`**, indistinguishable from a broken
 *     endpoint unless you read services/fastapi/generated/algorithm/*.log
 *
 * So "200 with an error body" is reported as INCONCLUSIVE, not as absent — the distinction matters,
 * because only a real 404 means the endpoint was never built.
 *
 *     node e2e/probe-make-object-endpoints.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const FLOW = 'http://localhost:8111'

const audit = JSON.parse(fs.readFileSync(path.join(HERE, 'audit-form-save-legs.json'), 'utf8'))
const targets = (audit.neverAsked || []).filter((f) => f.page.includes('/'))

/** `…/sco-forms/email-addr-forms/email-addr-create` -> {family: 'sco', type: 'email-addr'} */
function describe(page) {
  const family = /\/sdo-forms\//.test(page) ? 'sdo' : /\/sco-forms\//.test(page) ? 'sco' : /\/sro-forms\//.test(page) ? 'sro' : null
  const type = page.split('/').pop().replace(/-create$/, '')
  return { family, type }
}

const rows = []
for (const t of targets) {
  const { family, type } = describe(t.page)
  if (!family) continue
  const url = `${FLOW}/stix-orm/${family}/${type}`
  const wrapper = `${type.replace(/-/g, '_')}_form`
  const body = {
    [wrapper]: { base_required: {}, base_optional: {}, sub: {}, object: {}, extensions: {} },
  }
  let status = '?'
  let verdict = 'unknown'
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    status = res.status
    const text = await res.text()
    if (status === 404) verdict = 'ABSENT (404)'
    else if (/"error"\s*:\s*"true"/.test(text)) verdict = 'inconclusive (200 + error body — endpoint EXISTS, payload incomplete)'
    else if (status === 200) verdict = 'EXISTS (200, object returned)'
    else verdict = `unexpected ${status}`
  } catch (e) {
    verdict = `unreachable: ${e.message}`
  }
  rows.push({ type, family, url: `/stix-orm/${family}/${type}`, status, verdict })
  console.log(`${String(status).padEnd(4)} ${type.padEnd(16)} ${verdict}`)
}

const absent = rows.filter((r) => r.verdict.startsWith('ABSENT'))
const exists = rows.filter((r) => !r.verdict.startsWith('ABSENT') && !r.verdict.startsWith('unreachable'))
console.log(`\n${rows.length} create forms probed`)
console.log(`   endpoint ABSENT (real 404): ${absent.length}  ${absent.map((r) => r.type).join(', ')}`)
console.log(`   endpoint present:           ${exists.length}  ${exists.map((r) => r.type).join(', ')}`)
console.log('\nNote: an empty payload cannot succeed for a type with required properties, so "200 +')
console.log('error body" means the ROUTE exists and the payload was incomplete — not that it is missing.')
