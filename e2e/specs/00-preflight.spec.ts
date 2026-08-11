import { expect, request } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { step, test } from '../runsheet'
import { FLOW_BASE } from '../playwright.config'

// docs/issues/0072 — the runtime flow DB is git-ignored; the provisioning source is the submodule.
const TR = path.resolve(__dirname, '../../../typerefinery/services/totaljs-flow/database')
const RUNTIME_DB = path.join(TR, 'database.json')
const SOURCE_DB = path.join(TR, 'demo/database.json')

/** Act 0 — preflight. Runsheet §0. API-level guards that later acts depend on. */

test.describe('Act 0 — preflight', () => {
  step('P0-S1', async ({}) => {
    const api = await request.newContext({ ignoreHTTPSErrors: true })
    // The ready gate reports "not ready" while optional services (nginx, keycloak,
    // openobserve…) are still waiting — those are documented as not required, so we
    // probe the services the runsheet actually names instead.
    const required: Array<[string, string]> = [
      ['traefik', 'https://cms.typerefinery.localhost:8101/'],
      ['totaljs-flow', 'http://localhost:8111/'],
      ['fastapi', 'http://localhost:8000/healthcheck'],
    ]
    for (const [name, url] of required) {
      const res = await api.get(url, { timeout: 30_000 })
      expect(res.status(), `${name} at ${url}`).toBeLessThan(400)
    }

    // The CMS must be probed with a **content** page, not `/`.
    // docs/issues/0028: when Oak's cluster lease expires it stops its own bundle and SCR
    // disposes AuthenticationSupport with it. `/` keeps returning 200 (the login page needs
    // no auth) and the Service Manager keeps reporting STARTED, but every content request
    // 503s. Probing `/` here let a 28-minute run produce 19 fake failures.
    const page = await api.get(
      'http://localhost:8113/content/typerefinery-showcase/pages/os-triage/pages/incidents.html',
      { timeout: 60_000 },
    )
    const body = page.status() === 200 ? '' : (await page.text()).slice(0, 200)
    expect(
      page.status(),
      `CMS cannot serve an authenticated content page (see docs/issues/0028) — body: ${body}`,
    ).toBe(200)
    await api.dispose()
  })

  step('P0-S2', async ({}) => {
    const api = await request.newContext({ ignoreHTTPSErrors: true })
    for (const port of [4001, 4005, 4008]) {
      const res = await api.get(`http://localhost:${port}/`, { timeout: 30_000 })
      expect(res.status(), `widget dev server :${port}`).toBeLessThan(400)
    }
    await api.dispose()
  })

  step('P0-S3', async ({}) => {
    const api = await request.newContext({ ignoreHTTPSErrors: true })
    const res = await api.get(`${FLOW_BASE}/viz-data/table-all-incidents`, { timeout: 60_000 })
    expect(res.status()).toBe(200)
    const rows = await res.json()
    expect(Array.isArray(rows), 'payload is a row array').toBeTruthy()
    expect(rows.length).toBeGreaterThan(0)
    // Guards docs/issues/0023 — the endpoint used to return the current incident duplicated.
    const ids = rows.map((r: any) => r.id)
    expect(new Set(ids).size, 'distinct incident ids').toBe(ids.length)
    await api.dispose()
  })

  step('P0-S4', async ({}) => {
    const api = await request.newContext({ ignoreHTTPSErrors: true })
    const res = await api.get(`${FLOW_BASE}/viz-data/overview-default-incident`, { timeout: 60_000 })
    expect(res.status()).toBe(200)
    const payload = await res.json()
    const nodes = payload.nodes || []
    const edges = payload.edges || []
    expect(nodes.length, 'overview nodes').toBeGreaterThan(0)
    expect(edges.length, 'overview edges').toBeGreaterThan(0)
    // Guards docs/issues/0024 — duplicate node ids left phantom nodes in d3's keyed join.
    const ids = nodes.map((n: any) => n.id)
    expect(new Set(ids).size, 'distinct node ids').toBe(ids.length)
    await api.dispose()
  })

  step('P0-S7', async ({}) => {
    // GitHub #82's own criterion is "Get API for Composer/Overview Options works properly" —
    // an API-level claim, so it is asserted at the API. docs/issues/0041.
    //
    // ⚠️ 200 is NOT sufficient. These algorithms return HTTP 200 with an `{"error":"true"}`
    // envelope when they throw (docs/issues/0026), and that is exactly how the overview half
    // failed for a day while looking healthy. Assert the payload instead.
    const api = await request.newContext({ ignoreHTTPSErrors: true })
    const expected: Record<string, string[]> = {
      // One key each side reads that a stub or an error envelope would not carry.
      'composer-options': ['tree_data', 'tree_data_default'],
      'overview-options': ['current_theme', 'api'],
    }
    for (const [route, keys] of Object.entries(expected)) {
      const res = await api.get(`${FLOW_BASE}/viz-data/${route}`, { timeout: 60_000 })
      expect(res.status(), `${route} status`).toBe(200)
      const payload = await res.json()
      expect(payload.error, `${route} returned an error envelope`).toBeFalsy()
      for (const key of keys) {
        expect(payload[key], `${route} payload is missing ${key}`).toBeDefined()
      }
    }
    await api.dispose()
  })

  step('P0-S6', async ({}) => {
    const api = await request.newContext({ ignoreHTTPSErrors: true })
    const res = await api.get(`${FLOW_BASE}/viz-data/overview-default-incident`, { timeout: 60_000 })
    const payload = await res.json()
    // "Rich enough to demo" — an incident with a handful of objects, not a bare shell.
    expect((payload.nodes || []).length, 'current incident is rich enough to demo').toBeGreaterThan(5)
    await api.dispose()
  })

  step('P0-S8', async ({}) => {
    // docs/issues/0072. The runtime flow database is git-ignored, so a fix applied with
    // /flow/{id}/design/save leaves NO trace in version control and is silently reverted by the
    // next re-provision. 0050's relationship merge sat runtime-only for days exactly this way, and
    // it took fixing 0071 to notice.
    //
    // ⚠️ Only "runtime ahead" is failed here. Source-ahead drift also exists (six flows), but that
    // direction loses nothing on a re-provision — it means the runtime is behind, which is a
    // different problem and not one preflight should block a demo for.
    const runtime = JSON.parse(fs.readFileSync(RUNTIME_DB, 'utf8'))
    const source = JSON.parse(fs.readFileSync(SOURCE_DB, 'utf8'))

    // ⚠️ Covers BOTH node bodies. This used to read `config.algorithm` only — the Python blocks —
    // so a JS `config.code` node could drift between runtime and source completely unseen. That was
    // half of how docs/issues/0149 hid: the incidents-table mapping is a `config.code` node, and it
    // sat four column additions behind its counterpart without this guard noticing. (The other half
    // was the runtime-only blind spot, closed in docs/issues/0095.)
    //
    // Measured before adding it: **0 code-node differences across all 98 common flows**, so this
    // costs nothing today and only catches what comes next — the opposite of the permanently-red
    // trap of docs/issues/0143.
    const algs = (flow: any): Record<string, string> => {
      const design = (flow && (flow.design || flow)) || {}
      const out: Record<string, string> = {}
      for (const [nodeId, node] of Object.entries<any>(design)) {
        const cfg = (node && node.config) || {}
        // Namespaced so a flow with both kinds on one node id cannot mask one with the other, and
        // so the failure message says which body drifted.
        if (typeof cfg.algorithm === 'string') out[`${nodeId} (algorithm)`] = cfg.algorithm
        if (typeof cfg.code === 'string') out[`${nodeId} (code)`] = cfg.code
      }
      return out
    }

    // The one known-and-deliberate exception: runtime and source carry the SAME algorithm under
    // DIFFERENT node ids in this flow, so a naive per-node comparison reports the runtime node as
    // "ahead" when nothing is actually at risk. The exemption is deliberately CONDITIONAL — it only
    // applies while the counterpart really is in the source. If someone deletes it, this stops
    // exempting and the guard fires, which is the point: an exemption that cannot expire is a hole.
    const NAME_CROSSED: Array<{ flow: string; runtimeNode: string; sourceNode: string; why: string }> = [
      {
        flow: 'f1fiw5002ra50d', // Composer-Tree-User
        runtimeNode: 'im0or912a',
        sourceNode: 'imlk91n23',
        why: 'runtime and source name the same node differently; the work exists in both (docs/issues/0072)',
      },
    ]
    const exempt = (flowId: string, nodeId: string, sourceAlgs: Record<string, string>): string | null => {
      // `nodeId` is namespaced ("im0or912a (algorithm)") since code nodes were added above, so match
      // on the bare id rather than the whole key — and look the counterpart up the same way.
      const bare = nodeId.replace(/ \((algorithm|code)\)$/, '')
      const rule = NAME_CROSSED.find((k) => k.flow === flowId && k.runtimeNode === bare)
      if (!rule) return null
      const counterpart =
        sourceAlgs[`${rule.sourceNode} (algorithm)`] || sourceAlgs[`${rule.sourceNode} (code)`] || ''
      // Only honour the exemption if the source genuinely still carries the counterpart.
      if (counterpart.length < 1000) return null
      return `${flowId} node ${nodeId} exempt: ${rule.why} (source ${rule.sourceNode} = ${counterpart.length} chars)`
    }

    const ahead: string[] = []
    const exemptions: string[] = []
    for (const id of Object.keys(runtime)) {
      if (id === 'variables' || !source[id]) continue
      const r = algs(runtime[id])
      const s = algs(source[id])
      for (const nodeId of Object.keys(r)) {
        // Longer-and-different is the signature of "someone fixed it in the running copy".
        if ((r[nodeId] || '').length > (s[nodeId] || '').length) {
          const why = exempt(id, nodeId, s)
          if (why) {
            exemptions.push(why)
            continue
          }
          ahead.push(`${runtime[id].name || id} (${id}) node ${nodeId}: runtime ${r[nodeId].length} > source ${(s[nodeId] || '').length}`)
        }
      }
    }
    // Never let an exemption pass silently — a muted guard that says nothing is how 0072 went
    // unnoticed for days in the first place.
    for (const e of exemptions) console.log(`P0-S8 ${e}`)

    expect(
      ahead,
      'flows whose algorithm exists only in the git-ignored runtime DB — sync them into the ' +
        'strxi2-demo-api submodule or the next re-provision reverts them (docs/issues/0072):\n  ' +
        ahead.join('\n  '),
    ).toEqual([])

    // ── docs/issues/0095 Option 2 ──────────────────────────────────────────────────────────────
    // The loop above starts with `if (!source[id]) continue`, so a flow that exists ONLY in the
    // runtime is skipped entirely — the guard cannot see the very thing it exists to prevent. That
    // blind spot is how docs/issues/0149 happened: the incidents table's live-push flow is
    // runtime-only AND its mapping is a JS `config.code` node, which this comparison also ignores.
    //
    // Measured 2026-08-12: **59** flows exist only in the runtime. Most are `Form flow` / `Chart
    // flow` / `Ticker flow` scaffolding whose loss would not be felt. Failing on all 59 would make
    // preflight permanently red, which is the "failures stop meaning something" trap of
    // docs/issues/0143 — so this fails only on flows that SERVE A DEMO ROUTE, and lists the known
    // ones explicitly. Anything new is loud.
    // Two NARROW criteria, arrived at by measuring rather than guessing:
    //
    //  (a) the flow SERVES a demo route — a relative `/viz-data|/os-triage|/stix-orm` url. These are
    //      capability endpoints; losing one removes a feature. Measured: 5 flows.
    //  (b) the flow is a TMS PUBLISHER that fetches a demo route — how a widget is fed live.
    //      Measured: this is what `f210iy001bt51d` is, the incidents-table push flow that
    //      docs/issues/0149 is about.
    //
    // ⚠️ A first version matched the path ANYWHERE in the url to catch (b), and flagged **42** extra
    // flows — every `Form flow` that merely POSTs to a demo API. That would have made preflight
    // permanently red, which is the docs/issues/0143 trap. Serving a route and calling one are not
    // the same thing, and the guard has to tell them apart.
    const SERVED_ROUTE = /^\/(viz-data|os-triage|stix-orm)\//
    const FETCHED_ROUTE = /\/(viz-data|os-triage|stix-orm)\//
    const routesOf = (flow: any): string[] => {
      const design = (flow && (flow.design || flow)) || {}
      const nodes = Object.values<any>(design)
      const urls = nodes.map((n) => n && n.config && n.config.url).filter((u): u is string => typeof u === 'string')
      const served = urls.filter((u) => SERVED_ROUTE.test(u))
      if (served.length) return served
      // (b) a TMS publisher feeding a widget from a demo route.
      const publishes = nodes.some((n) => /^pubsrc/.test(String(n && n.component)))
      return publishes ? urls.filter((u) => FETCHED_ROUTE.test(u)) : []
    }

    // Conditional, in the spirit of the exemption above: each entry names WHY it is tolerated. They
    // are still printed every run — a tolerated hazard that says nothing is how 0072 went unnoticed.
    // ⚠️ Entries here are NOT safe; they are known losses waiting to happen.
    //
    // ✅ EMPTY as of 2026-08-12. It briefly held six demo capabilities — Act 2's and Act 3's options,
    // promote-subgraph (P3-S12), remove-object, the P5-S6 reference picker and Act 1's live push —
    // and all six have now been copied into the provisioning source (docs/issues/0095 Option 1), so
    // they are no longer runtime-only and no longer need tolerating. Emptying it is the point: an
    // exemption that outlives its reason is a hole, so these were removed the moment they were
    // fixed rather than left to rot into documentation.
    const KNOWN_RUNTIME_ONLY: Record<string, string> = {}

    const runtimeOnlyServingDemo: string[] = []
    const tolerated: string[] = []
    for (const id of Object.keys(runtime)) {
      if (id === 'variables' || source[id]) continue
      const routes = routesOf(runtime[id])
      if (!routes.length) continue
      const line = `${runtime[id].name || id} (${id}) serves ${routes.join(', ')}`
      if (KNOWN_RUNTIME_ONLY[id]) tolerated.push(`${line} — tolerated: ${KNOWN_RUNTIME_ONLY[id]}`)
      else runtimeOnlyServingDemo.push(line)
    }
    for (const t of tolerated) console.log(`P0-S8 runtime-only ${t}`)
    console.log(`P0-S8 runtime-only flows serving a demo route: ${tolerated.length} tolerated, ${runtimeOnlyServingDemo.length} new`)

    expect(
      runtimeOnlyServingDemo,
      'flows that SERVE A DEMO ROUTE but exist only in the git-ignored runtime DB — a re-provision ' +
        'deletes them and the demo loses that capability with no warning (docs/issues/0095). Add ' +
        'them to the provisioning source, or list them in KNOWN_RUNTIME_ONLY with a reason:\n  ' +
        runtimeOnlyServingDemo.join('\n  '),
    ).toEqual([])
  })
})
