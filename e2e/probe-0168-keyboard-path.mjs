/**
 * docs/issues/0168 — can a keyboard-only user create an incident?
 *
 * 0168 was: the `+ Create` dropdown rendered its items as plain `<div>`s — no href, no role, no
 * tabindex — so ArrowDown left focus on the button, the accessibility tree did not list the items at
 * all, and Act 1's primary call to action was unreachable without a mouse.
 *
 * The issue is marked Resolved on the grounds that the dropdown was retired for the docx **New
 * Incident** button, "so the keyboard path exists **by construction**". That phrase is a claim about
 * the product, not a measurement of it — and a real `<button>` can still be unreachable (negative
 * tabindex, aria-hidden, a click-only handler that ignores Enter/Space). So drive it from the
 * keyboard and see.
 *
 * The oracle is the user's outcome: **Tab to the control, press the key, and a Create form must open.**
 * Not "is there a button", which was never the question.
 *
 *     node e2e/probe-0168-keyboard-path.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const PAGE = `${CMS}/content/typerefinery-showcase/pages/os-triage/pages/incidents.html`
const STATE = path.join(__dirname, '.auth', 'cms.json')

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()
await page.goto(PAGE, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(4_000)

const describe = () =>
  page.evaluate(() => {
    const el = document.activeElement
    if (!el) return null
    return {
      tag: el.tagName,
      text: (el.innerText || el.value || '').trim().slice(0, 40),
      type: el.getAttribute('type') || '',
      tabindex: el.getAttribute('tabindex'),
      ariaHidden: el.getAttribute('aria-hidden'),
    }
  })

// Walk the tab order from the top of the document and look for the create control.
await page.evaluate(() => document.body.focus())
const order = []
let target = null
for (let i = 0; i < 40; i++) {
  await page.keyboard.press('Tab')
  const el = await describe()
  if (!el) continue
  order.push(`${el.tag}${el.type ? `[${el.type}]` : ''} ${JSON.stringify(el.text)}`)
  if (/new incident|create/i.test(el.text)) {
    target = { ...el, stop: i + 1 }
    break
  }
}

console.log(`tab stops walked: ${order.length}`)
for (const o of order.slice(0, 12)) console.log(`  ${o}`)
console.log(`\ncreate control reached by keyboard: ${target ? `YES at stop ${target.stop} — ${target.tag} ${JSON.stringify(target.text)}` : 'NO (within 40 stops)'}`)

let opened = null
if (target) {
  const framesBefore = page.frames().length
  await page.keyboard.press('Enter')
  await page.waitForTimeout(4_000)
  opened = await page.evaluate(() => {
    const modal = document.querySelector('.modal.show, .modal[style*="display: block"], dialog[open]')
    const frame = [...document.querySelectorAll('iframe')].map((f) => f.src).find((s) => /create/i.test(s))
    return { modal: !!modal, frame: frame || null }
  })
  console.log(`frames before ${framesBefore} / after ${page.frames().length}`)
}

console.log('\n--- 0168 acceptance: a keyboard-only user can start creating an incident ---')
if (!target) {
  console.log('  ❌ FAIL — the create control is not reachable by Tab at all')
} else if (opened?.frame || opened?.modal) {
  console.log(`  ✅ PASS — Tab reached it and Enter opened the create surface${opened.frame ? ` (${opened.frame.split('/').slice(-1)[0]})` : ' (modal)'}`)
} else {
  console.log('  ❌ FAIL — the control is focusable, but Enter did not open anything: a mouse-only')
  console.log('     handler is exactly 0168\'s defect wearing a different element.')
}

fs.writeFileSync(path.join(__dirname, 'probe-0168-keyboard-path.json'), JSON.stringify({ order, target, opened }, null, 2))
console.log('  written: e2e/probe-0168-keyboard-path.json')
await browser.close()
