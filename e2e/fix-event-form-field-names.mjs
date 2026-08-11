/**
 * docs/issues/0093 / docs/issues/0089 — the `event` create form submits, answers 200, and creates
 * nothing. That is why **P3-S12 — the only step verifying os-threat#84 (promotion moves an object
 * onto the incident) — cannot run**, and it is the single red step in the full regression.
 *
 * ROOT CAUSE, from the algorithm log (which nobody had read — the chain answers HTTP 200 with
 * `"error":"true"` in the BODY, docs/issues/0142):
 *
 *     stix2.exceptions.ExtraPropertiesError: Unexpected properties for Event: (field).
 *
 * Identical in kind to docs/issues/0142: an authored field whose `name` is missing serialises under
 * the fallback key `field`. Here it is the event-type vocabulary select, which was sending
 * `"field": "aggregation-information-phishing-schemes"`.
 *
 * ⚠️ NO GUESSING — THE AUTHORED LABELS NAME THE PROPERTIES, and each maps to exactly one property on
 * `Event._properties` (stixorm/module/definitions/os_threat/classes.py):
 *
 *   vocab      name = <MISSING>            label "event_types"     -> event_types      (crashes today)
 *   string_3   name = "goals"              label "goal"            -> goal             (latent)
 *   composite  name = "StateChangeObject"  label "changed_objects" -> changed_objects  (latent)
 *
 * The last one is precisely 0142's mistake again: named after the EMBEDDED TYPE
 * (`StateChangeObject`) rather than the property that holds the list. The two latent ones do not
 * crash today only because empty values are stripped before the object is built — they will the
 * moment a presenter fills them.
 *
 *     node e2e/fix-event-form-field-names.mjs            # report only
 *     node e2e/fix-event-form-field-names.mjs --apply
 *
 * ⚠️ Needs NODE_TLS_REJECT_UNAUTHORIZED=0 — Node rejects the Traefik leaf certificate that
 * Playwright's `ignoreHTTPSErrors` hides (docs/issues/0142).
 */
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
const APPLY = process.argv.includes('--apply')

const FORM =
  '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms' +
  '/event-forms/event-create/jcr:content/rootcontainer/main/form/composite_1/field/one/container1'

const TARGETS = [
  {
    what: 'event types vocabulary — no name at all, so it serialises as the fallback key `field`',
    path: `${FORM}/vocab/field`,
    from: undefined,
    to: 'event_types',
    breaking: true,
  },
  {
    what: 'goal — authored plural; the STIX property is singular',
    path: `${FORM}/string_3/field`,
    from: 'goals',
    to: 'goal',
    breaking: false,
  },
  {
    what: 'changed objects — named after the embedded type, not the property holding the list',
    path: `${FORM}/composite/field`,
    from: 'StateChangeObject',
    to: 'changed_objects',
    breaking: false,
  },
]

const read = async (p) => {
  const res = await fetch(`${CMS}${p}.json`, { headers: { Authorization: auth } })
  return res.ok ? res.json() : null
}

let changed = 0
let skipped = 0
let failed = 0

for (const t of TARGETS) {
  const before = await read(t.path)
  if (before === null) {
    console.log(`${t.what}\n   ! node not readable at ${t.path} - skipping\n`)
    failed++
    continue
  }
  const cur = before.name
  console.log(`${t.breaking ? '[BREAKS TODAY] ' : '[latent]       '}${t.what}`)
  console.log(`   node    ${t.path}`)
  console.log(`   current ${JSON.stringify(cur)}   ->   ${JSON.stringify(t.to)}`)

  if (cur === t.to) {
    console.log('   = already correct\n')
    skipped++
    continue
  }
  if (cur !== t.from) {
    // Never overwrite a value nobody predicted - it may have been edited since.
    console.log(`   ! unexpected current value (expected ${JSON.stringify(t.from)}); skipping rather than clobbering\n`)
    skipped++
    continue
  }
  if (!APPLY) {
    console.log('   ~ would change (dry run)\n')
    continue
  }

  const res = await fetch(PROP_SERVLET, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ path: t.path, name: 'name', value: t.to }),
  })
  // A 200 from the servlet is not evidence the property landed (docs/issues/0057) - read it back.
  const after = await read(t.path)
  if (after?.name === t.to) {
    console.log(`   POST ${res.status} -> OK, read back ${JSON.stringify(after.name)}\n`)
    changed++
  } else {
    console.log(`   POST ${res.status} -> FAIL, read back ${JSON.stringify(after?.name)}\n`)
    failed++
  }
}

console.log(`changed ${changed}  skipped ${skipped}  failed ${failed}`)
if (!APPLY) console.log('\ndry run - nothing written. Re-run with --apply.')
else console.log('\nVerify: node e2e/probe-0093-event-create.mjs (it reads the algorithm log on failure).')
