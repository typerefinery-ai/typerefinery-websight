/**
 * Read a JCR subtree from the running CMS as JSON, completely.
 *
 * Extracted from `audit-package-vs-live-content.mjs` (docs/issues/0194) so the authoring tool can
 * export exactly what the audit will later compare. Reimplementing it is not an option — a naive
 * `.10.json` fetch silently loses everything below level 10, which showed up immediately as **11
 * live-only nodes** on a page that had just been exported.
 *
 * Two Sling depth traps, both hit by this audit (the .infinity.json vacuous-walk family):
 *  1. A too-deep selector answers **HTTP 300** with a paging array — `res.ok` is false, so a
 *     naive fetcher reports the page "missing" (which silently excluded the 16 biggest form
 *     pages, identity/indicator/task among them, from the first sizing run).
 *  2. A depth-N answer TRUNCATES SILENTLY below level N — nodes deeper than N simply vanish
 *     with no marker (identity-update's external-reference labels sit at level 14).
 * Fix: fetch at a workable depth, then re-fetch every node sitting AT the depth boundary —
 * those are the only nodes whose children could have been dropped.
 */
export const makeLiveJsonDeep = (CMS, auth) => {
  const liveJsonDeep = async (nodePath, depth = 10) => {
    const res = await fetch(`${CMS}${nodePath}.${depth}.json`, { headers: { Authorization: auth } })
    const j = await res.json().catch(() => null)
    if (!j) return null
    if (Array.isArray(j)) {
      // paging array (HTTP 300): node itself too big at this depth — take it shallow, recurse children
      const shallow = await (await fetch(`${CMS}${nodePath}.1.json`, { headers: { Authorization: auth } })).json().catch(() => null)
      if (!shallow || Array.isArray(shallow)) return null
      for (const [k, v] of Object.entries(shallow)) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          const child = await liveJsonDeep(`${nodePath}/${encodeURIComponent(k)}`, depth)
          if (child) shallow[k] = child
        }
      }
      return shallow
    }
    // re-fetch boundary nodes (at exactly `depth` levels down) — their children may be truncated
    const refetch = async (node, subPath, level) => {
      for (const [k, v] of Object.entries(node)) {
        if (!v || typeof v !== 'object' || Array.isArray(v)) continue
        if (level + 1 >= depth) {
          const full = await liveJsonDeep(`${nodePath}${subPath}/${encodeURIComponent(k)}`, depth)
          if (full) node[k] = full
        } else await refetch(v, `${subPath}/${encodeURIComponent(k)}`, level + 1)
      }
    }
    await refetch(j, '', 0)
    return j
  }
  return liveJsonDeep
}
