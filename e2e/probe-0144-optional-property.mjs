/**
 * docs/issues/0144 - identity-create with an optional property filled — why does the `event` create form submit, answer 200, and
 * create nothing?
 *
 * That is recorded as an unexplained dead end, and it is the reason **P3-S12 — the only step
 * verifying os-threat#84 (promotion moves an object onto the incident) — cannot run**. It is the
 * single red step in the full regression.
 *
 * ⚠️ "200 and nothing happened" is a signature, not a mystery. docs/issues/0142 turned out to be
 * exactly this: the WebSight → Flow → FastAPI chain answers **HTTP 200 while the algorithm has
 * crashed**, and puts the truth in the response BODY (`"error":"true"`, `"output.exists":"False"`)
 * along with a `log` path holding the Python traceback. Nobody had read that log for `event`.
 *
 *     node e2e/probe-0093-event-create.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SHOWCASE = 'https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage'
const FORM = `${SHOWCASE}/forms/stixorm-forms/stix-forms/sdo-forms/identity-forms/identity-create.html`
const STORAGE = path.join(__dirname, '.auth', 'cms.json')
const FLOW = 'http://localhost:8111'

const unattached = async () => {
  const res = await fetch(`${FLOW}/viz-data/unattached-split`).catch(() => null)
  if (!res || !res.ok) return []
  const j = await res.json().catch(() => ({}))
  return [...(j.promo?.nodes ?? []), ...(j.scratch?.nodes ?? [])]
}

const before = await unattached()
console.log(`unattached objects before: ${before.length}`)

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  storageState: fs.existsSync(STORAGE) ? STORAGE : undefined,
  viewport: { width: 1600, height: 1000 },
})
const page = await ctx.newPage()

const posts = []
page.on('request', (r) => { if (r.method() === 'POST' && (r.postData() || '').includes('base_required')) posts.push({ url: r.url(), body: r.postData() }) })
page.on('response', async (res) => {
  if (res.request().method() !== 'POST') return
  const hit = posts.find((p) => p.url === res.url() && p.resp === undefined)
  if (hit) hit.resp = await res.text().catch(() => '')
})

await page.goto(FORM, { waitUntil: 'domcontentloaded', timeout: 120_000 })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(4_000)

const fields = await page.locator('input[name], select[name], textarea[name]')
  .evaluateAll((els) => els.map((e) => e.getAttribute('name')))
console.log(`\nform fields (${fields.length}): ${fields.join(', ')}`)

const name = page.locator('input[name="name"], input[name="name "]').first()
if (!(await name.isVisible().catch(() => false))) {
  console.error('FAIL - no name field on the event create form')
  await browser.close()
  process.exit(1)
}
// Typed, never set programmatically — the rule P0-S5 follows for the CMS login.
await name.click()
await name.pressSequentially(`Probe 0093 ${new Date().toISOString().slice(11, 19)}`, { delay: 20 })
const lbl = page.locator('[title="Labels"]').first()
if (await lbl.count()) {
  await lbl.click({ force: true }).catch(() => {})
  await page.waitForTimeout(2500)
  const li = page.locator('[name="labels"]').first()
  const n = await li.count()
  console.log('labels control count:', n, 'tag:', n ? await li.evaluate(e => e.tagName) : '-')
    if (n) {
    const opts = await li.locator('option').evaluateAll(o => o.map(x => x.value).filter(Boolean))
    console.log('label options:', opts.slice(0, 5).join(', ') || '(none)')
    if (opts.length) await li.selectOption(opts[0]).catch(e => console.log('select err', e.message.slice(0,60)))
  }
}
await page.getByRole('button', { name: /save|create/i }).first().click()
await page.waitForTimeout(9_000)
await browser.close()

const after = await unattached()
console.log(`unattached objects after : ${after.length}`)

console.log(`\nform POSTs: ${posts.length}`)
for (const p of posts) {
  console.log(`\n  request : ${String(p.body).replace(/\s+/g, ' ').slice(0, 700)}`)
  const text = String(p.resp || '')
  const isError = /"error"\s*:\s*"?true/i.test(text)
  console.log(`  error   : ${isError}`)
  const logPath = /"log"\s*:\s*"([^"]+)"/.exec(text)?.[1]?.replace(/\\\\/g, '\\')
  if (logPath) {
    console.log(`  log     : ${logPath}`)
    if (fs.existsSync(logPath)) {
      const lines = fs.readFileSync(logPath, 'utf8').split('\n')
      // The traceback is what matters; everything before it is dependency chatter.
      const start = lines.findIndex((l) => /Traceback/.test(l))
      const tail = start >= 0 ? lines.slice(start) : lines.slice(-14)
      console.log('  --- traceback ---')
      for (const l of tail) {
        const m = /check_io:\d+ - (.*)$/.exec(l)
        if (m && m[1].trim()) console.log(`    ${m[1]}`)
        else if (/ERROR/.test(l) && !/check_io/.test(l)) console.log(`    ${l.replace(/^.*\| /, '')}`)
      }
    } else {
      console.log('  (log file not found on disk)')
    }
  } else if (!isError) {
    console.log(`  response: ${text.replace(/\s+/g, ' ').slice(0, 300)}`)
  }
}
