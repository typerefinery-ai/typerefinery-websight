/**
 * docs/issues/0075 — server-side guard in the connection save leg (the triage's static allowlist).
 *
 * An SDO-only common property written onto an SCO stores invalid STIX and takes out every
 * algorithm that later reads the object (measured: one bad write broke the Create Connection
 * modal ~40% of the time). The UI cannot produce this; scripts and harnesses can. The lists
 * mirror e2e/audit-sco-invalid-properties.mjs EXACTLY — same boundary, same blind spots
 * (custom SCOs like anecdote are outside both, by design; Option 2's stixorm parse remains the
 * durable end state).
 *
 * Patches the `mapwrap` node in flow f21cbw001rn51d in BOTH DBs (now present in both since the
 * 46-leg provisioning). Sets $.repo.upstream_status = 422 so the refusal surfaces at the
 * browser-facing route via the 0167 status chain.
 *
 *     node e2e/fix-0075-connection-field-guard.mjs [--apply]
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const APPLY = process.argv.includes('--apply')
const WORKSPACE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const BASE = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database')
const BACKUP = path.join(WORKSPACE, 'typerefinery-websight/e2e/.backup-0075')

const esc = (s) => JSON.stringify(s).slice(1, -1)
const MARKER = esc('Create Connection posts a FLAT body (captured through the UI, docs/issues/0046)')
const ANCHOR = esc("console.log('[connection] ' + src + '.' + field + ' = ' + tgt);")
const REPLACEMENT = esc(
  "// docs/issues/0075 - server-side guard for the observed fault class: an SDO-only common\n" +
    "// property on an SCO stores invalid STIX and every later reader dies on it. Mirrors\n" +
    "// e2e/audit-sco-invalid-properties.mjs exactly; 422 surfaces via the 0167 status chain.\n" +
    "var SCO_TYPES = ['artifact','autonomous-system','directory','domain-name','email-addr','email-message','file','ipv4-addr','ipv6-addr','mac-addr','mutex','network-traffic','process','software','url','user-account','windows-registry-key','x509-certificate'];\n" +
    "var SDO_ONLY = ['created_by_ref','created','modified','revoked','labels','confidence','lang','external_references'];\n" +
    "var srcType = String(src).split('--')[0];\n" +
    "if (SCO_TYPES.indexOf(srcType) !== -1 && SDO_ONLY.indexOf(field) !== -1) {\n" +
    "  console.log('[connection] REFUSED: ' + field + ' is SDO-only and ' + srcType + ' is an SCO - would store invalid STIX (docs/issues/0075)');\n" +
    "  try { $.repo.upstream_status = 422; } catch (e) {}\n" +
    "  $.send('output', { error: 'true', reason: 'invalid_connection_field', detail: field + ' not valid for ' + srcType });\n" +
    "  return;\n" +
    "}\n" +
    "console.log('[connection] ' + src + '.' + field + ' = ' + tgt);"
)
const WINDOW = 8_000

for (const [label, file] of [
  ['provisioning', path.join(BASE, 'demo/database.json')],
  ['runtime', path.join(BASE, 'database.json')],
]) {
  let raw = fs.readFileSync(file, 'utf8')
  const sites = []
  let at = -1
  while ((at = raw.indexOf(MARKER, at + 1)) !== -1) sites.push(at)
  console.log(`== ${label}: ${sites.length} mapwrap cop(ies)`)
  if (sites.length !== 1) {
    console.log('🔴 expected exactly 1 — refusing')
    process.exitCode = 1
    continue
  }
  const rel = raw.slice(sites[0], sites[0] + WINDOW).indexOf(ANCHOR)
  if (rel === -1) {
    console.log('🔴 anchor not found — drifted or already patched')
    process.exitCode = 1
    continue
  }
  const abs = sites[0] + rel
  const out = raw.slice(0, abs) + REPLACEMENT + raw.slice(abs + ANCHOR.length)
  JSON.parse(out)
  if (!APPLY) {
    console.log('   (dry run — would patch; JSON valid)')
    continue
  }
  fs.mkdirSync(BACKUP, { recursive: true })
  fs.copyFileSync(file, path.join(BACKUP, `${label}-database.json`))
  fs.writeFileSync(file, out)
  console.log(`✅ ${label}: patched, JSON valid, backup kept`)
}
