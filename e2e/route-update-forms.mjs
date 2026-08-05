/**
 * docs/issues/0046 — route the 14 update-shaped forms that have no route, and give each a save leg.
 *
 * **Why these 14 and not the other 17.** An *update* save leg needs only the viz fetch and
 * `/os-triage/unattached-context/save`. A *create* leg additionally needs a Make-Object endpoint per
 * STIX type, and several do not exist (`/stix-orm/sdo/note` is a 404), so create forms cannot be
 * completed here. The update forms can, today, with no upstream work.
 *
 * They matter: left-select opens an object's **update** form (#22, #94, P2-S5/P3-S5). Those forms
 * render and pre-fill today but cannot persist an edit, because no flow serves their route.
 *
 * Each form is taken through the whole path and verified at each stage, because a 200 is not
 * evidence (docs/issues/0057): enable -> flow appears -> save leg authored -> design read back.
 *
 *     node e2e/route-update-forms.mjs            # report what it would do
 *     node e2e/route-update-forms.mjs --apply
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

/**
 * `fetch` with a retry. Running 14 forms through provisioning hits FastAPI hard enough that a
 * connection is occasionally closed mid-request (`UND_ERR_SOCKET: other side closed`) — measured,
 * it killed a first run after two forms. A transient socket error must not be mistaken for a form
 * that failed to provision.
 */
async function retryFetch(url, options, attempts = 4) {
  let lastError
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fetch(url, options)
    } catch (error) {
      lastError = error
      console.log(`   retry ${i}/${attempts} for ${url.slice(-60)}: ${error.message}`)
      await sleep(2000 * i)
    }
  }
  throw lastError
}

const audit = JSON.parse(fs.readFileSync(path.join(HERE, 'audit-form-save-legs.json'), 'utf8'))
const targets = (audit.neverAsked || []).filter((f) => /update$/i.test(f.page))

/** `…/sdo-forms/identity-forms/identity-update` -> `identity`. */
const stixTypeOf = (page) => page.split('/').pop().replace(/-update$/, '')

console.log(`update-shaped forms with no route: ${targets.length}`)
for (const t of targets) console.log(`   ${stixTypeOf(t.page).padEnd(16)} ${t.page}`)

if (!APPLY) {
  console.log('\n(report only — pass --apply to route and author save legs)')
  process.exit(0)
}

/** The flow serving a component path, from Flow's own list: entry.group IS that path. */
async function flowFor(componentPath) {
  const flows = await (await retryFetch(`${FLOW}/fapi/streams/`)).json()
  const match = flows.filter((f) => f.group === componentPath)
  return match.length === 1 ? match[0].id : match.length ? `AMBIGUOUS(${match.map((m) => m.id).join(',')})` : null
}

const results = []
for (const t of targets) {
  const type = stixTypeOf(t.page)
  // The audit records the jcr:content path; Flow's `group` uses _jcr_content.
  const componentPath = t.contentPath.replace('/jcr:content/', '/_jcr_content/')

  const body = new URLSearchParams({ path: t.contentPath, name: 'flowapi_enable', value: 'true' })
  const enabled = await retryFetch(SERVLET, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!enabled.ok) {
    results.push({ type, stage: 'enable', ok: false, detail: `${enabled.status}` })
    console.log(`FAIL ${type}: enable -> ${enabled.status}`)
    continue
  }

  // Provisioning is a Sling job; give it time, then look for the flow rather than assume one.
  let flowId = null
  for (let i = 0; i < 10 && !flowId; i++) {
    await sleep(3000)
    flowId = await flowFor(componentPath)
  }
  if (!flowId || flowId.startsWith('AMBIGUOUS')) {
    results.push({ type, stage: 'provision', ok: false, detail: String(flowId) })
    console.log(`FAIL ${type}: no single flow for the component path (${flowId})`)
    continue
  }

  try {
    execFileSync(process.execPath, [path.join(HERE, 'author-update-save-leg.mjs'), flowId, type], {
      stdio: 'pipe',
    })
  } catch (e) {
    results.push({ type, stage: 'author', ok: false, detail: String(e).slice(0, 120) })
    console.log(`FAIL ${type}: authoring the save leg threw`)
    continue
  }

  // Read the design back — the save leg has to be there, not merely reported saved.
  const design = await (await retryFetch(`${FASTAPI}/flow/${flowId}/design`)).json()
  const ok = !!design.ctxsave && !!design.merge
  results.push({ type, stage: 'done', ok, detail: `${flowId}, ${Object.keys(design).length} nodes` })
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${type.padEnd(16)} ${flowId}  ${Object.keys(design).length} nodes`)
}

const good = results.filter((r) => r.ok).length
console.log(`\nrouted and given a save leg: ${good}/${targets.length}`)
for (const r of results.filter((x) => !x.ok)) console.log(`   FAILED ${r.type} at ${r.stage}: ${r.detail}`)
process.exitCode = good === targets.length ? 0 : 1
