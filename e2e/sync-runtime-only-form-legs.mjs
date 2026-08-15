/**
 * docs/issues/0075 follow-through / 0095's class at scale — copy EVERY runtime-only form
 * save-leg flow into the provisioning source.
 *
 * Discovery (2026-08-15, while working 0075): ~45 flows serving
 * `/content/…/os-triage/…/form/*` routes — the WRITE LEG of every stixorm create/update form,
 * P3-S6's SRO leg and P3-S7's connection leg included — exist only in the git-ignored runtime DB.
 * A re-provision deletes the entire Act 3 + Act 5 write layer, and the P0-S8 guard cannot see it:
 * its route pattern (`/viz-data|os-triage|stix-orm`) deliberately excludes `/content/` routes.
 *
 * Rather than hand-list 45 ids (a list that rots), this DISCOVERS them: any runtime-only flow
 * with a `/content/…/os-triage/` route is copied, except the known test flow. Same discipline as
 * sync-runtime-only-demo-flows.mjs: never overwrites an id already in the source.
 *
 *     node e2e/sync-runtime-only-form-legs.mjs            # report only
 *     node e2e/sync-runtime-only-form-legs.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const RUNTIME_DB = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database/database.json')
const SOURCE_DB = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database/demo/database.json')
const APPLY = process.argv.includes('--apply')

/** Test/metadata flows that serve an os-triage content route but are not demo capabilities. */
const EXCLUDE = new Set(['f21crm003rn51d' /* form-flow-metadata test */])

const runtime = JSON.parse(fs.readFileSync(RUNTIME_DB, 'utf8'))
const source = JSON.parse(fs.readFileSync(SOURCE_DB, 'utf8'))

const toAdd = []
for (const id of Object.keys(runtime)) {
  if (id === 'variables' || source[id] || EXCLUDE.has(id)) continue
  const f = runtime[id]
  const urls = Object.values(f.design || {})
    .map((n) => n && n.config && n.config.url)
    .filter((u) => typeof u === 'string' && /^\/content\/.*\/os-triage\//.test(u))
  if (!urls.length) continue
  toAdd.push(id)
  console.log(`  + ${id}  ${[...new Set(urls)][0].replace('/content/typerefinery-showcase/pages/os-triage/', '…/')}`)
}
console.log(`\n${toAdd.length} runtime-only form-leg flow(s) to copy (source has ${Object.keys(source).length} entries)`)
if (!toAdd.length) process.exit(0)
if (!APPLY) {
  console.log('dry run — nothing written. Re-run with --apply.')
  process.exit(0)
}
for (const id of toAdd) source[id] = runtime[id]
fs.writeFileSync(SOURCE_DB, JSON.stringify(source, null, '\t'))
const after = Object.keys(JSON.parse(fs.readFileSync(SOURCE_DB, 'utf8'))).length
console.log(`source written — entries now: ${after}; size ${(fs.statSync(SOURCE_DB).size / 1e6).toFixed(1)} MB`)
