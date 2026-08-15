/**
 * docs/issues/0141 Option 2 — the writer is Save_Overview_Options' GENERIC deep-merge: any
 * top-level key in the patch persists into the versioned options store (that is how "x": "1"
 * got in). Reject patch keys outside the file's own top-level sections (plus the required set):
 * introducing a NEW section becomes a deliberate file edit, not a side effect of a save.
 *
 * Patches flow f21kg7001nt51d node `saveopts` in BOTH DBs (windowed raw-text surgery, the
 * established discipline; count-asserted at exactly 1 site per DB).
 *
 *     node e2e/fix-0141-reject-unknown-options-keys.mjs [--apply]
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const APPLY = process.argv.includes('--apply')
const WORKSPACE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const BASE = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database')
const BACKUP = path.join(WORKSPACE, 'typerefinery-websight/e2e/.backup-0141')

const esc = (s) => JSON.stringify(s).slice(1, -1)
const MARKER = esc('# Title: Save Overview Options JSON')
const ANCHOR = esc('    merged = deep_merge(current, patch)')
const REPLACEMENT = esc(
  '    # docs/issues/0141: a stray top-level key ("x": "1") was persisted by this generic\n' +
    '    # merge and dirtied the versioned store. The file\'s own top-level sections are the\n' +
    '    # schema - a patch may only touch keys that already exist (plus the required ones);\n' +
    '    # introducing a NEW section is a deliberate act done by editing the file, not a side\n' +
    '    # effect of a save.\n' +
    '    allowed = set(current.keys()) | set(TR_Settings_Required)\n' +
    '    unknown = sorted(k for k in patch.keys() if k not in allowed)\n' +
    '    if unknown:\n' +
    '        raise ValueError("refusing to write unknown top-level options keys: " + str(unknown))\n' +
    '\n' +
    '    merged = deep_merge(current, patch)'
)
const WINDOW = 30_000

for (const [label, file] of [
  ['provisioning', path.join(BASE, 'demo/database.json')],
  ['runtime', path.join(BASE, 'database.json')],
]) {
  let raw = fs.readFileSync(file, 'utf8')
  const sites = []
  let at = -1
  while ((at = raw.indexOf(MARKER, at + 1)) !== -1) sites.push(at)
  console.log(`== ${label}: ${sites.length} Save-Options algorithm cop(ies)`)
  if (sites.length !== 1) {
    console.log('🔴 expected exactly 1 — refusing')
    process.exitCode = 1
    continue
  }
  const rel = raw.slice(sites[0], sites[0] + WINDOW).indexOf(ANCHOR)
  if (rel === -1) {
    console.log('🔴 anchor not found in window — drifted or already patched')
    process.exitCode = 1
    continue
  }
  const abs = sites[0] + rel
  const out = raw.slice(0, abs) + REPLACEMENT + raw.slice(abs + ANCHOR.length)
  JSON.parse(out)
  if (!APPLY) {
    console.log('   (dry run — would patch; JSON stays valid)')
    continue
  }
  fs.mkdirSync(BACKUP, { recursive: true })
  fs.copyFileSync(file, path.join(BACKUP, `${label}-database.json`))
  fs.writeFileSync(file, out)
  console.log(`✅ ${label}: patched, JSON valid, backup kept`)
}
