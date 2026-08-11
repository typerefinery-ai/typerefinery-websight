/**
 * docs/issues/0140 — close the caveat left by the parse.py fix (`d7a75be`).
 *
 * The fix makes `wrap_stix_dict` name an object by its own `name` before falling back to
 * `post_field0`. The demo data was repaired separately, but the SOURCE fix was verified only by
 * reading — and a fix verified by reading is a hypothesis. It also rests on an unstated assumption:
 * that a fresh algorithm run re-imports `parse.py`, i.e. that the change is live WITHOUT restarting
 * FastAPI (docs/issues/0064 records that `execute_algorithm` spawns a `subprocess.Popen` per call,
 * which would mean a fresh import each time — but "would mean" is not "does").
 *
 * The discriminating case matters. `identity-ext`'s `post_field0` is
 * `extensions.<ext-def>.first_name`, so an identity is only a real test if BOTH are set:
 *    first_name set  ->  old code names it by first_name  ("Naive")
 *    name set        ->  new code names it by name        ("Naive Smith")
 * An identity with only `name` cannot tell the two apart, because the old code's own fallback
 * reached `name` anyway. This probe therefore reports the form's fields first and states plainly
 * whether a discriminating object could be created at all.
 *
 *     node e2e/probe-0140-new-object-naming.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SHOWCASE = 'https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage'
const IDENTITY_CREATE = `${SHOWCASE}/forms/stixorm-forms/stix-forms/sdo-forms/identity-forms/identity-create.html`
const STORAGE = path.join(__dirname, '.auth', 'cms.json')
const CTX = path.resolve(__dirname, '../../typerefinery/services/fastapi/generated/os-triage/context_mem')
const INCIDENT = 'incident--511d2ab7-c6a8-4ab9-bf11-2e027eee3eba'
const UNATTACHED = path.join(CTX, INCIDENT, 'unattached_objs.json')

const stamp = new Date().toISOString().slice(11, 19)
const NAME = `Probe 0140 ${stamp}`
const FIRST = 'Probe'

const readObjs = () => {
  if (!fs.existsSync(UNATTACHED)) return []
  const raw = JSON.parse(fs.readFileSync(UNATTACHED, 'utf8'))
  return Array.isArray(raw) ? raw : raw['0'] || []
}

const before = readObjs()
console.log(`unattached objects before: ${before.length}`)

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  storageState: fs.existsSync(STORAGE) ? STORAGE : undefined,
  viewport: { width: 1600, height: 1000 },
})
const page = await ctx.newPage()

// Watch the wire, not the UI. docs/issues/0110 was recorded as "no visible request" for a control
// that was in fact issuing one — the click had been watched in the browser instead of on the wire.
const posts = []
page.on('request', (r) => { if (r.method() === 'POST') posts.push({ url: r.url(), body: r.postData()?.slice(0, 4000) }) })
page.on('response', async (r) => {
  if (r.request().method() !== 'POST') return
  const hit = posts.find((p) => p.url === r.url() && p.status === undefined)
  if (hit) {
    hit.status = r.status()
    hit.resp = await r.text().catch(() => '<unreadable>')
  }
})
const consoleErrors = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300)) })

await page.goto(IDENTITY_CREATE, { waitUntil: 'domcontentloaded', timeout: 120_000 })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(4_000)

const fields = await page.locator('input[name], select[name], textarea[name]').evaluateAll((els) =>
  els.map((e) => ({ name: e.getAttribute('name'), type: e.getAttribute('type') || e.tagName.toLowerCase() })))
console.log(`\nform fields (${fields.length}):`)
console.log('  ' + fields.map((f) => f.name).join(', '))

// `first_name` lives on the os-threat identity extension, which the form hides behind an
// add-button (docs/issues/0113: the add-buttons are unlabelled blue rectangles whose names exist
// only in `title` attributes). Try to open it — without it this probe cannot discriminate.
const firstNameSel = 'input[name="first_name"], input[name="first_name "]'
if (!(await page.locator(firstNameSel).first().isVisible().catch(() => false))) {
  const extBtn = page.locator('[title*="extension" i], [title*="identity" i]')
  const n = await extBtn.count()
  console.log(`\nfirst_name not visible; trying ${n} extension add-button(s)`)
  for (let i = 0; i < n; i++) {
    await extBtn.nth(i).click({ timeout: 5_000 }).catch(() => {})
    await page.waitForTimeout(1_500)
    if (await page.locator(firstNameSel).first().isVisible().catch(() => false)) {
      console.log(`  revealed by add-button #${i} (title=${JSON.stringify(await extBtn.nth(i).getAttribute('title'))})`)
      break
    }
  }
}
const firstNameField = page.locator(firstNameSel).first()
const hasFirstName = await firstNameField.isVisible().catch(() => false)
console.log(`\nfirst_name field present & visible: ${hasFirstName}`)
if (!hasFirstName) {
  console.log('⚠️ Without first_name this run CANNOT discriminate: `post_field0` would not resolve,')
  console.log('   so the OLD code would have fallen back to `name` and produced the same result.')
}

// Typed, never set programmatically — the rule P0-S5 follows for the CMS login.
const nameField = page.locator('input[name="name"], input[name="name "]').first()
if (!(await nameField.isVisible().catch(() => false))) {
  console.error('FAIL - no `name` field on the create form; cannot run')
  await browser.close()
  process.exit(1)
}
if (hasFirstName) {
  await firstNameField.click()
  await firstNameField.pressSequentially(FIRST, { delay: 20 })
}
await nameField.click()
await nameField.pressSequentially(NAME, { delay: 20 })
await page.getByRole('button', { name: /save|create/i }).first().click()
await page.waitForTimeout(8_000)
await browser.close()

const after = readObjs()
console.log(`\nunattached objects after : ${after.length}`)
const beforeIds = new Set(before.map((o) => o.id))
const created = after.filter((o) => !beforeIds.has(o.id))
console.log(`newly created            : ${created.length}`)

console.log(`\nPOSTs fired: ${posts.length}`)
for (const p of posts) {
  console.log(`  ${p.status ?? '???'}  ${p.url}`)
  if (p.body) console.log(`     req : ${p.body.replace(/\s+/g, ' ').slice(0, 500)}`)
  if (p.resp) {
    // ⚠️ The flow proxy answers HTTP 200 and puts the real outcome in the BODY, so a status-only
    // check reads as success. Surface the error text in full rather than truncating it away.
    const text = String(p.resp).replace(/\s+/g, ' ')
    const isError = /"error"\s*:\s*"?true/i.test(text)
    console.log(`     resp: ${text.slice(0, isError ? 2500 : 300)}`)
    if (isError) console.log('     ^^^ HTTP 200 but the BODY says error:true - a silent failure')
  }
}
if (consoleErrors.length) {
  console.log(`\nconsole errors: ${consoleErrors.length}`)
  consoleErrors.slice(0, 5).forEach((e) => console.log(`  ${e}`))
}

if (!created.length) {
  console.log('\nINCONCLUSIVE for naming - nothing was created.')
  console.log('⚠️ But that is itself a finding when the extension WAS filled: the same form creates')
  console.log('   fine without it. See the POST log above for whether the request fired and what it')
  console.log('   answered - a 200 with nothing created is docs/issues/0089 \'s shape.')
  process.exit(0)
}

for (const o of created) {
  const ext = Object.values(o.original?.extensions || {}).find((v) => v && v.first_name) || {}
  console.log(`\n  id            : ${o.id}`)
  console.log(`  wrapper.name  : ${JSON.stringify(o.name)}`)
  console.log(`  original.name : ${JSON.stringify(o.original?.name)}`)
  console.log(`  first_name    : ${JSON.stringify(ext.first_name)}`)
  console.log(`  heading       : ${JSON.stringify(o.heading)}`)
}

console.log('\nVERDICT:')
const o = created[0]
const ext = Object.values(o.original?.extensions || {}).find((v) => v && v.first_name) || {}
if (!ext.first_name) {
  console.log('  NOT DISCRIMINATING - the created object has no first_name, so post_field0 does not')
  console.log('  resolve and both the old and new code would name it by `name`. The fix is not')
  console.log('  disproved, but it is not proved either. Do not record this as verification.')
} else if (o.name === o.original?.name) {
  console.log('  ✅ VERIFIED - named by its own `name` while first_name was set, which is exactly')
  console.log('     what the old code got wrong. The fix is live without a FastAPI restart, so the')
  console.log('     algorithm subprocess does re-import parse.py per run.')
} else if (o.name === ext.first_name) {
  console.log('  🔴 NOT LIVE - still named by first_name (post_field0). The fix is correct in source')
  console.log('     but the running service has not picked it up: it needs a FastAPI restart.')
} else {
  console.log(`  ⚠️ UNEXPECTED - name is ${JSON.stringify(o.name)}, neither the STIX name nor first_name.`)
}
