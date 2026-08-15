/**
 * docs/issues/0167 residue — stop intermediate Flow routes swallowing an upstream non-2xx.
 *
 * Mechanism (measured): every algorithm-calling component copy uses
 *     fetchRes.then(res =>res.json())
 *         .then(d => { $.send('output', d) })
 *         .catch(err => { $.send('output', err) })
 * which discards res.status — FastAPI's 500 (0026/4153e8a3) has a JSON body, so the error
 * envelope sails out the SUCCESS output and the flow's httpresponse answers 200. The caller
 * therefore saw 200 around {"error":"true",...} (0164's crash trace).
 *
 * Surgery (raw-text replaceAll — these DB files are NOT stringify-round-trip stable; string
 * surgery is the established discipline). Three chain rewrites + the httpresponse status read:
 *   1. chain head  -> carry {__upstream_status, __data} through the json() promise
 *   2. then-send   -> on >=400 record $.repo.upstream_status ($.repo survives message forwarding;
 *                     $.status does not — measured during the R4 build), then send the data
 *   3. catch-send  -> record 502 and send an explicit error envelope instead of the raw Error
 *   4. httpresponse -> status: ($.repo && $.repo.upstream_status) || $.status
 * The R4 flow's bespoke httpresponse (reads $.repo.r4_status, decision 0017) contains none of
 * pattern 4's text, so it is untouched by construction; its components DO gain patterns 1-3,
 * which its response deliberately ignores (r4_status wins) — noted in the issue.
 *
 * Verified idiom counts before surgery: provisioning 1882/1882/1882 + 108 hr; runtime
 * 1539/1539/1539 + 124 hr (one r4 variant each, untouched). The script asserts counts match,
 * backs both files up, applies, re-parses as JSON, and reports the after-counts.
 *
 *     node e2e/fix-0167-flow-status-propagation.mjs [--apply]
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const APPLY = process.argv.includes('--apply')
const WORKSPACE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const BASE = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database')
const BACKUP = path.join(WORKSPACE, 'typerefinery-websight/e2e/.backup-0167')

const R = [
  [
    'fetchRes.then(res =>res.json())',
    'fetchRes.then(res => res.json().then(d => ({ __upstream_status: res.status, __data: d })))',
  ],
  [
    ".then(d => { $.send('output', d) })",
    ".then(w => { if (w.__upstream_status >= 400 && $.repo) { $.repo.upstream_status = w.__upstream_status; } $.send('output', w.__data) })",
  ],
  [
    ".catch(err => { $.send('output', err) })",
    ".catch(err => { if ($.repo) { $.repo.upstream_status = 502; } $.send('output', { error: 'true', fetch_error: String(err) }) })",
  ],
  ['status: $.status', 'status: ($.repo && $.repo.upstream_status) || $.status'],
]

const count = (h, n) => h.split(n).length - 1

for (const [label, file] of [
  ['provisioning', path.join(BASE, 'demo/database.json')],
  ['runtime', path.join(BASE, 'database.json')],
]) {
  let raw = fs.readFileSync(file, 'utf8')
  const c = R.map(([o]) => count(raw, o))
  console.log(`== ${label}: idiom counts ${c.join(' / ')}`)
  if (!(c[0] === c[1] && c[1] === c[2] && c[0] > 0)) {
    console.log(`🔴 ${label}: chain counts disagree — idiom drifted, refusing to touch`)
    process.exitCode = 1
    continue
  }
  if (!APPLY) {
    console.log(`   (dry run — would rewrite ${c[0]} chains + ${c[3]} httpresponse status reads)`)
    continue
  }
  fs.mkdirSync(BACKUP, { recursive: true })
  const bak = path.join(BACKUP, `${label}-database.json`)
  fs.copyFileSync(file, bak)
  for (const [o, n] of R) raw = raw.split(o).join(n)
  JSON.parse(raw) // must still be valid JSON before we commit to disk
  fs.writeFileSync(file, raw)
  const after = R.map(([o]) => count(fs.readFileSync(file, 'utf8'), o))
  console.log(`✅ ${label}: applied (backup at ${bak}); residual old-idiom counts ${after.join(' / ')} (expect 0/0/0/0)`)
}
