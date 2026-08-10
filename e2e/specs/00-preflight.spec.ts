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

    const algs = (flow: any): Record<string, string> => {
      const design = (flow && (flow.design || flow)) || {}
      const out: Record<string, string> = {}
      for (const [nodeId, node] of Object.entries<any>(design)) {
        const a = node && node.config && node.config.algorithm
        if (typeof a === 'string') out[nodeId] = a
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
      const rule = NAME_CROSSED.find((k) => k.flow === flowId && k.runtimeNode === nodeId)
      if (!rule) return null
      const counterpart = sourceAlgs[rule.sourceNode] || ''
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
  })
})
