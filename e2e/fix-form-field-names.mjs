/**
 * docs/issues/0144 — apply the mechanical half of the field-name sweep.
 *
 * Reads `sweep-form-field-names.json` (produced by `sweep-form-field-names.mjs`) and sets `name` on
 * every field whose **authored label is itself a valid property of the class the field validates
 * against**. It touches nothing else: the 12 findings where the label does not disambiguate are left
 * for a human, because guessing at those is the improvisation CLAUDE.md forbids.
 *
 * Why this is safe in the direction it moves: every target currently has **no name** or an **empty**
 * name, so it serialises under the fallback key `field` and raises `ExtraPropertiesError` the moment
 * its control has a value. Giving it a verified property name can only reduce breakage.
 *
 * ⚠️ Prove it on one form before the batch. `--only <substring>` restricts to matching form paths.
 *
 *     node e2e/fix-form-field-names.mjs --only identity-create            # report
 *     NODE_TLS_REJECT_UNAUTHORIZED=0 node e2e/fix-form-field-names.mjs --only identity-create --apply
 *     NODE_TLS_REJECT_UNAUTHORIZED=0 node e2e/fix-form-field-names.mjs --apply     # everything
 *
 * ⚠️ NODE_TLS_REJECT_UNAUTHORIZED=0 is required — Node rejects the Traefik leaf certificate that
 * Playwright's `ignoreHTTPSErrors` hides (docs/issues/0142).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
const APPLY = process.argv.includes('--apply')
const onlyArg = process.argv.find((a) => a === '--only')
const only = onlyArg ? process.argv[process.argv.indexOf('--only') + 1] : null

const findings = JSON.parse(fs.readFileSync(path.join(__dirname, 'sweep-form-field-names.json'), 'utf8'))
const targets = findings
  .filter((f) => f.fix)
  .filter((f) => !only || f.form.includes(only))

console.log(`mechanical findings: ${findings.filter((f) => f.fix).length}` +
  (only ? `   matching "${only}": ${targets.length}` : ''))
console.log(`(${findings.length - findings.filter((f) => f.fix).length} findings need a human and are not touched)\n`)

const read = async (p) => {
  const res = await fetch(`${CMS}${p}.json`, { headers: { Authorization: auth } })
  return res.ok ? res.json() : null
}

let changed = 0
let skipped = 0
let failed = 0

for (const t of targets) {
  const node = `${t.form}/jcr:content${t.path}/field`
  const before = await read(node)
  if (before === null) {
    console.log(`  ! unreadable: ${node}`)
    failed++
    continue
  }
  const cur = before.name
  const label = `${t.form.split('/stixorm-forms/')[1]}  ${JSON.stringify(cur)} -> ${JSON.stringify(t.fix)}`
  if (cur === t.fix) {
    skipped++
    continue
  }
  // Only ever replace an absent or empty name — never overwrite a real one, even if the sweep
  // thought it was wrong. A wrong-but-deliberate name is a conversation, not a clobber.
  if (cur !== undefined && cur !== '') {
    console.log(`  ! ${label}  — has a real name already, skipping rather than clobbering`)
    skipped++
    continue
  }
  if (!APPLY) {
    console.log(`  ~ ${label}`)
    continue
  }
  const res = await fetch(PROP_SERVLET, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ path: node, name: 'name', value: t.fix }),
  })
  // A 200 from the servlet is not evidence the property landed (docs/issues/0057) — read it back.
  const after = await read(node)
  if (after?.name === t.fix) {
    console.log(`  ✓ ${label}`)
    changed++
  } else {
    console.log(`  ✗ ${label}  POST ${res.status}, read back ${JSON.stringify(after?.name)}`)
    failed++
  }
}

console.log(`\nchanged ${changed}  skipped ${skipped}  failed ${failed}`)
if (!APPLY) console.log('dry run - nothing written. Re-run with --apply.')
else console.log('Re-run e2e/sweep-form-field-names.mjs to confirm, then exercise the forms.')
