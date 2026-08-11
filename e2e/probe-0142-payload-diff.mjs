/**
 * docs/issues/0142 — why can the probe reproduce the extension failure and P5-S3 cannot?
 *
 * Three attempts at a regression guard all passed with the defect deliberately restored, and the
 * issue records the difference as "not yet understood". Guessing at it produced three worthless
 * assertions; this measures it instead.
 *
 * Runs BOTH sequences in one process against the same live form and prints the POST body each one
 * actually sends, so the difference is visible rather than inferred:
 *
 *   A  probe-style : open form -> click through extension controls -> type name -> save
 *   B  spec-style  : open form -> type name -> save  (P5-S3's FIRST save)
 *                    -> re-open form -> click through -> type name -> save
 *
 * B is what P5-S3 does, and the only structural difference is that a save has already happened on
 * that page object. If B's second payload lacks the extension keys, that is the whole answer.
 *
 *     node e2e/probe-0142-payload-diff.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SHOWCASE = 'https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage'
const IDENTITY_CREATE = `${SHOWCASE}/forms/stixorm-forms/stix-forms/sdo-forms/identity-forms/identity-create.html`
const STORAGE = path.join(__dirname, '.auth', 'cms.json')
const EXT_ID = 'extension-definition--66e2492a'
const firstNameSel = 'input[name="first_name"], input[name="first_name "]'

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  storageState: fs.existsSync(STORAGE) ? STORAGE : undefined,
  viewport: { width: 1600, height: 1000 },
})

/** Collect form POST bodies (ignore the /stix-orm/utils/connections chatter). */
const attach = (page, bag) => {
  page.on('request', (r) => {
    if (r.method() !== 'POST') return
    const b = r.postData() || ''
    if (b.includes('base_required')) bag.push(b)
  })
}

const openForm = async (page) => {
  await page.goto(IDENTITY_CREATE, { waitUntil: 'domcontentloaded', timeout: 120_000 })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(4_000)
}

/** Click through the extension controls until the extension's own fields appear. */
const openExtension = async (page, label) => {
  const btns = page.locator('[title*="extension" i], [title*="identity" i]')
  const n = await btns.count()
  let clicked = []
  for (let i = 0; i < n; i++) {
    const title = await btns.nth(i).getAttribute('title').catch(() => null)
    await btns.nth(i).click({ timeout: 5_000 }).catch(() => {})
    clicked.push(`#${i}=${JSON.stringify(title)}`)
    await page.waitForTimeout(1_000)
    if (await page.locator(firstNameSel).first().isVisible().catch(() => false)) break
  }
  console.log(`  [${label}] ${n} candidate controls; clicked ${clicked.join(', ')}`)
  console.log(`  [${label}] first_name visible: ${await page.locator(firstNameSel).first().isVisible().catch(() => false)}`)
}

const save = async (page, name) => {
  const f = page.locator('input[name="name"], input[name="name "]').first()
  await f.click()
  await f.pressSequentially(name, { delay: 20 })
  await page.getByRole('button', { name: /save|create/i }).first().click()
  await page.waitForTimeout(7_000)
}

const extBlock = (body) => {
  const m = new RegExp(`"${EXT_ID}[^"]*"\\s*:\\s*(\\{[^}]*\\})`).exec(body)
  return m ? m[1] : '<no extension block>'
}

// ---------------------------------------------------------------- sequence A
console.log('\n=== A: probe-style (open -> extension -> save) ===')
const aBodies = []
const pageA = await ctx.newPage()
attach(pageA, aBodies)
await openForm(pageA)
await openExtension(pageA, 'A')
await save(pageA, `Diff A ${new Date().toISOString().slice(11, 19)}`)
await pageA.close()
aBodies.forEach((b, i) => console.log(`  [A] form POST ${i}: extensions -> ${extBlock(b)}`))

// ---------------------------------------------------------------- sequence B
console.log('\n=== B: spec-style (open -> save -> RE-open -> extension -> save) ===')
const bBodies = []
const pageB = await ctx.newPage()
attach(pageB, bBodies)
await openForm(pageB)
await save(pageB, `Diff B first ${new Date().toISOString().slice(11, 19)}`)
await openForm(pageB)
await openExtension(pageB, 'B')
await save(pageB, `Diff B ext ${new Date().toISOString().slice(11, 19)}`)
await pageB.close()
bBodies.forEach((b, i) => console.log(`  [B] form POST ${i}: extensions -> ${extBlock(b)}`))

await browser.close()

console.log('\n--- VERDICT ---')
const aLast = aBodies[aBodies.length - 1] || ''
const bLast = bBodies[bBodies.length - 1] || ''
const keysIn = (b) => /"(contact_numbers|email_addresses|social_media_accounts|email-contact|field)"/.test(b)
console.log(`  A final payload carries extension fields: ${keysIn(aLast)}`)
console.log(`  B final payload carries extension fields: ${keysIn(bLast)}`)
if (keysIn(aLast) && !keysIn(bLast)) {
  console.log('  => THAT IS THE ANSWER: the spec-style sequence never submits the extension, so any')
  console.log('     assertion downstream of it is vacuous. A guard must assert the payload carries')
  console.log('     the extension BEFORE asserting anything about the result.')
} else if (keysIn(aLast) === keysIn(bLast)) {
  console.log('  => Both sequences behave the same here, so the difference is NOT the extra save.')
  console.log('     Look elsewhere (fixture page state, viewport, storageState) before writing a guard.')
}
