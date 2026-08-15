/**
 * docs/issues/0147 Option 1 — make_incident: merge base_required into contents.
 *
 * base_required was read and then thrown away (only `modified` was ever tested), so a value like
 * created_by_ref sent in the part of the form named "required" vanished silently — it nearly bit
 * 0145. Merge it like object/base_optional, skipping {type, spec_version, id, created} (stix2
 * generates them) and "modified" (the create-vs-update discriminator; an empty string would crash
 * TimestampProperty). Also logs when `sub` — the second silently-ignored envelope part — carries
 * keys.
 *
 * Scope: EXACTLY the two make_incident node configs per DB (flow f1fiq0001ra51d "Make Incident",
 * the P1-S5 path, and the library flow f1cxea001wp51d "StixORM and OS-Triage Blocks"). The same
 * optional→extensions anchor exists in all 24 Make_* algorithm copies — the sibling sweep is
 * 0147's recorded follow-up, NOT this edit — so the surgery is WINDOWED on the make_incident-only
 * marker `incident_form["base_required"]` and count-asserted at exactly 2 per DB.
 *
 * Raw-text surgery (the established DB discipline); backups + JSON.parse validation before write.
 *
 *     node e2e/fix-0147-merge-base-required.mjs [--apply]
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const APPLY = process.argv.includes('--apply')
const WORKSPACE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const BASE = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database')
const BACKUP = path.join(WORKSPACE, 'typerefinery-websight/e2e/.backup-0147')

const esc = (s) => JSON.stringify(s).slice(1, -1) // plain text -> JSON-escaped raw form

const MARKER = esc('required = incident_form["base_required"]')
const ANCHOR = esc(
  'for k,v in optional.items():\n        contents[k] = v\n    for k,v in extensions.items():'
)
const REPLACEMENT = esc(
  'for k,v in optional.items():\n' +
    '        contents[k] = v\n' +
    '    # docs/issues/0147 Option 1: base_required used to be read and then thrown away, so a\n' +
    '    # value like created_by_ref sent in the part of the form named "required" vanished\n' +
    '    # silently. Merge it like the others, minus the fields stix2 must generate and\n' +
    '    # "modified", the create-vs-update discriminator read below (an empty string would\n' +
    '    # crash TimestampProperty).\n' +
    '    generated_fields = ("type", "spec_version", "id", "created", "modified")\n' +
    '    merged_req = [k for k in required if k not in generated_fields]\n' +
    '    skipped_req = [k for k in required if k in generated_fields]\n' +
    '    for k in merged_req:\n' +
    '        contents[k] = required[k]\n' +
    '    print("make_incident base_required merged=" + str(merged_req) + " skipped=" + str(skipped_req))\n' +
    '    if sub:\n' +
    '        print("make_incident sub is ignored by design; keys dropped: " + str(list(sub.keys())))\n' +
    '    for k,v in extensions.items():'
)
const WINDOW = 40_000 // an algorithm string is ~10-14k escaped chars; 40k stays inside the node

for (const [label, file] of [
  ['provisioning', path.join(BASE, 'demo/database.json')],
  ['runtime', path.join(BASE, 'database.json')],
]) {
  let raw = fs.readFileSync(file, 'utf8')
  const sites = []
  let at = -1
  while ((at = raw.indexOf(MARKER, at + 1)) !== -1) sites.push(at)
  console.log(`== ${label}: ${sites.length} make_incident cop(ies)`)
  if (sites.length !== 2) {
    console.log(`🔴 expected exactly 2 — refusing to touch`)
    process.exitCode = 1
    continue
  }
  let patched = 0
  // patch back-to-front so earlier offsets stay valid
  for (const site of sites.reverse()) {
    const windowEnd = Math.min(raw.length, site + WINDOW)
    const rel = raw.slice(site, windowEnd).indexOf(ANCHOR)
    if (rel === -1) {
      console.log(`🔴 anchor not found within window at offset ${site} — algorithm drifted`)
      process.exitCode = 1
      continue
    }
    const abs = site + rel
    raw = raw.slice(0, abs) + REPLACEMENT + raw.slice(abs + ANCHOR.length)
    patched++
  }
  if (patched !== 2) continue
  if (!APPLY) {
    console.log(`   (dry run — would patch both copies; JSON stays valid: ${!!JSON.parse(raw)})`)
    continue
  }
  fs.mkdirSync(BACKUP, { recursive: true })
  fs.copyFileSync(file, path.join(BACKUP, `${label}-database.json`))
  JSON.parse(raw)
  fs.writeFileSync(file, raw)
  console.log(`✅ ${label}: patched 2/2, JSON valid, backup kept`)
}
