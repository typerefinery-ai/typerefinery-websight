import { expect, request } from '@playwright/test'
import { step, test } from '../runsheet'
import { FLOW_BASE } from '../playwright.config'

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

  step('P0-S6', async ({}) => {
    const api = await request.newContext({ ignoreHTTPSErrors: true })
    const res = await api.get(`${FLOW_BASE}/viz-data/overview-default-incident`, { timeout: 60_000 })
    const payload = await res.json()
    // "Rich enough to demo" — an incident with a handful of objects, not a bare shell.
    expect((payload.nodes || []).length, 'current incident is rich enough to demo').toBeGreaterThan(5)
    await api.dispose()
  })
})
