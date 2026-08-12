/**
 * docs/issues/0151 — apply docs/issues/0053's fix to the two Overview flows, which never received it.
 *
 * 0053 (Resolved 2026-08-05, "A single node without a `references` key raises KeyError and empties
 * the ENTIRE unattached view") fixed exactly this in the Composer's `Unattached - Split` flow:
 *
 *     # 0053: one node without "references" used to raise KeyError and take the ENTIRE
 *     references = node.get("references") or {}
 *     if "references" not in node:
 *         print("[unattached-split] node " + str(node.get("id")) + " has no references key; ...")
 *
 * The same unguarded `references = node["references"]` was left in BOTH Overview flows, so Act 2
 * still fails the way Act 3 no longer can. That is what docs/issues/0151 measured: 2 of 91 node
 * objects lacked the key, and `/viz-data/overview-default-incident` returned an error envelope with
 * an empty graph — for every incident, not just the offending object.
 *
 *   f1kzb9001xs51d / im7cs30iz   Overview - Get Default Incident & Objects  (serves the failing route)
 *   f1kutl001ts51d / im7cpfumk   Overview - Get Incident & Objects
 *
 * This copies 0053's shape rather than inventing one, so all three read alike.
 *
 * ⚠️ 0072 DISCIPLINE — writes BOTH the runtime design and the provisioning source. The audit reports
 * these two nodes as "source ahead" (source is longer), so the anchor is applied to each copy
 * INDEPENDENTLY and a miss is reported rather than guessed at.
 * ⚠️ ASCII only — non-ASCII in a flow algorithm has bitten this project before.
 *
 *     node e2e/fix-overview-references-guard.mjs            # report only
 *     node e2e/fix-overview-references-guard.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const FASTAPI = process.env.FASTAPI_BASE || 'http://localhost:8000'
const SOURCE_DB = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database/demo/database.json')
const APPLY = process.argv.includes('--apply')

const TARGETS = [
  { flow: 'f1kzb9001xs51d', node: 'im7cs30iz', what: 'Overview - Get Default Incident & Objects' },
  { flow: 'f1kutl001ts51d', node: 'im7cpfumk', what: 'Overview - Get Incident & Objects' },
]

const FROM = `        references = node["references"]\n`
const TO =
  `        # alpha-launch docs/issues/0151, applying docs/issues/0053's fix: one node without\n` +
  `        # "references" raised KeyError here and took the ENTIRE graph with it, so Act 2 rendered\n` +
  `        # nothing at all rather than losing one object. Fail OPEN on the object, and keep the log\n` +
  `        # so the write path that omits the key is still findable.\n` +
  `        references = node.get("references") or {}\n` +
  `        if "references" not in node:\n` +
  `            print("[overview] node " + str(node.get("id")) + " has no references key; treating as none")\n`

const nonAscii = [...TO].filter((c) => c.charCodeAt(0) > 127)
if (nonAscii.length) {
  console.error(`FAIL - replacement contains non-ASCII: ${JSON.stringify(nonAscii.join(''))}`)
  process.exit(1)
}

const applyTo = (code, label) => {
  if (code.includes('node.get("references")')) return { code, note: 'already guarded' }
  if (!code.includes(FROM)) return { code, note: 'ANCHOR NOT FOUND - left unchanged' }
  return { code: code.replace(FROM, TO), note: APPLY ? 'applied' : 'would apply' }
}

const db = JSON.parse(fs.readFileSync(SOURCE_DB, 'utf8'))
const designs = {}
let anyChange = false

for (const t of TARGETS) {
  console.log(`\n${t.what}  (${t.flow} / ${t.node})`)

  const design = await (await fetch(`${FASTAPI}/flow/${t.flow}/design`)).json()
  const rNode = design[t.node]
  if (!rNode?.config?.algorithm) {
    console.log('  runtime: node or algorithm not found')
  } else {
    const r = applyTo(rNode.config.algorithm, 'runtime')
    console.log(`  runtime : ${r.note} (${rNode.config.algorithm.length} chars)`)
    if (r.note.startsWith('applied') || r.note.startsWith('would')) {
      rNode.config.algorithm = r.code
      designs[t.flow] = design
      anyChange = true
    }
  }

  const sFlow = db[t.flow]
  const sNode = sFlow?.design?.[t.node]
  if (!sNode?.config?.algorithm) {
    console.log('  source  : node or algorithm not found')
  } else {
    const s = applyTo(sNode.config.algorithm, 'source')
    console.log(`  source  : ${s.note} (${sNode.config.algorithm.length} chars)`)
    if (s.note.startsWith('applied') || s.note.startsWith('would')) {
      sNode.config.algorithm = s.code
      anyChange = true
    }
  }
}

if (!APPLY) {
  console.log('\ndry run - nothing written. Re-run with --apply.')
  process.exit(0)
}
if (!anyChange) {
  console.log('\nnothing to write.')
  process.exit(0)
}

for (const [flowId, design] of Object.entries(designs)) {
  const res = await fetch(`${FASTAPI}/flow/${flowId}/design/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(design),
  })
  console.log(`\nruntime design/save ${flowId} -> ${res.status}`)
  if (!res.ok) {
    console.error('FAIL - runtime save rejected; source left unwritten')
    process.exit(1)
  }
}
fs.writeFileSync(SOURCE_DB, JSON.stringify(db, null, '\t'))
console.log(`source written: ${SOURCE_DB}`)
