/**
 * docs/issues/0042 — how far has the checked-in content package drifted from the running CMS?
 *
 * 0042 recorded ONE case: the Incidents table's `flowapi_flowstreamid` is `f1kgsp030mi50d` in the
 * repo and `f210iy001bt51d` live, so deploying the package would repoint Act 1's data path at a
 * flow that is not serving it. That was found by hand while looking for something else, which
 * means the number of *other* diverged nodes was never known — and "the package is unsafe to
 * deploy" is not actionable without the list.
 *
 * This walks every `.content.xml` under the showcase that carries a `flowapi_flowstreamid`,
 * resolves the matching live node, and reports one of:
 *
 *   SAME     — repo and live agree; deploying this node is safe
 *   DIVERGED — both have a value and they differ; deploying would repoint it   <-- the dangerous set
 *   LIVE-ONLY— the node exists live with an id the repo does not carry
 *   MISSING  — the node is not in the running instance at all
 *
 * ⚠️ Reads only. It never writes to the CMS.
 *
 *     node e2e/audit-content-divergence.mjs [--verbose]
 */
import fs from 'fs'
import path from 'path'

const BASE = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
const ROOT = path.resolve(
  'tests/content/src/main/content/jcr_root/content/typerefinery-showcase',
)
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const VERBOSE = process.argv.includes('--verbose')

/** Every `.content.xml` under the showcase, recursively. */
function contentFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) contentFiles(full, out)
    else if (entry.name === '.content.xml') out.push(full)
  }
  return out
}

/**
 * A `.content.xml` holds a whole **subtree**, so a node's live path is its full chain of ancestors,
 * not just its own tag.
 *
 * ⚠️ A flat "tag name = direct child" reading reported **all 66 nodes MISSING** — which contradicted
 * 0042's own known-live case and was the signal the extractor, not the package, was wrong. The real
 * shape is `jcr:root > jcr:content > rootcontainer > … > table`, several levels deep.
 *
 * Tracks the element stack: `<x …>` pushes, `<x … />` does not, `</x>` pops. `jcr:root` is the
 * file's own node and contributes nothing to the path.
 */
function idsIn(xml) {
  const found = []
  const stack = []
  for (const m of xml.matchAll(/<(\/?)([\w:.\-_]+)((?:[^>"]|"[^"]*")*?)(\/?)>/g)) {
    const [, closing, tag, attrs, selfClose] = m
    if (closing) {
      stack.pop()
      continue
    }
    if (tag.startsWith('?') || tag.startsWith('!')) continue
    const id = (attrs.match(/flowapi_flowstreamid="([^"]*)"/) || [])[1]
    const chain = [...stack, tag].filter((t) => t !== 'jcr:root')
    if (id) found.push({ chain, id })
    if (!selfClose) stack.push(tag)
  }
  return found
}

const files = contentFiles(ROOT)
const rows = []

for (const file of files) {
  const xml = fs.readFileSync(file, 'utf8')
  const ids = idsIn(xml)
  if (!ids.length) continue

  // jcr_root/content/typerefinery-showcase/<rest>/.content.xml  ->  /content/typerefinery-showcase/<rest>
  const rel = path.relative(ROOT, path.dirname(file)).split(path.sep).join('/')
  const jcrPath = `/content/typerefinery-showcase${rel ? '/' + rel : ''}`

  for (const { chain, id } of ids) {
    const nodePath = chain.length ? `${jcrPath}/${chain.join('/')}` : jcrPath
    rows.push({ nodePath, repoId: id })
  }
}

console.log(`content nodes carrying flowapi_flowstreamid: ${rows.length}\n`)

const tally = { SAME: 0, DIVERGED: 0, 'PROP-ABSENT': 0, 'NODE-ABSENT': 0, 'REPO-EMPTY': 0, ERROR: 0 }
const diverged = []

for (const r of rows) {
  let liveId = null
  let verdict

  // ⚠️ `flowapi_flowstreamid="\0"` in the XML is an EMPTY value, not an id. Comparing it against a
  // live empty string reported 17 false DIVERGEDs on the first run.
  if (r.repoId === '\\0' || r.repoId === '' || r.repoId === '\0') {
    verdict = 'REPO-EMPTY'
  } else {
    try {
      const res = await fetch(`${BASE}${r.nodePath}.json`, { headers: { Authorization: auth } })
      if (res.ok) {
        const j = await res.json()
        liveId = j.flowapi_flowstreamid ?? null
        // ⚠️ Node present but property absent is NOT the same as node absent. 0042 records that
        // Flow-managed properties are split out to /var/typerefinery/flow/…, so this is the
        // expected state for a live-provisioned component — and it means a deploy would ADD a
        // stale id where the runtime deliberately has none.
        if (liveId === null) verdict = 'PROP-ABSENT'
        else if (liveId === r.repoId) verdict = 'SAME'
        else verdict = 'DIVERGED'
      } else if (res.status === 404) {
        verdict = 'NODE-ABSENT'
      } else {
        verdict = 'ERROR'
      }
    } catch (e) {
      verdict = 'ERROR'
    }
  }

  tally[verdict] = (tally[verdict] || 0) + 1
  if (verdict === 'DIVERGED' || verdict === 'PROP-ABSENT') diverged.push({ ...r, liveId, verdict })
  if (VERBOSE || verdict === 'DIVERGED' || verdict === 'PROP-ABSENT') {
    console.log(`  ${verdict.padEnd(11)} ${r.nodePath}`)
    console.log(`              repo ${r.repoId}  ->  live ${liveId === null ? '(none)' : liveId}`)
  }
}

console.log('\n--- tally ---')
for (const [k, v] of Object.entries(tally)) console.log(`  ${k.padEnd(9)} ${v}`)

const repointed = diverged.filter((d) => d.verdict === 'DIVERGED').length
const reintroduced = diverged.filter((d) => d.verdict === 'PROP-ABSENT').length
console.log(
  `\n⚠️  Deploying this package would REPOINT ${repointed} node(s) at a different flow, and` +
    ` RE-INTRODUCE a stale id on ${reintroduced} node(s) whose live copy deliberately has none` +
    ` (docs/issues/0042).`,
)
fs.writeFileSync('audit-content-divergence.json', JSON.stringify({ tally, diverged }, null, 1))
console.log('wrote audit-content-divergence.json')
