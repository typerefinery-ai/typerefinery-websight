// Which object types can the create-form path actually seed?
//
// alpha-launch docs/issues/0086. ensurePromotable() could not seed a task: nothing was written,
// while the same path seeds identities reliably via ensureScratch. This probe runs BOTH through
// identical code so the difference is attributable to the type rather than to the harness.
//
// Usage: node probe-0086-seed-types.mjs [type ...]        (default: identity event task sighting)

import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const here = path.dirname(fileURLToPath(import.meta.url))
const SHOWCASE = 'https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage'
const FLOW = 'http://localhost:8111'
const STORAGE = path.join(here, '.auth', 'cms.json')

const GROUP = { identity: 'sdo-forms', event: 'sdo-forms', task: 'sdo-forms', sighting: 'sro-forms' }
const types = process.argv.slice(2).length ? process.argv.slice(2) : ['identity', 'event', 'task', 'sighting']

const unattached = async () => {
  const res = await fetch(`${FLOW}/viz-data/unattached-split`)
  if (!res.ok) return []
  const j = await res.json()
  return [...(j.promo?.nodes ?? []), ...(j.scratch?.nodes ?? [])]
}

const browser = await chromium.launch({ channel: 'chrome' })
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  storageState: fs.existsSync(STORAGE) ? STORAGE : undefined,
})
const page = await ctx.newPage()

const results = []
for (const type of types) {
  const url = `${SHOWCASE}/forms/stixorm-forms/stix-forms/${GROUP[type]}/${type}-forms/${type}-create.html`
  const before = await unattached()
  const beforeIds = new Set(before.map((n) => n.id))

  // Capture what the form actually sends and what comes back - that is what distinguishes
  // "rejected by the API" from "never submitted".
  const posts = []
  page.on('request', (r) => {
    if (r.method() === 'POST') posts.push({ url: r.url().replace(/^https?:\/\/[^/]+/, ''), body: (r.postData() || '').slice(0, 160) })
  })
  const responses = []
  page.on('response', (r) => {
    if (r.request().method() === 'POST') responses.push({ url: r.url().replace(/^https?:\/\/[^/]+/, ''), status: r.status() })
  })

  await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(4_000)

  const name = page.locator('input[name="name"], input[name="name "]').first()
  const visible = await name.isVisible().catch(() => false)
  let clicked = false
  if (visible) {
    await name.click()
    await name.pressSequentially(`Seed probe ${type} ${new Date().toISOString().slice(11, 19)}`, { delay: 20 })
    const save = page.getByRole('button', { name: /save|create/i }).first()
    if (await save.isVisible().catch(() => false)) {
      await save.click()
      clicked = true
      await page.waitForTimeout(8_000)
    }
  }

  const after = await unattached()
  const fresh = after.filter((n) => !beforeIds.has(n.id))
  results.push({ type, visible, clicked, before: before.length, after: after.length, fresh: fresh.map((n) => `${n.type}`), posts, responses })
  page.removeAllListeners('request')
  page.removeAllListeners('response')
}

await browser.close()

console.log('type      nameField  saveClicked  unattached      new objects')
for (const r of results) {
  console.log(
    `${r.type.padEnd(9)} ${String(r.visible).padEnd(10)} ${String(r.clicked).padEnd(12)} ${String(r.before).padStart(3)} -> ${String(r.after).padStart(3)}   ${r.fresh.join(', ') || '(none)'}`
  )
}
console.log('\nPOSTs observed per type:')
for (const r of results) {
  console.log(`  ${r.type}:`)
  if (!r.posts.length) console.log('     (no POST was made at all)')
  r.posts.slice(0, 4).forEach((p, i) => console.log(`     -> ${p.url}  ${r.responses[i] ? '[' + r.responses[i].status + ']' : ''}`))
}
