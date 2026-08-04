/**
 * docs/issues/0047 — re-provision the forms whose Flow metadata was computed from the `/var`
 * mirror, so their save routes stop answering 404.
 *
 * The remedy is the one proven on `sro-constraints`: toggle `flowapi_enable` false -> true on the
 * **`/content`** node, which makes `FlowResourceChangeListener` re-provision from `/content`
 * instead of the mirror. Route and topic then come back correct.
 *
 * ⚠️ **A resolving route is not a working save.** The provisioned flow is the generic
 * `flowform-service`, which only ECHOES; the save logic is authored per form (docs/issues/0046).
 * This turns a guaranteed 404 into a 200 that does nothing — worth doing, but it is step one of two.
 *
 * ⚠️ Re-provisioning REGENERATES the flow, so it erases any hand-authored save leg. Always
 * re-provision first, then author. Running this against a form that already has a save leg would
 * destroy it — which is why it refuses anything currently listed as healthy.
 *
 *     node e2e/heal-poisoned-forms.mjs           # report only
 *     node e2e/heal-poisoned-forms.mjs --apply
 */
import fs from 'fs'

const BASE = 'https://cms.typerefinery.localhost:8101'
const SERVLET = `${BASE}/bin/typerefinery/component-property`
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const APPLY = process.argv.includes('--apply')
const audit = JSON.parse(fs.readFileSync('audit-form-save-legs.json', 'utf8'))

/** Never touch a form that already saves — re-provisioning would wipe its save leg. */
const healthyPages = new Set(audit.healthy.map((r) => r.page))

async function setProperty(path, name, value) {
  const body = new URLSearchParams({ path, name, value })
  const res = await fetch(SERVLET, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  return `${res.status} ${(await res.text()).slice(0, 120)}`
}

const results = []
for (const row of audit.poisoned) {
  if (healthyPages.has(row.page)) {
    console.log(`SKIP ${row.page} — already healthy, re-provisioning would erase its save leg`)
    continue
  }
  const contentPath = row.contentPath
  if (!contentPath || !contentPath.startsWith('/content/')) {
    console.log(`SKIP ${row.page} — no /content form node recorded (got ${contentPath})`)
    continue
  }

  console.log(`\n${APPLY ? 'HEAL' : 'would heal'} ${row.page}`)
  console.log(`  node : ${contentPath}`)
  console.log(`  route: ${String(row.routeUrl).slice(0, 100)}`)
  if (!APPLY) continue

  const off = await setProperty(contentPath, 'flowapi_enable', 'false')
  await new Promise((r) => setTimeout(r, 2500))
  const on = await setProperty(contentPath, 'flowapi_enable', 'true')
  await new Promise((r) => setTimeout(r, 4000))
  console.log(`  off -> ${off}`)
  console.log(`  on  -> ${on}`)
  results.push({ page: row.page, contentPath, off, on })
}

console.log(
  `\n${APPLY ? 'healed' : 'dry run'}: ${APPLY ? results.length : audit.poisoned.length} form(s)` +
    (APPLY ? '  —  re-run audit-form-save-legs.mjs to confirm' : '  —  re-run with --apply'),
)
