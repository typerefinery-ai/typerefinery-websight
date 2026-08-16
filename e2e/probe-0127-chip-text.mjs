/**
 * docs/issues/0127 / decision 0035 — what text do the option chips actually SHOW?
 *
 * The chips are authored with `label` = the docx's two-letter code (RV, LB, CN, LN, ER, OM, GR) and
 * `title` = the full name ("Revoked", "External References"). 0127 records the opposite of what the
 * authored nodes suggest — "all chips carry their full names on screen" — and decision 0035's
 * departure from the mockup hangs on which is true.
 *
 * String-matching the served HTML cannot answer it: `Revoked` appears inside `title="…"` and inside
 * each chip's `data-model` JSON whether or not it is ever painted. So read the rendered DOM.
 *
 *     node e2e/probe-0127-chip-text.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const FORM = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms/identity-forms/identity-update.html`
const STATE = path.join(__dirname, '.auth', 'cms.json')

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()
await page.goto(FORM, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(3_000)

const chips = await page.evaluate(() => {
  const out = []
  for (const el of document.querySelectorAll('[component="button"], button, .btn')) {
    const text = (el.innerText || el.textContent || '').trim()
    const title = el.getAttribute('title') || el.closest('[title]')?.getAttribute('title') || ''
    const box = el.getBoundingClientRect()
    if (!box.width && !box.height) continue // not painted
    out.push({ text: text.slice(0, 40), title: title.slice(0, 40), w: Math.round(box.width), h: Math.round(box.height) })
  }
  return out
})

console.log(`painted button-ish elements: ${chips.length}\n`)
for (const c of chips) console.log(`  ${JSON.stringify(c.text).padEnd(28)} title=${JSON.stringify(c.title).padEnd(24)} ${c.w}×${c.h}`)

const codes = chips.filter((c) => /^[A-Z]{2}$/.test(c.text))
const names = chips.filter((c) => /^(Revoked|Labels|Confidence|Language|External References|Object Marking|Granular Markings)$/.test(c.text))
console.log(`\ntwo-letter codes painted : ${codes.length}  ${codes.map((c) => c.text).join(' ')}`)
console.log(`full names painted       : ${names.length}  ${names.map((c) => c.text).join(' · ')}`)
console.log(
  `\nverdict: the chips show ${codes.length > names.length ? 'the docx TWO-LETTER CODES' : names.length ? 'FULL NAMES (decision 0035 departure)' : 'neither — check the selector'}`,
)

const h5 = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].slice(0, 6).map((h) => ({
  tag: h.tagName,
  text: (h.textContent || '').trim().slice(0, 40),
  px: Math.round(parseFloat(getComputedStyle(h).fontSize)),
})))
console.log('\npanel headings (0127 row 1 — "modestly sized"):')
for (const h of h5) console.log(`  <${h.tag}> ${JSON.stringify(h.text).padEnd(24)} ${h.px}px`)

await browser.close()
