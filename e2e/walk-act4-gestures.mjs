/**
 * Act 4 gesture walk in headed Chrome — P4-S1…S5 against the REAL host page.
 *
 * P4-S1  the matrix renders in the host page's iframe (not just a 200 shell — 0176's trap)
 * P4-S2  right-click a technique: BOTH configured items appear (decision 0014 Option 5)
 * P4-S3  choose "Copy Technique to Scratch": new tab opens (decision 0015), shows the
 *        confirmation, and the object is verifiable in /viz-data/unattached-split
 * P4-S4  the TACTIC item on a technique right-click copies the tactic (decision 0018 Opt 4)
 * P4-S5  with no current incident, the action reports the problem clearly (decision 0017:
 *        409 no_current_incident) — exercised at the route (same path the popup hits),
 *        with context_map.json edited and RESTORED around the check
 *
 *     node e2e/walk-act4-gestures.mjs <outdir>
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0' // Traefik leaf cert (0142)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const CMS = 'https://cms.typerefinery.localhost:8101'
const AUTH = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const HOST_PAGE = '/content/typerefinery-showcase/pages/os-triage/pages/attack-navigator.html'
const SPLIT = 'https://flow.typerefinery.localhost:8101/viz-data/unattached-split'
const ROUTE = 'https://flow.typerefinery.localhost:8101/os-triage/transport/attack'
const MAP = path.join(WORKSPACE, 'typerefinery/services/fastapi/generated/os-triage/context_mem/context_map.json')
const OUT = process.argv[2] || '.'

const results = []
const record = (step, verdict, note) => {
  results.push({ step, verdict, note })
  console.log(`${verdict.padEnd(5)} ${step.padEnd(7)} ${note}`)
}
const step = async (name, fn) => {
  try { await fn() } catch (e) {
    record(name, 'FAIL', 'threw: ' + String(e.message).split('\n')[0].slice(0, 100))
  }
}
const inUnattached = async (id) => {
  const body = JSON.stringify(await (await fetch(SPLIT)).json().catch(() => ({})))
  return body.includes(id)
}

/**
 * Does the copied object OPEN? docs/issues/0049.
 *
 * "It landed in Scratch" and "an analyst can work on it" are different claims, and until 2026-08-16
 * only the first was true: neither type Act 4 copies had a form anywhere, so a copied technique opened
 * a 404. Two forms were authored, and this asserts the whole chain rather than the form's existence —
 * reading the stored wrapper's own `form_path`, which is the value the Composer navigates to.
 *
 * ⚠️ Deliberately NOT "does the form URL 200". docs/issues/0193 is the standing lesson: the API
 * returning three relationship types was true while the modal offered none, also true. A capability is
 * the path, not one endpoint on it.
 *
 * Returns a short phrase for the step's record line, and `ok` for its verdict.
 */
