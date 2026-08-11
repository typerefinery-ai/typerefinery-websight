/**
 * docs/issues/0104 — the open question: "is the notification block wired to anything?"
 *
 * Static reading says the surface is complete but never invoked:
 *   - widget-graph-viz-composer/src/js/#notifications.js  — full Toastify API
 *     (showSuccess/showError/showWarning/showInfo/showLoading, queue, injected CSS)
 *   - panel._utils.js `ns.showNotification(type, message)` — wrapper honouring
 *     `ns.options.notifications.enabled` and `show<Type>Messages`
 *   - webpack.common.js copies toastify.js + toastify.css into the bundle
 *   - the #82 options carry notifications.enabled=true, showSuccessMessages=true
 *   ...and the ONLY callers of the wrapper are 4x `dismissAllNotifications`. Nothing shows one.
 *
 * "Never called" and "called but broken" need completely different fixes, so prove which by
 * calling it in a live widget rather than reasoning about it.
 *
 *     node e2e/probe-0104-notification-surface.mjs
 */
import { chromium } from '@playwright/test'

const WIDGET = process.env.WIDGET_URL || 'http://localhost:4005/'

const browser = await chromium.launch()
const page = await browser.newPage()
const consoleLines = []
page.on('console', (m) => consoleLines.push(`${m.type()}: ${m.text()}`))

console.log(`opening ${WIDGET}`)
await page.goto(WIDGET, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)

const state = await page.evaluate(() => {
  const W = window.Widgets || {}
  const utils = W.PanelUtils || W.Panel_Utils || W.panelUtils
  // The namespace is assembled by concatenation; find it by shape rather than guessing the key.
  const utilsKey = Object.keys(W).find((k) => W[k] && typeof W[k].showNotification === 'function')
  const notifKey = Object.keys(W).find((k) => W[k] && typeof W[k].showSuccess === 'function')
  return {
    widgetsKeys: Object.keys(W),
    toastifyPresent: typeof window.Toastify === 'function',
    utilsKey: utilsKey || null,
    notifKey: notifKey || null,
    notificationsConfig: utilsKey ? (W[utilsKey].options || {}).notifications || null : null,
    toastNodesBefore: document.querySelectorAll('.toastify').length,
  }
})

console.log('\n--- surface ---')
console.log('window.Toastify loaded          :', state.toastifyPresent)
console.log('wrapper namespace (showNotification):', state.utilsKey)
console.log('notification namespace (showSuccess):', state.notifKey)
console.log('notifications config            :', JSON.stringify(state.notificationsConfig))
console.log('.toastify nodes before          :', state.toastNodesBefore)

if (!state.utilsKey || !state.notifKey) {
  console.log('\nwindow.Widgets keys:', state.widgetsKeys.join(', '))
  console.error('\nFAIL — could not locate the namespaces; aborting before drawing a conclusion.')
  await browser.close()
  process.exit(1)
}

// Fire one of each through the WRAPPER (the path product code would use), not the raw module.
const fired = await page.evaluate(({ utilsKey }) => {
  const W = window.Widgets
  const u = W[utilsKey]
  // The wrapper reads ns.options.notifications; make sure it exists so a missing config cannot be
  // mistaken for a dead surface.
  u.options = u.options || {}
  u.options.notifications = u.options.notifications || {
    enabled: true,
    showSuccessMessages: true,
    showErrorMessages: true,
    duration: 5000,
    gravity: 'top',
    position: 'right',
  }
  u.showNotification('success', 'probe 0104 — success path')
  u.showNotification('error', 'probe 0104 — error path')
  return { config: u.options.notifications }
}, { utilsKey: state.utilsKey })

await page.waitForTimeout(2500)

const after = await page.evaluate(() => {
  const nodes = [...document.querySelectorAll('.toastify')]
  return {
    count: nodes.length,
    texts: nodes.map((n) => n.innerText.trim()),
    visible: nodes.map((n) => {
      const r = n.getBoundingClientRect()
      return r.width > 0 && r.height > 0
    }),
  }
})

console.log('\n--- after calling the wrapper ---')
console.log('config used   :', JSON.stringify(fired.config))
console.log('.toastify nodes:', after.count)
console.log('texts          :', JSON.stringify(after.texts))
console.log('visible        :', JSON.stringify(after.visible))

const relevant = consoleLines.filter((l) => /notification|toastify/i.test(l))
if (relevant.length) {
  console.log('\n--- widget console (notification-related) ---')
  relevant.forEach((l) => console.log('  ' + l))
}

console.log('\n=== VERDICT ===')
if (after.count > 0 && after.visible.some(Boolean)) {
  console.log('The notification surface RENDERS when called.')
  console.log('=> 0104 is "never invoked", not "broken". The fix is call sites, not plumbing.')
} else {
  console.log('The surface did NOT render even when called directly.')
  console.log('=> the plumbing itself is broken; fixing call sites alone would not help.')
}

await browser.close()
