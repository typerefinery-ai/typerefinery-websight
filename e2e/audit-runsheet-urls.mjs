/**
 * Does every page the PRESENTER RUNSHEET tells someone to open actually serve?
 *
 * The Chrome gate walks the Acts through committed scripts. It does not read the presenter's
 * document. So a "Go to: BASE /pages/incidents.html" line that has gone stale would pass every gate
 * and fail on stage — the failure mode this project keeps finding one level up.
 *
 * Extracts every BASE-relative path and absolute URL the runsheet names, fetches each, and reports.
 * ⚠️ Fetches with auth, because every one of these is behind the CMS login: an unauthenticated 401
 * would look like a dead link and send someone fixing a document that is correct.
 *
 *     node e2e/audit-runsheet-urls.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
/**
 * ⚠️ Resolve BASE from the RUNSHEET'S OWN DEFINITION, not from this suite's usual host.
 *
 * The runsheet says: *"The CMS serves the app at `http://localhost:8113/content/…/os-triage/`.
 * Throughout this document, **BASE** means exactly that."* The rest of the e2e suite uses
 * `https://cms.typerefinery.localhost:8101`. A first version of this check resolved the runsheet's
 * paths against **8101** — so it was verifying that the suite's host works, which was never in
 * question, rather than that the presenter's instructions do.
 *
 * If the definition line ever changes, this follows it; if it cannot be found, the check fails rather
 * than silently falling back to a host the document does not name.
 */
const RUNSHEET_BASE_RE = /`(https?:\/\/[^`\s]+\/pages\/os-triage\/?)`/
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const USER = process.env.RUNSHEET_USER || path.join(WORKSPACE, 'docs/mini-app-runsheet-user.md')
if (!fs.existsSync(USER)) { console.error(`missing ${USER} — failing rather than reporting green`); process.exit(2) }
const text = fs.readFileSync(USER, 'utf8')

const baseMatch = RUNSHEET_BASE_RE.exec(text)
if (!baseMatch) {
  console.error('could not find the runsheet\'s own BASE definition — refusing to guess a host')
  process.exit(2)
}
const BASE = baseMatch[1].replace(/\/$/, '')
console.log(`BASE, as the runsheet defines it: ${BASE}\n`)

/**
 * BASE-relative paths, as the runsheet writes them: **Go to:** BASE `/pages/incidents.html`
 * and inline mentions like BASE `/forms/composer-local.html`.
 */
const rel = [...text.matchAll(/BASE\s*`([^`]+)`/g)].map((m) => m[1].trim())
/** Absolute service URLs the runsheet names (Flow, the manager dashboard, widget dev servers). */
const abs = [...text.matchAll(/`(https?:\/\/[^`\s]+)`/g)].map((m) => m[1].trim())
  .filter((u) => !/example\.com|\{|\}|<|>/.test(u))
  // ⚠️ Drop the BASE definition itself. It is a folder with no index, so it answers 403 — and no
  // presenter ever opens it; they paste BASE followed by a path. Flagging it reported a demo-stopping
  // failure for a URL nobody visits, on a document that was correct.
  .filter((u) => u.replace(/\/$/, '') !== BASE)

const targets = [
  ...[...new Set(rel)].map((p) => ({ kind: 'BASE', shown: p, url: `${BASE}${p.startsWith('/') ? '' : '/'}${p}` })),
  ...[...new Set(abs)].map((u) => ({ kind: 'abs', shown: u, url: u })),
]

console.log(`${targets.length} URL(s) named by the presenter runsheet (${rel.length} BASE-relative, ${abs.length} absolute)\n`)

let bad = 0
for (const t of targets) {
  const res = await fetch(t.url, { headers: { Authorization: auth }, redirect: 'follow' }).catch((e) => ({ status: 0, err: String(e.message).slice(0, 40) }))
  const s = res.status
  // 2xx is fine. A 401 with auth supplied means the credentials did not work, which is a real finding.
  const ok = s >= 200 && s < 400
  if (!ok) bad++
  console.log(`  ${ok ? 'ok ' : '🚩 '} ${String(s || 'ERR').padEnd(4)} ${t.kind === 'BASE' ? 'BASE ' : '     '}${t.shown.slice(0, 96)}`)
}

console.log(`\n${targets.length - bad}/${targets.length} reachable`)
if (bad) {
  console.log('🚩 A URL a presenter is told to open does not serve. That fails on stage and no gate would catch it.')
  process.exitCode = 1
} else {
  console.log('every page the presenter is told to open serves')
  console.log('⚠️ Reachability only — this does not check that the page shows what the runsheet says it shows.')
}
