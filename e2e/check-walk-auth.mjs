/**
 * Is the stored walk auth state actually usable right now?
 *
 * 🔑 **Why this exists.** Expired auth has produced a confusing gate failure **twice**. The walks
 * time out on their *first* selector — `waiting for locator('tbody tr')`, 40 s — which reads as
 * "Act 1 is broken" and was investigated from scratch the first time. The current assessment turned
 * that into a rule:
 *
 *     walk fails at first selector + curl passes  =>  refresh auth first
 *
 * Measured 2026-08-16: `e2e/.auth/cms.json` was **2 h 17 m old**, `curl` of the incidents page with
 * credentials returned **200**, and the incidents API returned **3 rows** — page and data both fine,
 * only the stored browser session dead. Refreshing took 5.4 s and the walk then passed 11/11.
 *
 * A rule that turns 40 minutes into two commands is good; not failing at all is better. Run this
 * **before** the walks.
 *
 * ⚠️ It checks the state by USING it — loading the page in a browser with that storageState and
 * looking for a real row — not by reading the file's age. Age is a proxy; a session can die early or
 * outlive its usual span, and "the file is recent" is exactly the kind of presence-check this project
 * keeps getting caught by.
 *
 *     node e2e/check-walk-auth.mjs            # report only; exit 1 if the state is dead
 *     node e2e/check-walk-auth.mjs --refresh  # refresh it (types the credentials) if it is dead
 */
import { chromium } from '@playwright/test'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const CMS = 'https://cms.typerefinery.localhost:8101'
const PAGE = '/content/typerefinery-showcase/pages/os-triage/pages/incidents.html'
const STATE = path.join(__dirname, '.auth', 'cms.json')
const REFRESH = process.argv.includes('--refresh')

if (!fs.existsSync(STATE)) {
  console.log('⚠️ no stored auth state at e2e/.auth/cms.json')
  if (!REFRESH) process.exit(1)
} else {
  const ageMin = Math.round((Date.now() - fs.statSync(STATE).mtimeMs) / 60000)
  console.log(`stored auth state: ${ageMin} min old  (it has been dying at roughly 2 h)`)
}

const probe = async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    ignoreHTTPSErrors: true,
    ...(fs.existsSync(STATE) ? { storageState: STATE } : {}),
  })
  const page = await ctx.newPage()
  await page.goto(CMS + PAGE, { waitUntil: 'domcontentloaded' })
  /** 12 s, not the walks' 40 s: this is a liveness check, not a wait for a slow render. */
  const ok = await page
    .waitForSelector('tbody tr', { timeout: 12_000, state: 'visible' })
    .then(() => true)
    .catch(() => false)
  const url = page.url()
  await browser.close()
  return { ok, url }
}

let { ok, url } = await probe()
console.log(`walk auth usable: ${ok ? 'YES — a table row rendered' : 'NO — no row within 12 s'}`)
if (!ok) console.log(`  landed on: ${url.slice(0, 90)}`)

if (ok) process.exit(0)

/**
 * ⚠️ Confirm the SITE is fine before blaming auth — the rule has two halves, and skipping the
 * second one would turn this into a tool that always says "refresh auth" whenever anything breaks.
 */
/**
 * ⚠️ **`fetch`, not a shelled-out `curl`.** The first version ran
 * `curl -sk -o /dev/null … -w "%{http_code}"` through `execSync`, which on Windows goes via
 * **cmd.exe**, where `/dev/null` does not exist — curl exited non-zero and `execSync` threw, so the
 * branch crashed instead of reporting. It never showed up on the healthy path because that path
 * returns before reaching this line; the negative control found it on its first run.
 */
const code = await fetch(`${CMS}${PAGE}`, {
  headers: { Authorization: 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64') },
})
  .then((r) => String(r.status))
  .catch((e) => 'ERR ' + String(e.message).slice(0, 40))
console.log(`same page fetched WITH credentials: ${code}`)
if (code !== '200') {
  console.log('🔴 the page itself is not serving — this is NOT an auth-state problem. Do not refresh; investigate.')
  process.exit(2)
}
console.log('→ page serves but the stored session does not: the documented signature.')

if (!REFRESH) {
  console.log('\nfix: node e2e/check-walk-auth.mjs --refresh   (or: playwright test --project=setup)')
  process.exit(1)
}

console.log('\nrefreshing (P0-S5 types the credentials — never sets input.value)…')
execSync('./node_modules/.bin/playwright test --project=setup --reporter=line', {
  cwd: __dirname,
  stdio: 'inherit',
})
;({ ok } = await probe())
console.log(`\nwalk auth usable after refresh: ${ok ? 'YES' : 'NO'}`)
process.exit(ok ? 0 : 1)
