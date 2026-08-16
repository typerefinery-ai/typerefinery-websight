/**
 * The standing P0 ritual, as a command.
 *
 * `docs/demo-acts-goal.md` asks every tick: *"compare the manager's port mappings at `:3001/services`
 * against real listeners — a mapping whose assigned port differs from its requested port on an
 * **enabled** service reopens docs/issues/0174."* That check found
 * docs/issues/0187. It had been done by eye, or by three throwaway scripts, which is how a ritual
 * quietly stops happening.
 *
 * ⚠️ `:3001/services` answers an **HTML dashboard**, not JSON — a `.json()` on it fails and reads as
 * "the manager is down". Rows are parsed out of the table.
 *
 * Reports three things, and only the first is a failure:
 *   1. 🚩 a mismatch on an ENABLED service        — 0174's signature
 *   2. ◐  a mismatch on a DISABLED service        — inert now, a collision when enabled (0195)
 *   3.    services not in a healthy state         — context, e.g. cacao-roaster's HEALTHCHECKWAIT
 *
 * Needs the manager up, so it is deliberately NOT in `audit-all.mjs`'s offline standing set.
 *
 *     node e2e/audit-service-ports.mjs
 */
const MANAGER = process.env.MANAGER_BASE || 'http://localhost:3001'

const res = await fetch(`${MANAGER}/services`).catch(() => null)
if (!res || !res.ok) {
  console.error(`service manager not reachable at ${MANAGER}/services — cannot run the P0 port check.`)
  console.error('Failing rather than reporting green: a check that did not run is not a check that passed.')
  process.exit(2)
}
const html = await res.text()

const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
  .map((m) => [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
    .map((x) => x[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()))
  .filter((c) => c.length)

// Service rows:  name | runtime | STATE | CONFIGURED? | port | actions
//
// ⚠️ The two row shapes overlap. A port-mapping row is `8000 | fastapi | SERVICE_PORT | available |
// 8000` — its third cell is ALL-CAPS and its fifth is numeric, exactly like a service row's. A first
// version matched on those two alone and counted every mapping as a service, so the "not in a settled
// state" list came out at **38** entries, 37 of them ports. That is the noise that gets a check
// ignored. The one thing only a service row has: a NAME in the first cell, not a number.
const services = new Map()
for (const c of rows) {
  if (c.length >= 5 && !/^\d+$/.test(c[0] || '') && /^[A-Z_]+$/.test(c[2] || '') && /^\d{2,5}$/.test(c[4] || '')) {
    services.set(c[0], { state: c[2], configured: c[3], port: c[4] })
  }
}
// Port-mapping rows:  requested | service | VAR | state | assigned
const mappings = []
for (const c of rows) {
  if (c.length >= 5 && /^\d{2,5}$/.test(c[0]) && /^\d{2,5}$/.test(c[4])) {
    mappings.push({ requested: c[0], service: c[1], variable: c[2], state: c[3], assigned: c[4] })
  }
}

if (!services.size || !mappings.length) {
  console.error(`parsed ${services.size} service(s) and ${mappings.length} mapping(s) from the dashboard — the page shape changed.`)
  console.error('Failing rather than reporting green.')
  process.exit(2)
}

console.log(`${services.size} service(s) · ${mappings.length} port mapping(s)`)

const mismatches = mappings.filter((m) => m.requested !== m.assigned)
const enabled = (name) => (services.get(name)?.state || '').toUpperCase() !== 'DISABLED'

const hot = mismatches.filter((m) => enabled(m.service))
const inert = mismatches.filter((m) => !enabled(m.service))

/** Who else claims the port a mismatch was assigned? That is what turns "odd" into "collision". */
const claimant = (port, exclude) =>
  mappings.find((m) => m.assigned === port && m.service !== exclude)?.service || null

for (const m of inert) {
  const other = claimant(m.assigned, m.service)
  console.log(`  ◐  ${m.service} (${services.get(m.service)?.state}) requested ${m.requested} -> assigned ${m.assigned}` +
    (other ? ` — a port ${other} also holds. Inert while disabled; a collision when enabled (docs/issues/0195)` : ''))
}

const unhealthy = [...services].filter(([, s]) => !/^(STARTED|RUNNING|AVAILABLE|DISABLED|STOPPED)$/i.test(s.state))
if (unhealthy.length) {
  console.log(`\n${unhealthy.length} service(s) not in a settled state:`)
  for (const [n, s] of unhealthy) console.log(`     ${n}: ${s.state} / ${s.configured}`)
}

if (!hot.length) {
  console.log('\n✅ no ENABLED service has an assigned port differing from its requested port — 0174 clear')
  process.exit(0)
}
console.log(`\n🚩 ${hot.length} ENABLED service(s) with a resolved port that is not the requested one — this is 0174's signature:`)
for (const m of hot) console.log(`     ${m.service} ${m.variable}: requested ${m.requested} -> assigned ${m.assigned} (${services.get(m.service)?.state})`)
console.log('\nSee docs/issues/0174. Check what is actually listening before concluding — netstat -ano | grep LISTENING.')
process.exitCode = 1
