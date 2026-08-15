/**
 * docs/issues/0183 follow-up 1 — shared route-conflict detection for the runtime→provisioning
 * sync scripts. The 0095 syncs key "runtime-only" on FLOW ID, but flow ids are re-minted per
 * import, so the runtime's evolved copy of an old flow looks "new" and gets ADDED beside its
 * stale unpaused ancestor — which is exactly how 0182's duplicate and 0183's 17 groups formed.
 * This module detects a candidate's inbound routes colliding with an UNPAUSED flow already in
 * the source, so the caller can pause the superseded claimant instead of shipping a race.
 */

/** Inbound route registrations only — the three route component ids. A naive `config.url` scan
 *  also counts OUTBOUND fetch nodes and wildly overcounts (docs/issues/0183: 64 vs 17). */
export const ROUTE_COMPONENTS = new Set(['cfbhsf66dd', 'c71gcc7fd3', 'cysfdf35fb'])

/** `["POST /stix-orm/utils/connections", …]` for one flow entry. */
export function inboundRoutes(flow) {
  const out = []
  for (const node of Object.values(flow?.design || {})) {
    if (!node || !ROUTE_COMPONENTS.has(node.component)) continue
    const cfg = node.config || {}
    if (cfg.url && cfg.method && 'response' in cfg) out.push(`${cfg.method} ${cfg.url}`)
  }
  return out
}

/**
 * For each candidate id (from the runtime DB), find UNPAUSED source flows (other ids) already
 * claiming any of its inbound routes. Returns { candidateId: [{ id, name, routes }] } for the
 * conflicted candidates only.
 */
export function findRouteConflicts(candidateIds, runtime, source) {
  const claimants = {}
  for (const [id, flow] of Object.entries(source)) {
    if (id === 'variables' || !flow || !flow.design || flow.paused) continue
    for (const route of inboundRoutes(flow)) (claimants[route] = claimants[route] || []).push(id)
  }
  const conflicts = {}
  for (const cid of candidateIds) {
    const hits = new Map()
    for (const route of inboundRoutes(runtime[cid])) {
      for (const sid of claimants[route] || []) {
        if (sid === cid) continue
        if (!hits.has(sid)) hits.set(sid, { id: sid, name: source[sid].name || sid, routes: [] })
        hits.get(sid).routes.push(route)
      }
    }
    if (hits.size) conflicts[cid] = [...hits.values()]
  }
  return conflicts
}