const opensAForm = async (id) => {
  const split = await (await fetch(SPLIT)).json().catch(() => null)
  if (!split) return { ok: false, note: 'unattached-split unreadable' }
  const pool = [...(split.promo?.nodes || []), ...(split.scratch?.nodes || [])]
  const node = pool.find((n) => (n.original?.id || n.id) === id)
  if (!node) return { ok: false, note: 'not found in the pool' }
  const formPath = node.form_path || node.formPath || node.form
  if (!formPath) return { ok: false, note: 'no form_path on the stored wrapper' }
  const url = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/${formPath}-update.html`
  const res = await fetch(url, { headers: { Authorization: AUTH } }).catch(() => null)
  const html = res ? await res.text() : ''
  const inputs = (html.match(/<input/g) || []).length
  // A 200 that renders no inputs is a page, not a form — 0049's original symptom was an empty frame.
  const ok = !!res && res.status === 200 && inputs >= 5
  return { ok, note: `opens ${formPath} → ${res ? res.status : 'ERR'}, ${inputs} input(s)` }
}

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const context = await browser.newContext({
  ignoreHTTPSErrors: true,
  storageState: path.join(__dirname, '.auth', 'cms.json'),
  viewport: { width: 1700, height: 1000 },
})
const page = await context.newPage()

await page.goto(`${CMS}${HOST_PAGE}`, { waitUntil: 'domcontentloaded' })
const nav = page.frameLocator('iframe[src*="attack-navigator"]').first()
await page.waitForTimeout(8_000)

// The Navigator may land on its banner — create an Enterprise layer if no matrix yet.
if (!(await nav.locator('.technique-cell, .technique').count())) {
  const create = nav.locator('text=Create New Layer').first()
  if (await create.count()) {
    await create.click()
    await page.waitForTimeout(1_500)
    const enterprise = nav.locator('text=Enterprise').first()
    if (await enterprise.count()) await enterprise.click()
    await page.waitForTimeout(15_000)
  }
}

// ---------- P4-S1 ----------
const cells = await nav.locator('.technique-cell, .technique').count()
record('P4-S1', cells > 100 ? 'PASS' : 'FAIL', `matrix renders ${cells} technique cells in the HOST page iframe`)
await page.screenshot({ path: path.join(OUT, 'act4-matrix.png') })

// ---------- P4-S2 ----------
let techId = ''
await step('P4-S2', async () => {
  const cell = nav.locator('.technique-cell, .technique').first()
  await cell.click({ button: 'right' })
  await page.waitForTimeout(1_200)
  const techItem = nav.locator('text=Copy Technique to Scratch').first()
  const tacticItem = nav.locator('text=Copy Tactic to Scratch').first()
  const both = (await techItem.count()) > 0 && (await tacticItem.count()) > 0
  await page.screenshot({ path: path.join(OUT, 'act4-contextmenu.png') })
  record('P4-S2', both ? 'PASS' : 'FAIL',
    `context menu: technique item ${await techItem.count() ? '✓' : '✗'}, tactic item ${await tacticItem.count() ? '✓' : '✗'}`)
})

// ---------- P4-S3 ----------
await step('P4-S3', async () => {
  const [popup] = await Promise.all([
    context.waitForEvent('page', { timeout: 15_000 }),
    nav.locator('text=Copy Technique to Scratch').first().click(),
  ])
  await popup.waitForLoadState('domcontentloaded')
  await popup.waitForTimeout(4_000)
  const url = popup.url()
  techId = (url.match(/attack\/([a-z-]+--[0-9a-f-]+)/) || [, ''])[1]
  const body = await popup.content()
  const confirmed = body.includes('Copied to Scratch')
  await popup.screenshot({ path: path.join(OUT, 'act4-confirmation.png') })
  const landed = techId ? await inUnattached(techId) : false
  // docs/issues/0049 — landing is half the capability. The Act's pitch is "copy this technique to
  // Scratch", and the question it invites is "and then what do you do with it?". Until 2026-08-16 the
  // answer was a 404, and nothing in this walk said so.
  const open = techId && landed ? await opensAForm(techId) : { ok: false, note: 'not copied' }
  record('P4-S3', confirmed && landed && open.ok ? 'PASS' : 'FAIL',
    `new tab → ${confirmed ? 'confirmation page' : 'NO confirmation'}; ${techId || '(no id)'} ${landed ? 'IS' : 'NOT'} in unattached-split; ${open.note}`)
  await popup.close()
})

// ---------- P4-S4 ----------
await step('P4-S4', async () => {
  // the P4-S3 popup steals focus — the host page must be foreground for the iframe's
  // contextmenu handler to receive the event
  await page.bringToFront()
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(800)
  // dismiss any overlay left by P4-S3 (the Navigator closes its menu on document click)
  await nav.locator('.tactic.name, th.tactic, .matrix .tactic').first().click({ force: true }).catch(() => {})
  await page.waitForTimeout(800)
  // force: an invisible overlay from the prior interaction fails Playwright's
  // actionability wait (measured: plain right-click timed out twice); the contextmenu
  // event still dispatches at the cell's position, which is what the Navigator handles
  // the FIRST cell is proven visible and menu-capable by P4-S2 — the step needs "a
  // technique", not a different one (nth(3)/nth(10) matched INVISIBLE cells and threw)
  const cell = nav.locator('.technique-cell, .technique').first()
  await cell.scrollIntoViewIfNeeded().catch(() => {})
  await cell.click({ button: 'right', force: true, timeout: 10_000 })
  await page.waitForTimeout(1_500)
  await page.screenshot({ path: path.join(OUT, 'act4-s4-menu-state.png') })
  if (!(await nav.locator('text=Copy Tactic to Scratch').first().isVisible().catch(() => false))) {
    record('P4-S4', 'FAIL', 'context menu did not reopen (see act4-s4-menu-state.png)')
    return
  }
  const [popup] = await Promise.all([
    context.waitForEvent('page', { timeout: 15_000 }),
    nav.locator('text=Copy Tactic to Scratch').first().click(),
  ])
  await popup.waitForLoadState('domcontentloaded')
  await popup.waitForTimeout(4_000)
  const url = popup.url()
  const tacticId = (url.match(/attack\/([a-z0-9-]+--[0-9a-f-]+)/) || [, ''])[1]
  const confirmed = (await popup.content()).includes('Copied to Scratch')
  const isTactic = tacticId.startsWith('x-mitre-tactic--')
  const landed = tacticId ? await inUnattached(tacticId) : false
  // docs/issues/0049, as P4-S3. A tactic resolves into `attack-forms`, a family that was EMPTY until
  // 2026-08-16 — so this half of the assertion is the one that would have caught it.
  const open = tacticId && landed ? await opensAForm(tacticId) : { ok: false, note: 'not copied' }
  record('P4-S4', confirmed && isTactic && landed && open.ok ? 'PASS' : 'FAIL',
    `tactic item → ${tacticId || '(no id)'} (${isTactic ? 'is a tactic' : 'NOT a tactic id'}), ${confirmed ? 'confirmed' : 'no confirmation'}, ${landed ? 'in' : 'NOT in'} unattached; ${open.note}`)
  await popup.close()
})

// ---------- P4-S5 ---------- (route-level: same path the popup hits)
await step('P4-S5', async () => {
  const original = fs.readFileSync(MAP, 'utf8')
  try {
    const map = JSON.parse(original)
    map.current_incident = ''
    fs.writeFileSync(MAP, JSON.stringify(map))
    // JSON/API contract is the STATUS (Total.js replaces custom bodies on non-2xx —
    // measured; decision 0017's reason→status map is what machines read).
    const res = await fetch(`${ROUTE}/attack-pattern--a62a8db3-f23a-4d8f-afd6-9dbc77e7813b?format=json`)
    // Human contract: the HTML page must NAME the problem (it answers 200 by design).
    const htmlRes = await fetch(`${ROUTE}/attack-pattern--a62a8db3-f23a-4d8f-afd6-9dbc77e7813b`)
    const html = await htmlRes.text()
    const ok = res.status === 409 && html.includes('no_current_incident')
    record('P4-S5', ok ? 'PASS' : 'FAIL',
      `no current incident → API HTTP ${res.status} (expect 409); HTML page ${html.includes('no_current_incident') ? 'names the reason' : 'DOES NOT name the reason'}`)
  } finally {
    fs.writeFileSync(MAP, original)
  }
})

console.log(`\n=== ${results.filter((r) => r.verdict === 'PASS').length}/${results.length} Act 4 gestures PASS`)
console.log('⚠️ Copied test objects remain in unattached — run reset-demo-data.mjs --apply after.')
await browser.close()
