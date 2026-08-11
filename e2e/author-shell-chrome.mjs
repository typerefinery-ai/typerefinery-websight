/**
 * docs/issues/0124 Option A, slice 1 — give a full-page os-triage page the shared app chrome.
 * Sequenced first by docs/decisions/0028; the destination half is docs/decisions/0024 (Decided).
 *
 * HOW THE CHROME ACTUALLY WORKS (read from the running CMS, not assumed):
 *
 *   /pages/os-triage            (root)  rootcontainer/aside/reference   -> admin/asideleft/default/.../container
 *                                       rootcontainer/header/reference  -> admin/header/default/.../container
 *   /pages/os-triage/pages      rootcontainer/aside, /header   <- EMPTY nodes; WebSight inheritance
 *                                                                 supplies the references from the root
 *   /pages/os-triage/forms      rootcontainer is EMPTY         <- no aside, no header, nothing inherits
 *
 * `overview-local` lives under `forms/`, which is why Act 2's destination has no chrome and no way
 * back. So this is not "build chrome" — it is "include the chrome that already exists", exactly the
 * way the `pages/` branch already does it.
 *
 * ⚠️ WHY THIS IS PER-PAGE AND NOT PER-BRANCH: `forms/` has 19 children and most are MODAL content
 * (note, addtag, addtask, updateincident, createincident, artifact, create-user, identity,
 * stixorm-forms...). Those render inside iframes as modals. Adding chrome at the branch level would
 * put the app sidebar and header inside every modal dialog. Only the full-page members
 * (overview-local, composer-local, and their -public twins, vizandform) should get it.
 *
 *     node e2e/author-shell-chrome.mjs                    # report only
 *     node e2e/author-shell-chrome.mjs --apply
 *     node e2e/author-shell-chrome.mjs --apply --revert   # remove what this added
 *     node e2e/author-shell-chrome.mjs --page composer-local --apply
 */
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const NODE_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-node'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const argv = process.argv.slice(2)
const APPLY = argv.includes('--apply')
const REVERT = argv.includes('--revert')
const pageArg = argv.indexOf('--page')
const PAGE = pageArg !== -1 ? argv[pageArg + 1] : 'overview-local'

const ROOT = `/content/typerefinery-showcase/pages/os-triage/forms/${PAGE}/jcr:content/rootcontainer`

// Mirror exactly what the working `pages/` branch carries - empty layout nodes that inherit the
// root page's references. Copying the reference nodes directly would fork the nav content.
// ⚠️ ORDER MATTERS AND CANNOT BE SET HERE. The rendered position of an inherited chrome component
// is decided by where the LOCAL placeholder node sits in the parent's child order, and
// ComponentNodeServlet only creates/updates — it has no ordering parameter and no delete
// (verified in ComponentNodeServlet.java: it takes exactly parent/name/json).
//
// So on a page whose rootcontainer already has `main`, anything added lands AFTER it:
//   pages/incidents.html  order aside, header, container1   -> header renders top=0    ✅
//   forms/overview-local  order main, aside, header         -> header renders top=900  ❌ below the fold
//
// The aside is unaffected (CSS positions it left at top=0), but the header becomes a stray 63px bar
// under the content. Measured, not assumed — and a "header present: true" assertion passes on it,
// which is how it nearly shipped (docs/issues/0139).
//
// Until an ordering/delete capability exists, `header` is created with cancelInheritParent=true so
// the root page's header is NOT pulled in at the wrong position. That is a mitigation: the page gets
// the nav and no stray bar, but no header band.
const CHROME = [
  { name: 'aside', rt: 'typerefinery/components/layout/aside', props: {} },
  {
    name: 'header',
    rt: 'typerefinery/components/layout/header',
    // Suppresses the inherited header rather than rendering it in the wrong place.
    props: { cancelInheritParent: 'true' },
  },
]

const json = async (p) => {
  const res = await fetch(`${CMS}${p}`, { headers: { Authorization: auth } })
  return res.ok ? res.json() : null
}

console.log(`page   : ${PAGE}`)
console.log(`root   : ${ROOT}`)
console.log(`mode   : ${REVERT ? 'REVERT' : 'add chrome'}${APPLY ? ' (--apply)' : ' (dry run)'}\n`)

const before = await json(`${ROOT}.1.json`)
if (!before) {
  console.error('FAIL - could not read the rootcontainer; wrong page name?')
  process.exit(1)
}
const kids = Object.keys(before).filter((k) => before[k] && typeof before[k] === 'object')
console.log(`current children: ${kids.join(', ') || '(none)'}`)

// Refuse to touch a page that is modal content - the sidebar must never appear inside a dialog.
const MODAL_HINTS = ['stixorm-forms', 'note', 'addtag', 'addtask', 'artifact', 'identity', 'create-user', 'add-email-address', 'updateincident', 'createincident']
if (MODAL_HINTS.includes(PAGE)) {
  console.error(`\nREFUSED - "${PAGE}" is modal content; chrome there would render a sidebar inside a dialog.`)
  process.exit(1)
}

let changed = 0
for (const c of CHROME) {
  const exists = kids.includes(c.name)
  if (REVERT) {
    // ⚠️ THERE IS NO REVERT. An earlier version of this script POSTed `delete: 'true'`, which the
    // servlet ignores (it accepts only parent/name/json, and a blank json is rejected 400). Nothing
    // in ComponentNodeServlet or ComponentPropertyServlet can remove a node — so a node created here
    // is permanent with the sanctioned tooling. Say so rather than appearing to undo (docs/issues/0139).
    console.log(`${c.name}: ${exists ? 'PRESENT' : 'absent'} — cannot be removed.`)
    console.log('   The authoring servlets create/update only; neither deletes a node.')
    console.log('   Closest available mitigation: set cancelInheritParent=true so the inherited')
    console.log('   component is not rendered (that is what this script already does for `header`).')
    continue
  }
  if (exists) {
    console.log(`${c.name}: already present, skipping`)
    continue
  }
  if (!APPLY) {
    console.log(`${c.name}: ~ would create (${c.rt})`)
    continue
  }
  const res = await fetch(NODE_SERVLET, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      parent: ROOT,
      name: c.name,
      json: JSON.stringify({
        'jcr:primaryType': 'nt:unstructured',
        'sling:resourceType': c.rt,
        ...(c.props || {}),
      }),
    }),
  })
  console.log(`${c.name}: POST -> ${res.status}`)
  changed++
}

if (APPLY) {
  // A 200 from the servlet is not evidence the node landed (docs/issues/0057) - read it back.
  const after = await json(`${ROOT}.1.json`)
  const now = Object.keys(after || {}).filter((k) => after[k] && typeof after[k] === 'object')
  console.log(`\nread back children: ${now.join(', ') || '(none)'}`)
  for (const c of CHROME) {
    const want = !REVERT
    const has = now.includes(c.name)
    console.log(`  ${c.name.padEnd(8)} ${has === want ? 'OK' : 'FAIL'} (present=${has}, wanted=${want})`)
  }
}
