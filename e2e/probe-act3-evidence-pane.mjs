/**
 * Where does Act 3's "Evidence List" pane live, and why is it empty?
 *
 * image5's LEFT pane is a populated "EVIDENCE:" tree — a hierarchy of object icons with +/-
 * expanders. The build renders that region as a heading and a single icon, with nothing under it.
 *
 * Two very different explanations, and they must not be confused:
 *   (a) a widget defect — the tree never renders its items, or
 *   (b) a DATA consequence — decision 0036 notes the image5 incident has NO attached objects, and
 *       an evidence tree of attached objects would then be correctly empty.
 *
 * This walks every frame, finds whatever region carries the word "Evidence", and reports what is
 * inside it, so (a) and (b) can be told apart before anything is raised.
 *
 *     node e2e/probe-act3-evidence-pane.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = 'https://cms.typerefinery.localhost:8101'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html'
const MAP = path.join(
  __dirname, '..', '..', 'typerefinery', 'services', 'fastapi', 'generated', 'os-triage',
  'context_mem', 'context_map.json',
)

console.log(`current_incident: ${JSON.parse(fs.readFileSync(MAP, 'utf8')).current_incident}`)

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

await page.goto(`${CMS}${PAGE}`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(26_000)

for (const f of page.frames()) {
  const url = f.url()
  const found = await f
    .evaluate(() => {
      const out = []
      const walk = document.querySelectorAll('*')
      for (const el of walk) {
        const own = [...el.childNodes]
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent.trim())
          .join(' ')
        if (/evidence/i.test(own)) {
          // Climb to a container worth describing.
          const box = el.closest('div, section, aside') || el
          out.push({
            tag: el.tagName,
            cls: String(el.className || '').slice(0, 50),
            text: own.slice(0, 50),
            containerCls: String(box.className || '').slice(0, 50),
            childCount: box.querySelectorAll('*').length,
            icons: box.querySelectorAll('img, image, svg').length,
            listItems: box.querySelectorAll('li, tr, .node, [class*="item"], [class*="tree"]').length,
            inner: box.innerText.replace(/\s+/g, ' ').trim().slice(0, 150),
          })
        }
      }
      return out
    })
    .catch(() => [])
  if (found.length) {
    console.log(`\n=== frame ${url.split('/').slice(-1)[0] || url}`)
    found.slice(0, 4).forEach((h) => {
      console.log(`  <${h.tag}> class="${h.cls}"  text="${h.text}"`)
      console.log(`     container class="${h.containerCls}" descendants=${h.childCount} icons=${h.icons} list-ish=${h.listItems}`)
      console.log(`     inner: "${h.inner}"`)
    })
  }
}

await browser.close()
