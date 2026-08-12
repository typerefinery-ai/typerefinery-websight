/**
 * docs/issues/0076 — what accumulates across a full run to make steps fail that pass alone?
 *
 * Four steps now show the shape (P3-S5, P3-S7, P3-S9, P5-S4) across two Acts, so "Act 3 drains
 * Scratch" is too narrow a framing. This snapshots the shared state the suite mutates, so the
 * *direction and size* of the drift is measured rather than guessed:
 *
 *   incidents            — P1-S5 creates one per run
 *   current_incident     — P1-S7 switches it; Act 1 teardown restores it
 *   promo / scratch      — creating an SRO reclassifies a Scratch object (0051)
 *   overview nodes/edges — what Act 2 renders
 *   unattached objects   — the pool Act 3 and Act 5 draw from
 *
 *     node e2e/probe-0076-what-accumulates.mjs snapshot          # print one snapshot
 *     node e2e/probe-0076-what-accumulates.mjs diff <a.json> <b.json>
 */
import fs from 'fs'

const FLOW = process.env.FLOW_BASE || 'http://localhost:8111'

const get = async (path) => {
  try {
    const res = await fetch(`${FLOW}${path}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export const snapshot = async () => {
  const [table, split, overview] = await Promise.all([
    get('/viz-data/table-all-incidents-shaped'),
    get('/viz-data/unattached-split'),
    get('/viz-data/overview-default-incident'),
  ])
  const rows = table?.data ?? []
  return {
    incidents: rows.length,
    incidentNames: rows.map((r) => String(r.name ?? '')).sort(),
    promo: split?.promo?.nodes?.length ?? -1,
    scratch: split?.scratch?.nodes?.length ?? -1,
    // ⚠️ An error envelope answers 200 (docs/issues/0142), so treat a missing nodes array as -1
    // rather than 0 — "the call failed" and "the graph is empty" are different findings.
    overviewNodes: overview?.nodes?.length ?? -1,
    overviewEdges: overview?.edges?.length ?? -1,
  }
}

const fmt = (s) =>
  `incidents=${s.incidents} promo=${s.promo} scratch=${s.scratch} overview=${s.overviewNodes}n/${s.overviewEdges}e`

const mode = process.argv[2] || 'snapshot'

if (mode === 'snapshot') {
  const s = await snapshot()
  const out = process.argv[3]
  if (out) fs.writeFileSync(out, JSON.stringify(s, null, 1))
  console.log(fmt(s))
} else if (mode === 'diff') {
  const a = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'))
  const b = JSON.parse(fs.readFileSync(process.argv[4], 'utf8'))
  const delta = (k) => {
    const d = b[k] - a[k]
    return d === 0 ? '  ·  ' : (d > 0 ? '+' : '') + d
  }
  console.log(`  before : ${fmt(a)}`)
  console.log(`  after  : ${fmt(b)}`)
  console.log(
    `  delta  : incidents ${delta('incidents')}  promo ${delta('promo')}  scratch ${delta('scratch')}  overviewNodes ${delta('overviewNodes')}  overviewEdges ${delta('overviewEdges')}`,
  )
  const added = b.incidentNames.filter((n) => !a.incidentNames.includes(n))
  const removed = a.incidentNames.filter((n) => !b.incidentNames.includes(n))
  if (added.length) console.log(`  incidents ADDED  : ${added.map((n) => JSON.stringify(n)).join(', ')}`)
  if (removed.length) console.log(`  incidents REMOVED: ${removed.map((n) => JSON.stringify(n)).join(', ')}`)
}
