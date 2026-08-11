/**
 * docs/issues/0138 phase 3 — the one-command restore ritual for decision 0027
 * (**Decided — Option 1, 2026-08-11**: curated versioned dataset + one-command restore).
 *
 * The context store is a git submodule, so the dataset HAS a baseline and the junk test is
 * **tracked vs untracked** — never a name pattern. Guessing at demo data by name is what produced
 * docs/issues/0074, and docs/issues/0091 warns that "distinguishing hand-made from leftover is
 * exactly the heuristic that removes the wrong thing".
 *
 * ⚠️ FINDING THAT CHANGES 0138's PLAN. The issue's phase 3 says "remove untracked incident dirs,
 * git checkout tracked ones, restore context_map.json". Measured 2026-08-12, that sequence produces
 * a BROKEN state: HEAD's own `context_map.json` lists **19** incidents while only **2** have tracked
 * directories, so restoring it as-is leaves **17 dangling references** to incidents that no longer
 * exist on disk. The committed baseline is not self-consistent with itself.
 *
 * So this script RECONCILES rather than blindly restoring: after the purge it rewrites
 * `incident_list` to the incidents that actually exist, and reports exactly what it dropped. Phase 2
 * should then commit a self-consistent baseline, after which reconciliation becomes a no-op that
 * still guards the invariant.
 *
 * ⚠️ SECOND FINDING — `settings/options.json` lives in this submodule and is dirty, which is the
 * coordination hazard docs/issues/0138 flagged against docs/issues/0136 ("the restore ritual must not
 * revert a deliberately-changed option"). Its working copy differs from HEAD by a whole-file reindent
 * plus exactly one semantic change: a junk key `"x": "1"` that some write path appended. This script
 * therefore REPORTS the options diff and leaves the file alone unless you pass --restore-options.
 *
 * Usage:
 *     node e2e/reset-demo-data.mjs                      # report only - writes nothing
 *     node e2e/reset-demo-data.mjs --apply              # archive, purge, restore, reconcile
 *     node e2e/reset-demo-data.mjs --apply --restore-options   # also revert settings/options.json
 *
 * Everything removed is ARCHIVED first (docs/issues/0138's recommendation), so the destructive step
 * is reversible. The archive path is printed; nothing is deleted before it is copied.
 */
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CTX = path.resolve(__dirname, '../../typerefinery/services/fastapi/generated/os-triage/context_mem')
const APPLY = process.argv.includes('--apply')
const RESTORE_OPTIONS = process.argv.includes('--restore-options')
const archiveArg = process.argv.find((a) => a.startsWith('--archive-dir='))

if (!fs.existsSync(CTX)) {
  console.error(`FAIL - context_mem not found at ${CTX}`)
  process.exit(1)
}

const git = (...args) => execFileSync('git', args, { cwd: CTX, encoding: 'utf8' })
const log = (...a) => console.log(...a)

// ---------------------------------------------------------------- inventory
const trackedFiles = git('ls-files').split('\n').filter(Boolean)
const trackedIncidents = new Set(
  trackedFiles.filter((f) => f.startsWith('incident--')).map((f) => f.split('/')[0]),
)
const onDiskIncidents = fs.readdirSync(CTX).filter((d) =>
  d.startsWith('incident--') && fs.statSync(path.join(CTX, d)).isDirectory())
const untrackedIncidents = onDiskIncidents.filter((d) => !trackedIncidents.has(d))

// Untracked files sitting INSIDE a tracked incident dir are residue too — same rule, finer grain.
// (`--porcelain` lines are `?? path`; a trailing slash means an untracked directory.)
const porcelain = git('status', '--porcelain').split('\n').filter(Boolean)
const untrackedInsideTracked = porcelain
  .filter((l) => l.startsWith('??'))
  .map((l) => l.slice(3).replace(/\/$/, ''))
  .filter((p) => {
    const top = p.split('/')[0]
    return trackedIncidents.has(top) && p !== top
  })
const dirtyTracked = porcelain.filter((l) => !l.startsWith('??')).map((l) => l.slice(3))

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const cmPath = path.join(CTX, 'context_map.json')
const cmBefore = readJson(cmPath)

log('=== docs/issues/0138 — demo data reset ===')
log(`context store : ${CTX}`)
log(`branch        : ${git('rev-parse', '--abbrev-ref', 'HEAD').trim()} @ ${git('rev-parse', '--short', 'HEAD').trim()}`)
log('')
log('BEFORE')
log(`  incident dirs on disk       : ${onDiskIncidents.length}`)
log(`    tracked (the dataset)     : ${trackedIncidents.size}`)
log(`    untracked (junk by defn)  : ${untrackedIncidents.length}`)
log(`  untracked files in tracked  : ${untrackedInsideTracked.length}`)
log(`  dirty tracked files         : ${dirtyTracked.length}`)
log(`  context_map.incident_list   : ${(cmBefore.incident_list || []).length}`)
log(`  context_map.current_incident: ${cmBefore.current_incident}`)

