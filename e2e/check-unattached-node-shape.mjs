/**
 * docs/issues/0053 — does any node in the unattached stores lack the `references` key?
 *
 * One such node raised `KeyError: 'references'` and emptied all three Composer panes. The guard
 * contains it and logs the offending id, but the writer was never identified. This reports the
 * current shape of every store so a recurrence can be attributed rather than guessed at.
 *
 *     node e2e/check-unattached-node-shape.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const CTX = path.resolve(HERE, '../../typerefinery/services/fastapi/generated/os-triage/context_mem')

const stores = []
for (const dir of fs.readdirSync(CTX)) {
  const full = path.join(CTX, dir)
  if (!fs.statSync(full).isDirectory()) continue
  for (const file of ['unattached_objs.json', 'unattached_relation.json']) {
    const p = path.join(full, file)
    if (fs.existsSync(p)) stores.push({ incident: dir, file, path: p })
  }
}

let missing = 0
let total = 0
for (const s of stores) {
  let data
  try {
    data = JSON.parse(fs.readFileSync(s.path, 'utf8'))
  } catch (e) {
    console.log(`  UNREADABLE ${s.incident}/${s.file}: ${e.message}`)
    continue
  }
  const nodes = Array.isArray(data) ? data : data.nodes || []
  const without = nodes.filter((n) => n && typeof n === 'object' && !('references' in n))
  total += nodes.length
  missing += without.length
  const flag = without.length ? '⚠️ ' : '   '
  console.log(`${flag}${s.incident.slice(0, 22)}… ${s.file.padEnd(26)} ${String(nodes.length).padStart(3)} nodes, ${without.length} without references`)
  for (const n of without.slice(0, 5)) {
    console.log(`      ${n.id || '(no id)'}  keys: ${Object.keys(n).join(', ')}`)
  }
}

console.log(`\n${total} nodes across ${stores.length} stores; ${missing} without a "references" key`)
// unattached_relation.json legitimately lacks the key — the 0050 merge uses setdefault for exactly
// that reason. Only unattached_objs.json is expected to carry it.
process.exitCode = 0
