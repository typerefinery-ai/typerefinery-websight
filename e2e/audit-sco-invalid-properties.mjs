/**
 * alpha-launch 0075 — are there other stored objects that cannot be parsed as STIX?
 *
 * A cyber-observable (SCO) in STIX 2.1 may carry only: type, id, spec_version, object_marking_refs,
 * granular_markings, defanged, extensions, plus its own type-specific properties. The SDO common
 * properties are NOT allowed, and stix2 raises ExtraPropertiesError on them — which is what took out
 * get-connection-types in 0074:
 *
 *     stix2.exceptions.ExtraPropertiesError: Unexpected properties for UserAccount: (created_by_ref)
 *
 * 0075 assumed the rest of the data was clean but never checked. This checks, read-only, across every
 * incident context.
 */
import fs from 'fs'
import path from 'path'

const ROOT = 'typerefinery/services/fastapi/generated/os-triage/context_mem'

const SCO_TYPES = new Set([
  'artifact', 'autonomous-system', 'directory', 'domain-name', 'email-addr', 'email-message', 'file',
  'ipv4-addr', 'ipv6-addr', 'mac-addr', 'mutex', 'network-traffic', 'process', 'software', 'url',
  'user-account', 'windows-registry-key', 'x509-certificate',
])

// SDO-only common properties. stix2 rejects each of these on an SCO.
const SDO_ONLY = ['created_by_ref', 'created', 'modified', 'revoked', 'labels', 'confidence', 'lang', 'external_references']

const findings = []
let objectsSeen = 0
let scosSeen = 0

const inspect = (obj, where) => {
  if (!obj || typeof obj !== 'object' || typeof obj.id !== 'string') return
  objectsSeen++
  const type = obj.type || obj.id.split('--')[0]
  if (!SCO_TYPES.has(type)) return
  scosSeen++
  const bad = SDO_ONLY.filter((p) => obj[p] !== undefined)
  if (bad.length) findings.push({ where, id: obj.id, type, bad })
}

const walk = (value, where) => {
  if (Array.isArray(value)) {
    for (const v of value) walk(v, where)
  } else if (value && typeof value === 'object') {
    inspect(value, where)
    if (value.original) inspect(value.original, where)
  }
}

const dirs = fs.readdirSync(ROOT).filter((d) => {
  try {
    return fs.statSync(path.join(ROOT, d)).isDirectory()
  } catch {
    return false
  }
})

for (const d of dirs) {
  for (const f of fs.readdirSync(path.join(ROOT, d)).filter((x) => x.endsWith('.json'))) {
    const p = path.join(d, f)
    let json
    try {
      json = JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'))
    } catch {
      continue
    }
    walk(json, p)
  }
}

console.log(`scanned ${dirs.length} context directories`)
console.log(`objects inspected: ${objectsSeen}   of which SCOs: ${scosSeen}`)
console.log(`SCOs carrying SDO-only properties: ${findings.length}`)

if (findings.length) {
  console.log()
  const byProp = {}
  for (const f of findings) for (const b of f.bad) byProp[b] = (byProp[b] || 0) + 1
  console.log('by property:', JSON.stringify(byProp))
  console.log()
  for (const f of findings.slice(0, 25)) {
    console.log(`  ${f.id.slice(0, 46).padEnd(48)} ${f.bad.join(',')}`)
    console.log(`      ${f.where}`)
  }
  if (findings.length > 25) console.log(`  … ${findings.length - 25} more`)
  process.exitCode = 1
} else {
  console.log('\nno invalid SCOs found')
}
