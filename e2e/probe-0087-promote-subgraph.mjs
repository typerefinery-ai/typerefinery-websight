import fs from 'fs'
import path from 'path'

const BASE = 'typerefinery/services/fastapi/generated/os-triage/context_mem'
const id = process.argv[2]
const cm = JSON.parse(fs.readFileSync(path.join(BASE, 'context_map.json'), 'utf8'))
const dir = path.join(BASE, cm.current_incident)
const unPath = path.join(dir, 'unattached_objs.json')
const un = () => JSON.parse(fs.readFileSync(unPath, 'utf8'))

// Warm the route first - a cold call 503s while the flow still runs, which is what made the
// earlier measurements incoherent (docs/issues/0087).
const warm = await fetch('http://localhost:8111/os-triage/promote-subgraph', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({}),
})
console.log(`warm-up POST {} -> ${warm.status} (refused early by mapreq, no mutation)`)

const before = un()
const beforeIds = new Set(before.map((n) => n.id))
const target = before.find((n) => n.id === id)
if (!target) throw new Error(`${id} not in unattached`)
console.log(`before: ${before.length} objects`)

const res = await fetch('http://localhost:8111/os-triage/promote-subgraph', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id }),
})
console.log(`promote ${id.slice(0, 34)} -> ${res.status}`)

const after = un()
const afterIds = new Set(after.map((n) => n.id))
const removed = [...beforeIds].filter((x) => !afterIds.has(x))
const added = [...afterIds].filter((x) => !beforeIds.has(x))

console.log(`after : ${after.length} objects`)
console.log('')
console.log(`removed ${removed.length}:`)
for (const r of removed) {
  const n = before.find((x) => x.id === r)
  console.log(`   ${r === id ? '>> TARGET  ' : '   collateral '} ${r}  (${n ? n.type : '?'})`)
}
if (added.length) console.log(`added ${added.length}: ${added.join(', ')}`)
console.log('')
console.log(`ONLY the target removed: ${removed.length === 1 && removed[0] === id ? 'YES' : 'NO'}`)
