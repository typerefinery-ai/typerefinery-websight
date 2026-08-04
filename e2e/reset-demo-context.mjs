/**
 * Reset the demo context to its seed state, so a regression run is repeatable.
 *
 * **Why this is needed.** Creating an SRO links a Scratch object to a promotable, and
 * `split_subgraphs_by_promotables` then reclassifies it into Promo permanently — see
 * docs/issues/0051. So every P3-S6 run costs one Scratch object, and the seed provides only three.
 * After one or two full regressions the pane is empty and **P3-S1 fails on a claim that is
 * genuinely true of a fresh install**: "three panes, all with data" (the 0004 guard).
 *
 * What it removes is strictly test residue:
 *   - `unattached_relation.json`, `relation_edges.json`, `relation_replacement_edges.json` are
 *     **untracked** — they do not exist in HEAD, so every entry was written by a test run;
 *   - `unattached_objs.json` is restored from git, dropping objects created by P5-S3 / P3-S4.
 *
 * ⚠️ Deliberately NOT wired into the Playwright global setup. It deletes data, and a destructive
 * step should be something a person runs on purpose:
 *
 *     node e2e/reset-demo-context.mjs          # report only
 *     node e2e/reset-demo-context.mjs --apply  # actually reset
 */
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'

const CONTEXT_MEM = path.resolve(
  process.cwd(),
  '../../typerefinery/services/fastapi/generated/os-triage/context_mem',
)
const APPLY = process.argv.includes('--apply')

/** Written only by a save; absent from a fresh checkout. */
const RESIDUE = ['unattached_relation.json', 'relation_edges.json', 'relation_replacement_edges.json']
/** Tracked, so it can be restored rather than deleted. */
const RESTORE = ['unattached_objs.json']

if (!fs.existsSync(CONTEXT_MEM)) {
  console.error(`context_mem not found at ${CONTEXT_MEM}`)
  process.exit(1)
}

let removed = 0
let restored = 0

for (const dir of fs.readdirSync(CONTEXT_MEM, { withFileTypes: true })) {
  if (!dir.isDirectory() || !dir.name.startsWith('incident--')) continue

  for (const name of RESIDUE) {
    const file = path.join(CONTEXT_MEM, dir.name, name)
    if (!fs.existsSync(file)) continue
    const count = (() => {
      try {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
        return Array.isArray(parsed) ? parsed.length : '?'
      } catch {
        return '?'
      }
    })()
    console.log(`${APPLY ? 'remove ' : 'would remove '}${dir.name}/${name} (${count} entries)`)
    if (APPLY) fs.unlinkSync(file)
    removed++
  }

  for (const name of RESTORE) {
    const rel = `${dir.name}/${name}`
    const file = path.join(CONTEXT_MEM, rel)
    if (!fs.existsSync(file)) continue
    // Only tracked files can be restored; an untracked one would just error.
    try {
      execFileSync('git', ['ls-files', '--error-unmatch', rel], { cwd: CONTEXT_MEM, stdio: 'ignore' })
    } catch {
      continue
    }
    const dirty = execFileSync('git', ['status', '--short', '--', rel], { cwd: CONTEXT_MEM })
      .toString()
      .trim()
    if (!dirty) continue
    console.log(`${APPLY ? 'restore ' : 'would restore '}${rel}`)
    if (APPLY) execFileSync('git', ['checkout', '--', rel], { cwd: CONTEXT_MEM })
    restored++
  }
}

console.log(
  `\n${APPLY ? 'reset' : 'dry run'}: ${removed} residue file(s), ${restored} tracked file(s)` +
    (APPLY ? '' : '  —  re-run with --apply to perform it'),
)
