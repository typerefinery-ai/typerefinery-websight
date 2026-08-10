/**
 * decision 0013 Option 1 — stop the content package from re-introducing Flow-managed ids.
 *
 * `audit-content-divergence.mjs` found 18 nodes whose repo copy carries a `flowapi_flowstreamid`
 * that the **running instance deliberately does not have**: Flow provisioning splits its managed
 * properties out to `/var/typerefinery/flow/…`. Deploying the package therefore re-adds a binding
 * the runtime removed, which is what breaks it (docs/issues/0042).
 *
 * This removes the attribute from exactly those nodes and leaves the 30 `SAME` nodes alone — they
 * agree with live and are not the hazard.
 *
 *     node e2e/audit-content-divergence.mjs      # produces audit-content-divergence.json
 *     node e2e/strip-flow-managed-ids.mjs --apply
 *
 * Without `--apply` it prints what it would do and changes nothing.
 */
import fs from 'fs'
import path from 'path'

const APPLY = process.argv.includes('--apply')
const AUDIT = 'audit-content-divergence.json'
const ROOT = path.resolve('tests/content/src/main/content/jcr_root/content/typerefinery-showcase')

if (!fs.existsSync(AUDIT)) {
  console.error(`no ${AUDIT} — run: node e2e/audit-content-divergence.mjs`)
  process.exit(1)
}

const { diverged } = JSON.parse(fs.readFileSync(AUDIT, 'utf8'))
const targets = diverged.filter((d) => d.verdict === 'PROP-ABSENT')
console.log(`${targets.length} node(s) carry an id the runtime does not\n`)

/** /content/typerefinery-showcase/<page path>/jcr:content/... -> the .content.xml that holds it */
function fileFor(nodePath) {
  const rel = nodePath.replace('/content/typerefinery-showcase', '').replace(/^\//, '')
  const parts = rel.split('/')
  // Everything before the first jcr:content is directory structure on disk.
  const cut = parts.indexOf('jcr:content')
  const dirParts = cut === -1 ? parts : parts.slice(0, cut)
  return path.join(ROOT, ...dirParts, '.content.xml')
}

const byFile = new Map()
for (const t of targets) {
  const f = fileFor(t.nodePath)
  if (!byFile.has(f)) byFile.set(f, [])
  byFile.get(f).push(t)
}

let removed = 0
let filesTouched = 0
for (const [file, nodes] of byFile) {
  if (!fs.existsSync(file)) {
    console.log(`  MISSING FILE ${file}`)
    continue
  }
  let xml = fs.readFileSync(file, 'utf8')
  const before = xml
  for (const n of nodes) {
    // The attribute is usually alone on its own line in these pretty-printed files; handle the
    // inline form too. Only ever remove this one attribute — never a whole element.
    const lineForm = new RegExp(`^[ \\t]*flowapi_flowstreamid="${n.repoId}"[ \\t]*\\r?\\n`, 'm')
    const inlineForm = new RegExp(`[ \\t]*flowapi_flowstreamid="${n.repoId}"`)
    if (lineForm.test(xml)) {
      xml = xml.replace(lineForm, '')
      removed++
    } else if (inlineForm.test(xml)) {
      xml = xml.replace(inlineForm, '')
      removed++
    } else {
      console.log(`  NOT FOUND in file: ${n.repoId}  (${n.nodePath})`)
      continue
    }
    console.log(`  strip ${n.repoId}  ${n.nodePath.replace('/content/typerefinery-showcase', '…')}`)
  }
  if (xml !== before) {
    filesTouched++
    if (APPLY) fs.writeFileSync(file, xml)
  }
}

console.log(
  `\n${APPLY ? 'REMOVED' : 'would remove'} ${removed} attribute(s) across ${filesTouched} file(s)`,
)
if (!APPLY) console.log('(dry run — pass --apply to write)')
