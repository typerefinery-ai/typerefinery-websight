/**
 * docs/issues/0127 — the last likeness item: image3 draws each field group inside a labelled BOX.
 * The captions have existed since 0113; the borders do not. Is a box authorable (a `classes` property
 * on the group's container, the same lever that landed the system-field fill), or does it need CSS in
 * a clientlib — i.e. a bundle deploy?
 *
 * Answering that needs the rendered DOM: find the caption elements, then walk up to the element that
 * actually contains the group's fields, and report what it is and what classes it carries.
 *
 *     node e2e/probe-0127-group-boxes.mjs
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
await page.waitForTimeout(5_000)

const found = await page.evaluate(() => {
  const CAPTIONS = ['base required', 'optional', 'object', 'extensions']
  const out = []
  for (const el of document.querySelectorAll('*')) {
    if (el.children.length) continue // innermost element holding the caption text
    const t = (el.textContent || '').trim().toLowerCase()
    if (!CAPTIONS.includes(t)) continue
    // Walk up to the first ancestor that also contains form controls — that is the "group".
    let group = el.parentElement
    let hops = 0
    while (group && hops < 6 && group.querySelectorAll('input, select, textarea').length === 0) {
      group = group.parentElement
      hops++
    }
    const box = group ? group.getBoundingClientRect() : null
    out.push({
      caption: t,
      captionTag: el.tagName,
      captionClass: el.className || '',
      groupTag: group ? group.tagName : null,
      groupClass: group ? group.className || '' : null,
      groupId: group ? group.id || '' : null,
      fields: group ? group.querySelectorAll('input, select, textarea').length : 0,
      size: box ? `${Math.round(box.width)}×${Math.round(box.height)}` : null,
      border: group ? getComputedStyle(group).borderTopWidth + ' ' + getComputedStyle(group).borderTopStyle : null,
    })
  }
  return out
})

console.log(`caption elements found: ${found.length}\n`)
for (const f of found) {
  console.log(`  "${f.caption}"  <${f.captionTag} class="${f.captionClass}">`)
  console.log(`     group: <${f.groupTag} id="${f.groupId}" class="${String(f.groupClass).slice(0, 70)}">`)
  console.log(`     fields inside: ${f.fields} · size ${f.size} · border: ${f.border}`)
}

const boxed = found.filter((f) => f.border && !/0px/.test(f.border))
console.log(`\ngroups already drawing a border: ${boxed.length}/${found.length}`)
console.log(
  found.length
    ? '\nIf each caption has a distinct ancestor that holds exactly that group\'s fields, a border is\n' +
        'authorable on that ancestor (Bootstrap `border rounded p-2`) — no deploy. If the groups share\n' +
        'one ancestor, or the caption sits outside it, the box needs CSS in a clientlib instead.'
    : '\nNo caption elements matched — the captions may render as attributes or pseudo-content.',
)

fs.writeFileSync(path.join(__dirname, 'probe-0127-group-boxes.json'), JSON.stringify(found, null, 2))
console.log('written: e2e/probe-0127-group-boxes.json')
await browser.close()
