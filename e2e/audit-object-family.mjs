import fs from 'fs'
import path from 'path'

const base = 'typerefinery/services/fastapi/generated/os-triage/context_mem'
const cm = JSON.parse(fs.readFileSync(path.join(base, 'context_map.json'), 'utf8'))

// Across ALL incidents, not just the current one - is the disagreement systemic?
const incidents = fs
  .readdirSync(base)
  .filter((d) => d.startsWith('incident--') && fs.statSync(path.join(base, d)).isDirectory())

const byFamily = {}
const perId = new Map() // id -> Map(family -> Set(files))
let files = 0

for (const inc of incidents) {
  const dir = path.join(base, inc)
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue
    let d
    try {
      d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
    } catch {
      continue
    }
    files++
    const list = Array.isArray(d) ? d : [d]
    for (const n of list) {
      if (!n || !n.id || !n.object_family) continue
      const fam = `${n.object_family}/${n.object_group}`
      byFamily[n.object_family] = (byFamily[n.object_family] || 0) + 1
      if (!perId.has(n.id)) perId.set(n.id, new Map())
      const m = perId.get(n.id)
      if (!m.has(fam)) m.set(fam, new Set())
      m.get(fam).add(`${inc.slice(0, 18)}…/${f}`)
    }
  }
}

console.log(`incidents scanned: ${incidents.length} | json files read: ${files}`)
console.log(`object_family values seen:`, JSON.stringify(byFamily))

const conflicts = [...perId.entries()].filter(([, m]) => m.size > 1)
console.log(`\nobjects stored with CONFLICTING object_family: ${conflicts.length} of ${perId.size}`)
for (const [id, m] of conflicts.slice(0, 8)) {
  console.log(`  ${id.slice(0, 46)}`)
  for (const [fam, where] of m) console.log(`     ${fam.padEnd(28)} <- ${[...where].slice(0, 2).join(', ')}`)
}

// Which types ever carry os-threat-forms?
const osThreatTypes = new Set()
for (const [, m] of perId) for (const fam of m.keys()) if (fam.startsWith('os-threat-forms')) osThreatTypes.add(fam)
console.log(`\nos-threat-forms variants in use:`, [...osThreatTypes].join(', ') || '(none)')
