/**
 * docs/issues/0104 — do PRODUCT calls actually raise toasts, or only my direct calls?
 *
 * probe-0104-embedded-toast.mjs established that on the embedded composer the surface works: calling
 * the wrapper creates a visible, on-screen toast (page-abs 681,15, z-index max). So H1/H2/H3 from the
 * issue (silent early-return, off-screen placement, clipping) do NOT reproduce.
 *
 * That leaves a measurement problem rather than a rendering one. `notifications.duration` is
 * **5000 ms**, and the surface is inside an iframe. Sampling the DOM after an action - which is what
 * the manual run and every check so far has done - cannot see a toast that has already dismissed.
 * (Same class of error as docs/issues/0084's sampling probe and 0139's presence assertion.)
 *
 * So: install a MutationObserver INSIDE the widget iframe, then drive a REAL product path that is
 * read-only (`refreshTreeAfterMenuAction`, which calls showNotification('loading'…) and on success
 * showNotification('success'…) - panel.tree.js:562,671), and record every .toastify node with a
 * timestamp and lifetime.
 *
 *     node e2e/probe-0104-toast-timeline.mjs
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const URL = `${CMS}/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html`

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1500, height: 950 },
  ignoreHTTPSErrors: true,
  storageState: path.join(__dirname, '.auth', 'cms.json'),
})
const page = await context.newPage()
await page.goto(URL, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(30000)

const handle = await page.locator('iframe[src*="widgetdevcomposer"]').elementHandle()
const frame = handle ? await handle.contentFrame() : null
if (!frame) {
  console.error('FAIL - could not reach the composer widget iframe.')
  await browser.close()
  process.exit(1)
}

// Record every toast add/remove from now on, with timestamps.
await frame.evaluate(() => {
  window.__toastLog = []
  const t0 = Date.now()
  const seen = new WeakMap()
  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType === 1 && n.classList && n.classList.contains('toastify')) {
          seen.set(n, Date.now())
          window.__toastLog.push({ at: Date.now() - t0, event: 'added', text: (n.innerText || '').trim().slice(0, 60) })
        }
      }
      for (const n of m.removedNodes) {
        if (n.nodeType === 1 && n.classList && n.classList.contains('toastify')) {
          const born = seen.get(n)
          window.__toastLog.push({
            at: Date.now() - t0,
            event: 'removed',
            lifetimeMs: born ? Date.now() - born : null,
            text: (n.innerText || '').trim().slice(0, 60),
          })
        }
      }
    }
  })
  obs.observe(document.body, { childList: true, subtree: true })
})
console.log('observer installed; driving a real product path (refreshTreeAfterMenuAction)…')

const drove = await frame.evaluate(() => {
  const tree = window.Widgets?.Panel?.Tree
  if (!tree || typeof tree.refreshTreeAfterMenuAction !== 'function') {
    return { ok: false, why: `Panel.Tree.refreshTreeAfterMenuAction missing (Panel keys: ${Object.keys(window.Widgets?.Panel || {}).join(',')})` }
  }
  tree.refreshTreeAfterMenuAction('sighting')
  return { ok: true }
})
if (!drove.ok) console.log(`  ! ${drove.why}`)

await page.waitForTimeout(12000)

const log = await frame.evaluate(() => window.__toastLog || [])
console.log(`\n--- toast timeline (${log.length} events over ~12s after the product call) ---`)
if (log.length === 0) console.log('  (nothing)')
for (const e of log) {
  console.log(`  +${String(e.at).padStart(6)}ms  ${e.event.padEnd(7)} ${e.lifetimeMs != null ? `lifetime=${e.lifetimeMs}ms ` : ''}"${e.text}"`)
}

const added = log.filter((e) => e.event === 'added')
console.log('\n=== VERDICT ===')
console.log(`toasts raised by the product path: ${added.length}`)
if (added.length > 0) {
  console.log('=> Product code DOES raise notifications. They are real and transient.')
  console.log('   The issue is observability/duration, not wiring - re-frame 0104 accordingly.')
} else {
  console.log('=> The product path raised NO notification, though a direct wrapper call does.')
  console.log('   => the calls are not reached at runtime; investigate the call sites, not the surface.')
}

await browser.close()
