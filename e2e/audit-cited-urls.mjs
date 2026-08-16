/**
 * Do the URLs that OPEN issues cite still behave the way those issues say?
 *
 * 🔑 **Why this exists.** In two days, five sites were found asserting a blocker that had already
 * been cleared — 0190 (the goal file, the runsheet, CLAUDE.md/AGENTS.md), 0049, and 0084, which
 * carried **High** severity and an *"M — real authoring, ~44 fields each"* estimate for two forms
 * that already existed at 278 KB and 230 KB. In this project the record lags the build often enough
 * that *"is this still true?"* is the highest-yield first question, and asking it by hand does not
 * scale past one issue a tick.
 *
 * **Deterministic, and with no opinion** — the two properties that made `audit-steering-todos.mjs`
 * keepable and killed `audit-stale-blockers.mjs`:
 *
 *   - it extracts **URLs**, which are unambiguous, rather than reading prose for claims;
 *   - it **reports status codes** and does not decide whether any of them contradicts its issue.
 *
 * A 200 beside an issue about a 404 is obvious to a reader in a second and impossible for a regex to
 * judge reliably, so the judging is left where it belongs.
 *
 *     node e2e/audit-cited-urls.mjs              # open issues only
 *     node e2e/audit-cited-urls.mjs --all        # every issue
 *     node e2e/audit-cited-urls.mjs --expect-404 # only URLs whose issue text mentions 404 near them
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ISSUES = path.resolve(__dirname, '../../docs/issues')
const ALL = process.argv.includes('--all')
const ONLY_404 = process.argv.includes('--expect-404')
const AUTH = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')

/** Only hosts this workspace serves — never fetch the open internet from an audit. */
const FETCHABLE = /^https:\/\/(cms|flow)\.typerefinery\.localhost:8101\//

const isOpen = (status) => {
  const lead = String(status || '').toLowerCase().split(/[—\-–(]/)[0].replace(/[*`]/g, '').trim()
  if (/reopen/.test(lead)) return true
  return /^(open|in progress|partly|partial)/.test(lead)
}

const cited = new Map() // url -> Set(issue ids)
let scanned = 0

for (const name of fs.readdirSync(ISSUES).filter((n) => /^\d{4}-.*\.md$/.test(n))) {
  const text = fs.readFileSync(path.join(ISSUES, name), 'utf8')
  const status = /^status:\s*(.+)$/m.exec(text.slice(0, 2000))?.[1] ?? ''
  if (!ALL && !isOpen(status)) continue
  scanned++
  const id = name.slice(0, 4)
  /**
   * ⚠️ **Match PATHS as well as full URLs, or this finds almost nothing.** First cut took only
   * `https://…` and turned up **2 URLs across 49 open issues** — because issues cite form paths the
   * way the code does: `incident-forms/incident-update.html`. That is exactly how 0084 wrote the two
   * forms this audit exists to have caught, so the strict version would have missed its own
   * motivating case.
   *
   * A `{family}/{group}/{type}-forms/{type}-update.html` fragment is unambiguous under the content
   * root — it either resolves or it does not — so resolving it is still an exact question, not a
   * guess about prose.
   */
  const ROOT = 'https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/'
  const found = [
    ...[...text.matchAll(/https:\/\/[a-z0-9.:-]+\/[^\s)`'"<>]+\.html/gi)].map((m) => m[0]),
    ...[...text.matchAll(/\b((?:stix|os-threat|attack|oca)-forms\/[a-z0-9-]+\/[a-z0-9-]+-forms\/[a-z0-9-]+-(?:update|create)\.html)/gi)].map((m) => ROOT + m[1]),
  ]
  /**
   * ⚠️ **A third pattern was written and REMOVED before shipping.** It matched a bare
   * `X-forms/Y-update.html` and assumed the family/group `stix-forms/sdo-forms/`. That **fabricates
   * paths**: `relationship-update.html` lives under `sro-forms`, `sequence-update.html` under
   * `stix-forms/sdo-forms` but cited by 0049 as the os-threat path, and the ATT&CK forms under
   * `attack-forms`. It duly reported its own inventions as 404s — five of ten rows — which is
   * precisely the false "this issue is stale" alarm this audit exists to prevent.
   *
   * 🔑 An audit that constructs the thing it then measures is measuring itself. Only citations that
   * name their family and group are resolvable without guessing, so only those are followed.
   */
  for (const raw of found) {
    let url = raw.replace(/[.,;]+$/, '')
    if (!FETCHABLE.test(url)) continue
    if (ONLY_404) {
      // Deliberately crude, and only as a FILTER — it narrows what to fetch, it never decides.
      const at = text.indexOf(raw)
      const near = at < 0 ? '' : text.slice(Math.max(0, at - 200), at + 200)
      if (!/404/.test(near)) continue
    }
    if (!cited.has(url)) cited.set(url, new Set())
    cited.get(url).add(id)
  }
}

console.log(`${scanned} ${ALL ? '' : 'open '}issue(s) scanned · ${cited.size} distinct fetchable URL(s) cited\n`)
if (!cited.size) process.exit(0)

const rows = []
for (const [url, ids] of cited) {
  let code = '???'
  try {
    const r = await fetch(url, { headers: { Authorization: AUTH }, redirect: 'manual' })
    code = String(r.status)
  } catch (e) {
    code = 'ERR'
  }
  rows.push({ code, url, ids: [...ids].sort() })
}

rows.sort((a, b) => a.code.localeCompare(b.code) || a.url.localeCompare(b.url))
for (const r of rows) {
  const tail = r.url.replace(/^https:\/\/[^/]+/, '').split('/').slice(-3).join('/')
  console.log(`  ${r.code}  ${tail.padEnd(62)} cited by ${r.ids.map((i) => '#' + i).join(' ')}`)
}

const ok = rows.filter((r) => r.code === '200').length
console.log(`\n${ok} of ${rows.length} cited URL(s) answer 200.`)
console.log('⚠️ This reports status codes only. A 200 beside an issue that argues from a 404 is worth')
console.log('   reading — but whether it contradicts the issue is a judgement, and is left to you.')