// ------------------------------------------------------- options coordination
const optRel = 'settings/options.json'
const optPath = path.join(CTX, optRel)
let optionsDelta = []
if (fs.existsSync(optPath)) {
  const headOpts = JSON.parse(git('show', `HEAD:${optRel}`))
  const workOpts = readJson(optPath)
  const diff = (a, b, p = '') => {
    const out = []
    for (const k of new Set([...Object.keys(a || {}), ...Object.keys(b || {})])) {
      const av = a?.[k]
      const bv = b?.[k]
      if (av && bv && typeof av === 'object' && typeof bv === 'object' && !Array.isArray(av)) {
        out.push(...diff(av, bv, `${p}.${k}`))
      } else if (JSON.stringify(av) !== JSON.stringify(bv)) {
        out.push(`${p}.${k}: HEAD=${JSON.stringify(av)} -> WORKING=${JSON.stringify(bv)}`)
      }
    }
    return out
  }
  optionsDelta = diff(headOpts, workOpts)
  log('')
  log(`  ${optRel}: ${optionsDelta.length} semantic difference(s) vs HEAD` +
      (optionsDelta.length ? '' : ' (formatting only)'))
  optionsDelta.forEach((d) => log(`    ${d}`))
  if (optionsDelta.length && !RESTORE_OPTIONS) {
    log('    ⚠️ NOT reverted — pass --restore-options if these are junk, not deliberate (docs/issues/0136).')
  }
}

// ------------------------------------------------------------- what would run
const cmAfterList = (cmBefore.incident_list || []).filter((id) => trackedIncidents.has(id))
const dropped = (cmBefore.incident_list || []).filter((id) => !trackedIncidents.has(id))

log('')
log('PLAN')
log(`  archive + remove ${untrackedIncidents.length} untracked incident dirs`)
log(`  archive + remove ${untrackedInsideTracked.length} untracked files inside tracked incident dirs`)
log(`  git checkout ${dirtyTracked.filter((f) => f !== optRel).length} dirty tracked file(s)`)
log(`  reconcile context_map.incident_list: ${(cmBefore.incident_list || []).length} -> ${cmAfterList.length}` +
    ` (drops ${dropped.length} reference(s) to incidents that will not exist)`)
if (!trackedIncidents.has(cmBefore.current_incident)) {
  log(`  ⚠️ current_incident ${cmBefore.current_incident} is NOT tracked — it will be repointed to ${cmAfterList[0]}`)
}

if (!APPLY) {
  log('')
  log('dry run — nothing written. Re-run with --apply.')
  process.exit(0)
}

// -------------------------------------------------------------------- archive
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const archiveDir = archiveArg
  ? archiveArg.split('=')[1]
  : path.join(os.tmpdir(), 'claude', 'alpha-launch-demo-data-archive', stamp)
fs.mkdirSync(archiveDir, { recursive: true })
log('')
log(`archiving to ${archiveDir}`)
for (const d of untrackedIncidents) {
  fs.cpSync(path.join(CTX, d), path.join(archiveDir, d), { recursive: true })
}
for (const f of untrackedInsideTracked) {
  const dest = path.join(archiveDir, f)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.cpSync(path.join(CTX, f), dest, { recursive: true })
}
log(`  archived ${untrackedIncidents.length} dir(s) + ${untrackedInsideTracked.length} file(s)`)

// ---------------------------------------------------------------------- purge
for (const d of untrackedIncidents) fs.rmSync(path.join(CTX, d), { recursive: true, force: true })
for (const f of untrackedInsideTracked) fs.rmSync(path.join(CTX, f), { recursive: true, force: true })
log(`purged ${untrackedIncidents.length} untracked incident dir(s), ${untrackedInsideTracked.length} residue file(s)`)

// -------------------------------------------------------------------- restore
const toCheckout = dirtyTracked.filter((f) => RESTORE_OPTIONS || f !== optRel)
if (toCheckout.length) {
  git('checkout', '--', ...toCheckout)
  log(`git checkout restored ${toCheckout.length} tracked file(s)`)
}

// ------------------------------------------------------------------ reconcile
// context_map.json has just been restored from HEAD, so re-read it and reconcile THAT — reconciling
// the pre-restore copy would silently reintroduce whatever the working tree had.
const cm = readJson(cmPath)
const existing = fs.readdirSync(CTX).filter((d) => d.startsWith('incident--'))
const before = (cm.incident_list || []).length
cm.incident_list = (cm.incident_list || []).filter((id) => existing.includes(id))
if (!existing.includes(cm.current_incident)) {
  log(`⚠️ current_incident ${cm.current_incident} does not exist — repointing to ${cm.incident_list[0]}`)
  cm.current_incident = cm.incident_list[0]
}
fs.writeFileSync(cmPath, JSON.stringify(cm, null, 1))
log(`reconciled context_map.incident_list: ${before} -> ${cm.incident_list.length}` +
    ` (dropped ${before - cm.incident_list.length} dangling reference(s))`)

// ----------------------------------------------------------------------- after
const afterDirs = fs.readdirSync(CTX).filter((d) => d.startsWith('incident--'))
const afterPorcelain = git('status', '--porcelain').split('\n').filter(Boolean)
log('')
log('AFTER')
log(`  incident dirs on disk       : ${afterDirs.length}`)
log(`  context_map.incident_list   : ${cm.incident_list.length}`)
log(`  context_map.current_incident: ${cm.current_incident}`)
log(`  git status entries          : ${afterPorcelain.length}`)
afterPorcelain.slice(0, 10).forEach((l) => log(`    ${l}`))
log('')
log(`archive kept at ${archiveDir} — delete it once you are satisfied.`)
log('Next: restart nothing; the FastAPI context store is read per request. Re-check P1-S1.')
