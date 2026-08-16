/**
 * docs/issues/0163 — the specced post-deploy verification: do the six cache-first widgets still
 * render a planted sentinel as if it were live data?
 *
 * 0163's fix (`fa3c1a0d`, the authority-inversion pattern proven on 0152) shipped in the 2026-08-16
 * 02:20Z bundle deploy. The issue's status line still reads "NOT YET DEPLOYED … sentinel probes after
 * deploy", so the claim is committed, shipped and **unverified** — which is the state 0152 warns
 * about: a widget that renders its cache unconditionally paints a *fabricated screen* that looks
 * exactly like a working one.
 *
 * Technique is 0152's P0-S9 one, generalised: plant a sentinel payload under each widget's
 * `<prefix>_<32hex>` topic key, reload, and see whether the sentinel reaches the screen.
 *
 *   PASS = the live fetch wins and the sentinel is NOT rendered (cache only on failure, logged).
 *   FAIL = the sentinel is on screen — the widget is still cache-first.
 *
 * ⚠️ This plants data in localStorage for the browsing context it creates, and that context is thrown
 * away at the end. It never writes to the CMS, Flow or the demo dataset.
 *
 *     node e2e/probe-0163-sentinel.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const PAGE = `${CMS}/content/typerefinery-showcase/pages/os-triage/pages/dashboard.html`
const STATE = path.join(__dirname, '.auth', 'cms.json')
const SENTINEL = 'ZZ-STALE-SENTINEL-0163'

const browser = await chromium.launch()
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
})
const page = await ctx.newPage()

const logs = []
page.on('console', (m) => {
  const t = m.text()
  if (/cache|localStorage|stale|fallback|0163|0152|unreadable/i.test(t)) logs.push(`[${m.type()}] ${t.slice(0, 200)}`)
})

// ---- pass 1: load clean, learn which topic keys the widgets write -------------------------------
console.log('--- pass 1: clean load, inventory the cache keys ---')
await page.goto(PAGE, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(6_000)

const keys = await page.evaluate(() => Object.keys(localStorage))
console.log(`  localStorage keys after a clean load: ${keys.length}`)
for (const k of keys.slice(0, 20)) console.log(`    ${k}`)
const topicKeys = keys.filter((k) => /_[0-9a-f]{32}$/i.test(k))
console.log(`  topic-shaped keys (<prefix>_<32hex>): ${topicKeys.length}`)

if (!topicKeys.length) {
  console.log('\n⚠️ no topic-shaped keys — either the widgets are not caching here, or the dashboard')
  console.log('   does not host them. Cannot plant a sentinel; verification INCONCLUSIVE.')
  await browser.close()
  process.exit(2)
}

// ---- pass 2: plant a sentinel in every topic key, reload ----------------------------------------
console.log('\n--- pass 2: plant the sentinel and reload ---')
const planted = await page.evaluate(
  ({ topicKeys, SENTINEL }) => {
    const out = []
    for (const k of topicKeys) {
      let original
      try {
        original = JSON.parse(localStorage.getItem(k))
      } catch {
        original = null
      }
      // Keep the payload's shape, poison every string leaf — a widget that renders its cache will
      // paint the sentinel somewhere regardless of which field it reads.
      const poison = (v) => {
        if (typeof v === 'string') return SENTINEL
        if (Array.isArray(v)) return v.map(poison)
        if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([kk, vv]) => [kk, poison(vv)]))
        return v
      }
      const next = original === null ? { data: [{ name: SENTINEL }] } : poison(original)
      localStorage.setItem(k, JSON.stringify(next))
      out.push(k)
    }
    return out
  },
  { topicKeys, SENTINEL },
)
console.log(`  planted into ${planted.length} key(s)`)

logs.length = 0
await page.goto(PAGE, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(8_000)

const body = await page.evaluate(() => document.body.innerText)
const svg = await page.evaluate(() => [...document.querySelectorAll('svg')].map((s) => s.textContent || '').join(' '))
const onScreen = body.includes(SENTINEL) || svg.includes(SENTINEL)

console.log(`\n  sentinel visible on screen: ${onScreen ? 'YES' : 'no'}`)
console.log(`  widget log lines mentioning cache/fallback: ${logs.length}`)
for (const l of logs.slice(0, 12)) console.log(`    ${l}`)

console.log('\n--- verdict ---')
if (onScreen) {
  console.log('  ❌ FAIL — a planted cache payload reached the screen. At least one reader is still')
  console.log('     cache-first: this is 0152/0163\'s fabricated-screen mechanism, live.')
} else {
  console.log('  ✅ PASS — the live fetch won; the planted cache never reached the screen.')
  console.log('     0163\'s authority inversion is confirmed on the deployed build.')
}

fs.writeFileSync(
  path.join(__dirname, 'probe-0163-sentinel.json'),
  JSON.stringify({ keys, topicKeys, planted, onScreen, logs }, null, 2),
)
console.log('  written: e2e/probe-0163-sentinel.json')
await browser.close()
process.exit(onScreen ? 1 : 0)
