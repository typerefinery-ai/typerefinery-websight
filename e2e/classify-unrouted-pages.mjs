/**
 * docs/issues/0046 — what are the four unclassified top-level form pages, and can they be routed?
 *
 * `addtask`, `artifact`, `add-email-address` and `identity` sit outside the
 * `sdo-forms`/`sco-forms`/`sro-forms` folder convention, so the STIX family and type cannot be
 * derived from the path the way the other 41 can. Read what they actually render instead: the field
 * names give the type away, and the flow template says whether they are forms at all.
 *
 *     node e2e/classify-unrouted-pages.mjs
 */
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const ROOT = '/content/typerefinery-showcase/pages/os-triage/forms'
const PAGES = ['addtask', 'artifact', 'add-email-address', 'identity']

for (const page of PAGES) {
  console.log(`\n=== ${page}`)
  const html = await (await fetch(`${CMS}${ROOT}/${page}.html`, { headers: { Authorization: auth } })).text()
  const names = [...new Set([...html.matchAll(/name="([^"]+)"/g)].map((m) => m[1].trim()))]
    .filter((n) => !/^(button|container|form)_?\d*$/.test(n))
  const heading = (html.match(/<h1[^>]*>([^<]{2,60})</i) || [])[1]
  const submit = /type="submit"|Create|Save/i.test(html)

  console.log(`   heading: ${heading ? heading.trim() : '(none)'}`)
  console.log(`   fields (${names.length}): ${names.slice(0, 14).join(', ')}`)
  console.log(`   has a submit affordance: ${submit}`)

  // The flow template on the form node says which service it would be provisioned against.
  const nodeUrl = `${CMS}${ROOT}/${page}.infinity.json`
  try {
    const j = await (await fetch(nodeUrl, { headers: { Authorization: auth } })).json()
    const found = []
    const walk = (o) => {
      for (const [k, v] of Object.entries(o || {})) {
        if (v && typeof v === 'object') {
          if (v.flowapi_template) found.push(String(v.flowapi_template).split('/').pop())
          walk(v)
        }
      }
    }
    walk(j)
    console.log(`   flowapi_template: ${found.length ? [...new Set(found)].join(', ') : '(none found at this depth)'}`)
  } catch (e) {
    console.log(`   flowapi_template: unreadable (${e.message})`)
  }
}
