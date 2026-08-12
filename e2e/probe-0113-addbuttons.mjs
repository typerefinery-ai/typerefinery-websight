/**
 * docs/issues/0113 (second half) — the optional/extension add-buttons are unlabelled icons.
 * Measure them in the LIVE DOM (not server HTML - that mistake inflated the composite count 3x).
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const B = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms`
const STATE = '.auth/cms.json'
const browser = await chromium.launch()
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, ...(fs.existsSync(STATE) ? { storageState: STATE } : {}) })
const page = await ctx.newPage()
for (const u of [`${B}/sdo-forms/identity-forms/identity-create.html`, `${B}/sco-forms/url-forms/url-update.html`]) {
  await page.goto(u, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(5000)
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll('button')].map((b) => ({
      title: b.getAttribute('title') || '',
      text: (b.textContent || '').trim(),
      cls: (b.className || '').toString().slice(0, 44),
      hasIcon: !!b.querySelector('svg,i,img'),
    })).filter((b) => b.title || !b.text))
  console.log(`\n${u.split('/').slice(-1)[0]}  — ${rows.length} button(s) with a title or no text`)
  rows.forEach((r) => console.log(`   title=${JSON.stringify(r.title).padEnd(34)} text=${JSON.stringify(r.text).padEnd(10)} icon=${r.hasIcon} cls=${r.cls}`))
}
await browser.close()
