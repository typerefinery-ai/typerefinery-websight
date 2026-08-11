/**
 * docs/issues/0103 + docs/decisions/0024 Option 1 — point Act 1's two headline actions at the
 * real Incident Overview instead of `pages/incidents/incident.html`, a wireframe bound to nothing.
 *
 * The docx (Page 1 Behaviour) specifies this twice, verbatim: after Create "the Incident Overview
 * page is opened, and the new default Incident automatically loaded", and row select "opens the
 * Incident Overview with the new default auto-loaded". So this is the build failing its own
 * specification, not a design choice — decision 0024's remaining open question is what becomes of
 * `incident.html`, which this script deliberately does not touch.
 *
 * Two things that will bite anyone editing these values by hand:
 *
 *   - **Author the path WITHOUT `.html`.** `LinkUtil.addHtmlExtensionSuffixToLink()` appends it
 *     server-side when the path resolves to an internal resource (ActionButton.java:50,
 *     NavigationItemComponent.java:78). Authoring `.html` yourself yields `…overview-local.html.html`.
 *     If the path does NOT resolve, the other branch prepends `http://` instead, producing the
 *     malformed `http:///content/…` already visible on `actionButtonModalContentURL`.
 *   - **The Overview is `os-triage/forms/overview-local`, a SIBLING of `pages/`** — not
 *     `pages/forms/…`, which 404s and is what the issue originally recorded.
 *
 *     node e2e/repoint-act1-destinations.mjs            # report only, writes nothing
 *     node e2e/repoint-act1-destinations.mjs --apply
 *     node e2e/repoint-act1-destinations.mjs --revert   # back to the wireframe
 */
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const OVERVIEW = '/content/typerefinery-showcase/pages/os-triage/forms/overview-local'
const WIREFRAME = '/content/typerefinery-showcase/pages/os-triage/pages/incidents/incident'

const APPLY = process.argv.includes('--apply')
const REVERT = process.argv.includes('--revert')
const TARGET = REVERT ? WIREFRAME : OVERVIEW

/** The two authored properties that decide where Act 1's headline actions land. */
const TARGETS = [
  {
    step: 'P1-S6',
    what: 'Save (Create Incident modal, header "+ Create" -> Incident)',
    path: '/content/typerefinery-showcase/pages/os-triage/admin/header/default/jcr:content/container/container2/button_1/dropdownItems/0',
    prop: 'successNavigateTo',
    consumer: 'clientlibs/clientlibs-header/dropdown.js:82-91 (window.location.href on FORM_SUCCESS)',
  },
  {
    step: 'P1-S7',
    what: 'Open (incidents table row action)',
    path: '/content/typerefinery-showcase/pages/os-triage/pages/incidents/jcr:content/rootcontainer/container1/form/container2/table/actionButtons/1',
    prop: 'actionButtonNavigateToPath',
    consumer: 'widgets/table/clientlibs/functions.js:118-128 (window.location.href after set-current POST)',
  },
]

const read = async (path) =>
  (await fetch(`${CMS}${path}.json`, { headers: { Authorization: auth } })).json()

// Refuse to point at something that is not there: an unresolvable path does not 404 visibly, it
// silently takes LinkUtil's external branch and renders `http:///content/…`.
const probe = await fetch(`${CMS}${TARGET}.html`, { headers: { Authorization: auth } })
console.log(`target ${TARGET}.html -> HTTP ${probe.status}`)
if (probe.status !== 200) {
  console.error('FAIL — the destination does not resolve; aborting rather than authoring a dead link.')
  process.exit(1)
}
console.log(`mode: ${REVERT ? 'REVERT to wireframe' : 'repoint to Overview'}${APPLY ? ' (--apply)' : ' (dry run)'}\n`)

let changed = 0
let failed = 0

for (const t of TARGETS) {
  const before = await read(t.path)
  const current = before?.[t.prop]
  console.log(`${t.step}  ${t.what}`)
  console.log(`   node     ${t.path}`)
  console.log(`   prop     ${t.prop}`)
  console.log(`   current  ${JSON.stringify(current)}`)
  console.log(`   target   ${JSON.stringify(TARGET)}`)
  console.log(`   consumer ${t.consumer}`)

  if (current === TARGET) {
    console.log('   = already at the target, nothing to do\n')
    continue
  }
  if (!APPLY) {
    console.log('   ~ would change (dry run)\n')
    continue
  }

  const res = await fetch(PROP_SERVLET, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ path: t.path, name: t.prop, value: TARGET }),
  })
  console.log(`   POST -> ${res.status}`)

  // A 200 from the servlet is not evidence the property landed (docs/issues/0057) — read it back.
  const after = await read(t.path)
  if (after?.[t.prop] === TARGET) {
    console.log(`   OK — read back ${JSON.stringify(after[t.prop])}\n`)
    changed++
  } else {
    console.log(`   FAIL — read back ${JSON.stringify(after?.[t.prop])}\n`)
    failed++
  }
}

if (APPLY) {
  console.log(`changed ${changed}, failed ${failed}`)
  if (failed) process.exit(1)
  console.log(
    '\nNOTE: this writes the RUNNING CMS only. Mirror the same two values into\n' +
      '  tests/content/.../os-triage/admin/header/default/.content.xml   (successNavigateTo)\n' +
      '  tests/content/.../os-triage/pages/incidents/.content.xml        (actionButtonNavigateToPath)\n' +
      'or a redeploy of the content package will revert it (docs/issues/0042).',
  )
}
