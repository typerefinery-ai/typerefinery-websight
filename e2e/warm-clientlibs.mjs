/**
 * docs/issues/0066 — warm the CMS clientlibs before a run or a demo.
 *
 * On a **cold stack** the first browser load of a demo page returns `504` for most of its
 * `…/etc.clientlibs/**\/clientlibs.js` files while every `clientlibs.css` returns `200`
 * (measured 2026-08-10: js 6×200 / 28×504, css 34×200). The page then paints its chrome with no
 * JavaScript — no table, no widgets — and `page.goto` never sees `load`. A second visit is fine,
 * and the same URLs answer in ~0.1 s once served.
 *
 * ⚠️ This is **mitigation, not a fix**, and it is deliberately a script an operator runs rather
 * than something the Playwright fixtures do silently — a warm-up hidden in the harness would mask
 * 0066 from every future run. Runsheet §0 / P0-S1 tells you to run it.
 *
 * ⚠️ Warming the page **HTML alone is not sufficient** — preflight's `curl` of the page returned
 * 200 while the very next browser load still 504'd. Each clientlib has to be fetched.
 *
 *     node e2e/warm-clientlibs.mjs            # warm the demo pages
 *     node e2e/warm-clientlibs.mjs --verbose  # list every asset and its status
 *
 * Exits non-zero if anything is still failing after its retries, so it can gate a run.
 */
import https from 'https'

const CMS_BASE = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const SHOWCASE = '/content/typerefinery-showcase/pages/os-triage'
const USER = process.env.CMS_USER || 'wsadmin'
const PASS = process.env.CMS_PASSWORD || 'wsadmin'

/**
 * The pages a run or a demo opens, in the order the runsheet opens them.
 *
 * ⚠️ **Act 4's host page was missing from this list until 2026-08-16**, and it is the page with the
 * worst cold cost in the whole demo: the vendored Navigator takes **15–25 s to first-parse** the
 * ATT&CK bundle (recorded on 0181 / the runsheet's Act 4 header). So the one Act a presenter most
 * needs warmed was the one Act this script skipped — the list was written while Act 4 was still
 * considered unrunnable, and it never caught up when the Act landed. Same staleness class as 0190.
 *
 * Act 5's form page is here for the same reason: 0170 measures the first form open at **4.6–5.1 s**,
 * against ~0.1 s warm.
 */
const PAGES = [
  `${SHOWCASE}/pages/incidents.html`,
  `${SHOWCASE}/forms/overview-local.html`,
  `${SHOWCASE}/forms/composer-local.html`,
  `${SHOWCASE}/pages/attack-navigator.html`,
  `${SHOWCASE}/forms/stixorm-forms/stix-forms/sdo-forms/identity-forms/identity-create.html`,
]

const VERBOSE = process.argv.includes('--verbose')
const RETRIES = 3

/**
 * Per-request timeout, sized from the measurement in docs/issues/0066 — **not** guessed.
 *
 * The cold-start trace shows what actually happens: the 28 clientlib JS files that 504'd all did so
 * at **100.11 s** (100108–100114 ms, every one stamped the same second), while the 6 that succeeded
 * took **210.4–211.0 s** to first byte. So the resources are not broken — the CMS really does need
 * ~210 s to compile a clientlib JS cold, and the gateway abandons the request at 100 s.
 *
 * ⚠️ This constant was **120 s in the first version of this script**, which is *below* the observed
 * cold compile time — the warm-up would have timed out on exactly the requests it exists to make.
 * 300 s leaves headroom over the 211 s measured worst case.
 */
const TIMEOUT_MS = 300_000

const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true })
const auth = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64')

function get(url) {
  return new Promise((resolve) => {
    const started = Date.now()
    const req = https.get(url, { agent, headers: { Authorization: auth } }, (res) => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (c) => (body += c))
      res.on('end', () => resolve({ status: res.statusCode, body, ms: Date.now() - started }))
    })
    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy()
      resolve({ status: 0, body: '', ms: Date.now() - started })
    })
    req.on('error', (e) => resolve({ status: 0, body: '', ms: Date.now() - started, error: e.message }))
  })
}

/**
 * Every clientlib the page references, in document order, deduplicated.
 *
 * **CMS-hosted assets only.** The pages also pull a few third-party scripts (e.g.
 * `https://unpkg.com/monaco-editor@latest/...`, which answers 302) — those are not what 0066 is
 * about and warming them proves nothing about the CMS.
 */
function clientlibsIn(html) {
  const found = []
  const push = (u) => {
    if (!u) return
    const abs = u.startsWith('http') ? u : CMS_BASE + (u.startsWith('/') ? u : '/' + u)
    if (!abs.startsWith(CMS_BASE)) return
    if (!found.includes(abs)) found.push(abs)
  }
  for (const m of html.matchAll(/<script[^>]+src=["']([^"']+\.js)["']/gi)) push(m[1])
  for (const m of html.matchAll(/<link[^>]+href=["']([^"']+\.css)["']/gi)) push(m[1])
  return found
}

const tally = { ok: 0, failed: 0, retried: 0 }
const stillFailing = []

/** Fetch serially — the whole point is *not* to ask for 34 of them at once, as a browser does. */
async function warm(url) {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    const res = await get(url)
    if (res.status === 200) {
      if (attempt > 1) tally.retried++
      tally.ok++
      if (VERBOSE) console.log(`    200 ${String(res.ms).padStart(6)}ms  ${url.replace(CMS_BASE, '')}`)
      return true
    }
    console.log(
      `    ${res.status || 'ERR'} ${String(res.ms).padStart(6)}ms  ${url.replace(CMS_BASE, '')}` +
        `  (attempt ${attempt}/${RETRIES}${res.error ? ' — ' + res.error : ''})`,
    )
  }
  tally.failed++
  stillFailing.push(url)
  return false
}

console.log(`warm-clientlibs: ${CMS_BASE} as ${USER} — serial, ${RETRIES} attempts each\n`)

for (const page of PAGES) {
  const url = CMS_BASE + page
  const res = await warm(url) ? await get(url) : null
  if (!res || res.status !== 200) {
    console.log(`  ${page} — page itself did not warm; skipping its clientlibs\n`)
    continue
  }
  const libs = clientlibsIn(res.body)
  console.log(`  ${page} — ${libs.length} clientlib(s)`)
  for (const lib of libs) await warm(lib)
  console.log('')
}

console.log(
  `warm-clientlibs: ${tally.ok} ok · ${tally.retried} needed a retry · ${tally.failed} still failing`,
)
if (stillFailing.length) {
  console.log('\nStill failing after retries (docs/issues/0066):')
  for (const u of stillFailing) console.log(`  ${u}`)
  process.exit(1)
}
