/**
 * Compare two `/viz-data/*` payloads for EQUIVALENCE, not byte-identity.
 *
 * docs/issues/0064. Option 2a's acceptance test is recorded as "byte-identical output", and that
 * worked for `composer-options`. It does **not** work for `unattached-split`: three consecutive
 * fetches of an unchanged route produced **three distinct hashes at identical length** — the node
 * ORDER varies run to run (Python dict/set iteration or file-read order).
 *
 * ⚠️ So "byte-identical" would fail an algorithm edit that changed nothing, and a naive fix — sorting
 * before comparing — could hide a real change if it sorted away a duplicate or an ordering the client
 * depends on. This compares the multiset: every node and edge by id, with its full content, plus the
 * counts, so a lost or duplicated object is caught while a reshuffle is not.
 *
 *     node e2e/compare-vizdata-payload.mjs <before.json> <after.json>
 */
import fs from 'fs'

const [a, b] = process.argv.slice(2)
if (!a || !b) { console.error('usage: compare-vizdata-payload.mjs <before.json> <after.json>'); process.exit(2) }

const load = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const canon = (v) => JSON.stringify(v, Object.keys(v || {}).sort ? undefined : undefined)

/** Stable key for an object: its id if it has one, else its whole canonical content. */
const keyOf = (o) => (o && (o.id || o.original?.id)) || JSON.stringify(o)

/** Deep-sort object keys so key order never counts as a difference. */
const sortKeys = (v) => {
  if (Array.isArray(v)) return v.map(sortKeys)
  if (v && typeof v === 'object') {
    const out = {}
    for (const k of Object.keys(v).sort()) out[k] = sortKeys(v[k])
    return out
  }
  return v
}

const bag = (arr) => {
  const m = new Map()
  for (const o of arr || []) {
    const k = keyOf(o)
    m.set(k, (m.get(k) || []).concat([JSON.stringify(sortKeys(o))]))
  }
  return m
}

const compareBag = (label, A, B, diffs) => {
  const ba = bag(A), bb = bag(B)
  for (const [k, va] of ba) {
    const vb = bb.get(k)
    if (!vb) { diffs.push(`${label}: ${k} present BEFORE, missing AFTER`); continue }
    if (va.length !== vb.length) diffs.push(`${label}: ${k} count ${va.length} -> ${vb.length}`)
    else {
      const sa = [...va].sort().join('|'), sb = [...vb].sort().join('|')
      if (sa !== sb) diffs.push(`${label}: ${k} CONTENT differs`)
    }
  }
  for (const k of bb.keys()) if (!ba.has(k)) diffs.push(`${label}: ${k} present AFTER, missing BEFORE`)
}

const A = load(a), B = load(b)
const diffs = []

/** Walk both payloads' pane structures generically — promo/scratch/nodes/edges/links. */
const panes = new Set([...Object.keys(A), ...Object.keys(B)])
for (const p of panes) {
  const pa = A[p], pb = B[p]
  if (pa && typeof pa === 'object' && !Array.isArray(pa)) {
    for (const coll of new Set([...Object.keys(pa || {}), ...Object.keys(pb || {})])) {
      if (Array.isArray(pa?.[coll]) || Array.isArray(pb?.[coll])) compareBag(`${p}.${coll}`, pa?.[coll], pb?.[coll], diffs)
    }
  } else if (Array.isArray(pa) || Array.isArray(pb)) {
    compareBag(p, pa, pb, diffs)
  }
}

const count = (o) => {
  const out = {}
  for (const [k, v] of Object.entries(o || {})) {
    if (Array.isArray(v)) out[k] = v.length
    else if (v && typeof v === 'object') for (const [k2, v2] of Object.entries(v)) if (Array.isArray(v2)) out[`${k}.${k2}`] = v2.length
  }
  return out
}
console.log('before:', JSON.stringify(count(A)))
console.log('after :', JSON.stringify(count(B)))

if (!diffs.length) {
  console.log('\n✅ EQUIVALENT — same objects, same content, order aside')
  process.exit(0)
}
console.log(`\n🚩 ${diffs.length} difference(s):`)
for (const d of diffs.slice(0, 30)) console.log(`   ${d}`)
if (diffs.length > 30) console.log(`   …and ${diffs.length - 30} more`)
process.exitCode = 1
