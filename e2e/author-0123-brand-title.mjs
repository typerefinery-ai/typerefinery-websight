/**
 * docs/issues/0123 (Act 1 wireframe) — investor-critique fix #1, "the cheapest credibility point":
 * the sidebar brand reads "OS-Triage Wireframe"; the docx mockup (image2.png) brands the product
 * "OS-Triage". The title lives ONCE, in the aside reference target shared by every os-triage page
 * (found by walking the rendered component ids back through the root's aside reference), so this
 * single property edit fixes the brand on all five Acts' screens:
 *
 *   /content/.../os-triage/admin/asideleft/default/jcr:content/container/nav/title  @title
 *
 * Sling POST on /content is 405 here — property edits go through the project's
 * component-property servlet (same pattern as author-promote-host-event.mjs).
 *
 *     node e2e/author-0123-brand-title.mjs            # report only
 *     node e2e/author-0123-brand-title.mjs --apply
 */
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// The second node is the os-triage ROOT landing page's welcome heading — same credibility gap,
// same one-property fix.
const TARGETS = [
  {
    node: '/content/typerefinery-showcase/pages/os-triage/admin/asideleft/default/jcr:content/container/nav/title',
    want: 'OS-Triage',
  },
  {
    node: '/content/typerefinery-showcase/pages/os-triage/jcr:content/rootcontainer/container1/title',
    want: 'Welcome to OS-Triage',
  },
]

const APPLY = process.argv.includes('--apply')
let fails = 0

for (const { node, want } of TARGETS) {
  const before = await (await fetch(`${CMS}${node}.json`, { headers: { Authorization: auth } })).json()
  console.log(`\n${node.split('/os-triage')[1]}\n  current: ${JSON.stringify(before.title)} (id ${before.id})`)

  if (before.title === want) {
    console.log('  already correct — nothing to do')
    continue
  }
  if (!APPLY) {
    console.log(`  ~ would set title -> ${JSON.stringify(want)}  (report only — pass --apply)`)
    continue
  }

  const res = await fetch(PROP_SERVLET, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ path: node, name: 'title', value: want }),
  })
  console.log(`  set title -> ${res.status}`)

  // A 200 from the servlet is not evidence the property landed (docs/issues/0057) — read it back.
  const after = await (await fetch(`${CMS}${node}.json`, { headers: { Authorization: auth } })).json()
  console.log(`  read back: ${JSON.stringify(after.title)}`)
  if (after.title !== want) { console.log('  FAIL — title did not land'); fails++ }
  else console.log('  OK')
}
process.exit(fails ? 1 : 0)
