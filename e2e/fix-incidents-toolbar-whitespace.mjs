/**
 * docs/issues/0110 (and docs/issues/0013's family) — the Incidents toolbar carries authored
 * whitespace defects that are visible on Act 1's opening screen:
 *
 *   field placeholder : "Incident  1"  <- DOUBLE space
 *   label             : "Incident "    <- TRAILING space
 *
 * 0013 established that a trailing space in an authored *name* silently breaks payload matching.
 * These two are in a `placeholder` and a `label`, so they are cosmetic rather than functional — but
 * they are on the first screen an audience sees, and CLAUDE.md rates opening-screen presentation
 * as partly commercial severity.
 *
 * Deliberately NOT changed here: the wording itself. The mockup (docs/mini-app-source/image2.png)
 * shows this field carrying the sample value `Incident 1`, so "Incident 1" is the design's text and
 * only the extra whitespace is the defect. Renaming it to e.g. "Search incidents" would be a design
 * change and belongs with docs/issues/0123.
 *
 *     node e2e/fix-incidents-toolbar-whitespace.mjs            # report only
 *     node e2e/fix-incidents-toolbar-whitespace.mjs --apply
 */
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const TOOLBAR =
  '/content/typerefinery-showcase/pages/os-triage/pages/incidents/jcr:content/rootcontainer/container1/form/container'

const TARGETS = [
  {
    what: 'toolbar text-box placeholder',
    path: `${TOOLBAR}/container_2/input_1/field`,
    prop: 'placeholder',
    from: 'Incident  1',
    to: 'Incident 1',
  },
  {
    what: 'toolbar label (hidden, but authored)',
    path: `${TOOLBAR}/container_2/input_1/label`,
    prop: 'label',
    from: 'Incident ',
    to: 'Incident',
  },
]

const APPLY = process.argv.includes('--apply')
const read = async (p) => (await fetch(`${CMS}${p}.json`, { headers: { Authorization: auth } })).json()

let changed = 0
let failed = 0
let skipped = 0

for (const t of TARGETS) {
  const before = await read(t.path)
  const cur = before?.[t.prop]
  console.log(`${t.what}`)
  console.log(`   node    ${t.path}`)
  console.log(`   prop    ${t.prop}`)
  console.log(`   current ${JSON.stringify(cur)}`)
  console.log(`   target  ${JSON.stringify(t.to)}`)

  if (cur === t.to) {
    console.log('   = already correct\n')
    skipped++
    continue
  }
  if (cur !== t.from) {
    // Do not overwrite a value nobody predicted - it may have been edited since.
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
    body: new URLSearchParams({ path: t.path, name: t.prop, value: t.to }),
  })
  // A 200 from the servlet is not evidence the property landed (docs/issues/0057) - read it back.
  const after = await read(t.path)
  if (after?.[t.prop] === t.to) {
    console.log(`   POST ${res.status} -> OK, read back ${JSON.stringify(after[t.prop])}\n`)
    changed++
  } else {
    console.log(`   POST ${res.status} -> FAIL, read back ${JSON.stringify(after?.[t.prop])}\n`)
    failed++
  }
}

console.log(`changed ${changed}, skipped ${skipped}, failed ${failed}`)
if (APPLY && failed) process.exit(1)
