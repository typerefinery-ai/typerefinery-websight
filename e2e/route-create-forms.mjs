/**
 * docs/issues/0046 — route the create forms whose Make-Object endpoint actually exists.
 *
 * ⚠️ **This corrects a claim I made a tick earlier.** I recorded that the remaining unrouted forms
 * were "blocked on missing Make-Object endpoints", generalising from a single measured 404
 * (`/stix-orm/sdo/note`). Probing every one (`probe-make-object-endpoints.mjs`) shows **7 of 10 have
 * an endpoint**; only `task`, `ipv4-addr` and `domain-name` genuinely 404.
 *
 * Payload shape, which is not guessable and cost two failed probes to establish:
 *   - wrap under the **type key**, hyphens becoming underscores: `email-addr` -> `email_addr_form`
 *   - the value goes in the **`object`** category, not `base_required`
 *
 *     node e2e/route-create-forms.mjs            # report
 *     node e2e/route-create-forms.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
const FLOW = 'http://localhost:8111'
const FASTAPI = 'http://localhost:8000'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const APPLY = process.argv.includes('--apply')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** FastAPI closes connections under provisioning load — a socket error is not a failed provision. */
async function retryFetch(url, options, attempts = 4) {
  let lastError
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fetch(url, options)
    } catch (error) {
      lastError = error
      console.log(`   retry ${i}/${attempts} for ${url.slice(-56)}: ${error.message}`)
      await sleep(2000 * i)
    }
  }
  throw lastError
}

// Measured by probe-make-object-endpoints.mjs. `task`, `ipv4-addr` and `domain-name` are excluded:
// their endpoints return a real 404, so no save leg can be authored for them here.
const WITH_ENDPOINT = new Set(['observed-data', 'event', 'sequence', 'email-message', 'anecdote', 'user-account', 'sighting'])

const audit = JSON.parse(fs.readFileSync(path.join(HERE, 'audit-form-save-legs.json'), 'utf8'))
const familyOf = (page) =>
  /\/sdo-forms\//.test(page) ? 'sdo' : /\/sco-forms\//.test(page) ? 'sco' : /\/sro-forms\//.test(page) ? 'sro' : null

const targets = (audit.neverAsked || [])
  .filter((f) => /-create$/.test(f.page) && familyOf(f.page))
  .map((f) => ({ ...f, type: f.page.split('/').pop().replace(/-create$/, ''), family: familyOf(f.page) }))
  .filter((f) => WITH_ENDPOINT.has(f.type))

console.log(`create forms with a live Make-Object endpoint: ${targets.length}`)
for (const t of targets) console.log(`   ${t.type.padEnd(16)} /stix-orm/${t.family}/${t.type}`)

if (!APPLY) {
  console.log('\n(report only — pass --apply to route and author save legs)')
  process.exit(0)
}

async function flowFor(componentPath) {
  const flows = await (await retryFetch(`${FLOW}/fapi/streams/`)).json()
  const match = flows.filter((f) => f.group === componentPath)
  return match.length === 1 ? match[0].id : match.length ? `AMBIGUOUS(${match.map((m) => m.id).join(',')})` : null
}

const results = []
for (const t of targets) {
  const componentPath = t.contentPath.replace('/jcr:content/', '/_jcr_content/')
  const enabled = await retryFetch(SERVLET, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ path: t.contentPath, name: 'flowapi_enable', value: 'true' }),
  })
  if (!enabled.ok) {
    results.push({ type: t.type, ok: false, stage: 'enable', detail: `${enabled.status}` })
    console.log(`FAIL ${t.type}: enable -> ${enabled.status}`)
    continue
  }

  let flowId = null
  for (let i = 0; i < 10 && !flowId; i++) {
    await sleep(3000)
    flowId = await flowFor(componentPath)
  }
  if (!flowId || flowId.startsWith('AMBIGUOUS')) {
    results.push({ type: t.type, ok: false, stage: 'provision', detail: String(flowId) })
    console.log(`FAIL ${t.type}: no single flow for the component path (${flowId})`)
    continue
  }

  const wrapper = `${t.type.replace(/-/g, '_')}_form`
  try {
    execFileSync(
      process.execPath,
      [path.join(HERE, 'author-form-save-leg.mjs'), flowId, `http://127.0.0.1:8111/stix-orm/${t.family}/${t.type}`, wrapper, t.type],
      { stdio: 'pipe' },
    )
  } catch (e) {
    results.push({ type: t.type, ok: false, stage: 'author', detail: String(e).slice(0, 120) })
    console.log(`FAIL ${t.type}: authoring the save leg threw`)
    continue
  }

  const design = await (await retryFetch(`${FASTAPI}/flow/${flowId}/design`)).json()
  const ok = !!design.ctxsave
  results.push({ type: t.type, ok, stage: 'done', detail: `${flowId}, ${Object.keys(design).length} nodes` })
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${t.type.padEnd(16)} ${flowId}  ${Object.keys(design).length} nodes  wrapper ${wrapper}`)
}

const good = results.filter((r) => r.ok).length
console.log(`\nrouted and given a save leg: ${good}/${targets.length}`)
for (const r of results.filter((x) => !x.ok)) console.log(`   FAILED ${r.type} at ${r.stage}: ${r.detail}`)
process.exitCode = good === targets.length ? 0 : 1
