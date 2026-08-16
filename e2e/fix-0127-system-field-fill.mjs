/**
 * docs/issues/0127 — give the non-editable system fields a visible background, so "you cannot type
 * here" is legible at a glance the way image3 shows it.
 *
 * State before this: `id` / `created` / `modified` / `spec_version` render `readonly` and `type`
 * renders `disabled` (the 2026-08-16 02:20Z deploy's readOnly sweep), but every one of them is plain
 * `class="form-control mt-1"` with **no background at all** — identical to the editable fields beside
 * them. The behaviour was fixed and the visual cue was not, which is the half a viewer actually reads.
 *
 * Verified first that an authored `classes` property reaches the rendered input:
 *
 *     classes="tr-system-field"  ->  <input class="tr-system-field form-control mt-1" …>
 *
 * so this needs no bundle deploy.
 *
 * ⚠️ **`bg-light`, not a bespoke cream.** image3 shows a cream fill; a literal cream needs a new CSS
 * rule in a clientlib, which is deploy-gated and would be inventing a colour. The authored content
 * already uses Bootstrap utilities throughout (`text-muted`, `w-100`, `order-1`, `d-none`, `mb-1`), so
 * `bg-light` follows the convention that is already here, lands immediately, and delivers the actual
 * point of the mockup's cream — system fields reading as different from fields you fill in. Swapping
 * it for an exact cream later is a one-line CSS follow-up and this script's `FILL` constant.
 *
 * ⚠️ The RULE is "any field the user cannot edit", not a hardcoded list of five names — so a form that
 * gains another read-only field inherits the cue instead of quietly missing it.
 *
 *     node e2e/fix-0127-system-field-fill.mjs identity-update
 *     node e2e/fix-0127-system-field-fill.mjs identity-update --apply
 *     node e2e/fix-0127-system-field-fill.mjs --all --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
const ROOT = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms'
const PKG = path.resolve(
  __dirname,
  '../tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms',
)
const FILL = process.env.FILL || 'bg-light'
const APPLY = process.argv.includes('--apply')
const ALL = process.argv.includes('--all')
const ONE = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null

const pages = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (!e.isDirectory()) continue
    if (/-(create|update)$/.test(e.name)) pages.push(path.relative(PKG, path.join(d, e.name)).replace(/\\/g, '/'))
    else walk(path.join(d, e.name))
  }
})(PKG)

const targets = ONE ? pages.filter((p) => p.endsWith('/' + ONE) || p === ONE) : ALL ? pages : []
if (!targets.length) {
  console.log(`specify a form or --all. known form panels: ${pages.length}`)
  process.exit(1)
}

const isTrue = (v) => v === true || v === 'true'
const findFields = async (base) => {
  const found = []
  const seen = new Set()
  const walkNode = async (p, depth) => {
    if (depth > 20 || seen.has(p)) return
    seen.add(p)
    const r = await fetch(`${CMS}${p}.1.json`, { headers: { Authorization: auth } })
    if (!r.ok) return
    const j = await r.json()
    if (isTrue(j.readOnly) || isTrue(j.disabled)) {
      found.push({ path: p, name: j.name, classes: j.classes || '', why: isTrue(j.readOnly) ? 'readOnly' : 'disabled' })
    }
    for (const [k, v] of Object.entries(j)) if (v && typeof v === 'object') await walkNode(`${p}/${k}`, depth + 1)
  }
  await walkNode(base, 0)
  return found
}

let totalFound = 0
let totalWritten = 0
const failures = []
for (const rel of targets) {
  const fields = (await findFields(`${ROOT}/${rel}/jcr:content`)).filter(
    (f) => !String(f.classes).split(/\s+/).includes(FILL),
  )
  totalFound += fields.length
  if (!APPLY) {
    console.log(`~ ${rel}: ${fields.length} non-editable field(s) without ${FILL}` + (fields.length ? ` — ${fields.map((f) => `${f.name}(${f.why})`).join(', ')}` : ''))
    continue
  }
  let ok = 0
  for (const f of fields) {
    const value = (String(f.classes).trim() ? String(f.classes).trim() + ' ' : '') + FILL
    const res = await fetch(PROP_SERVLET, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ path: f.path, name: 'classes', value }),
    })
    // A 200 is not evidence the property landed (docs/issues/0057) — read it back.
    const back = await (await fetch(`${CMS}${f.path}.json`, { headers: { Authorization: auth } })).json().catch(() => ({}))
    if (String(back.classes || '').split(/\s+/).includes(FILL)) ok++
    else failures.push(`${rel} ${f.name} -> http ${res.status}, reads back ${JSON.stringify(back.classes)}`)
  }
  totalWritten += ok
  console.log(`✓ ${rel}: ${ok}/${fields.length}`)
}

console.log(`\n${APPLY ? `written ${totalWritten}/${totalFound}` : `would set ${FILL} on ${totalFound}`} field(s) across ${targets.length} form(s)`)
if (failures.length) {
  console.log(`\n⚠️ ${failures.length} did not land:`)
  for (const f of failures.slice(0, 20)) console.log(`   ${f}`)
  process.exit(1)
}
if (!APPLY) console.log('(report only — pass --apply)')
