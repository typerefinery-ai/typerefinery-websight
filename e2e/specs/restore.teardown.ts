import { test as teardown, expect } from '@playwright/test'
import { execFileSync } from 'child_process'
import * as path from 'path'

/**
 * Restore the curated demo dataset after the suite has run — docs/issues/0091.
 *
 * 🔑 **Why this exists.** The restore ritual was always meant to run, but nothing ran it *after* a
 * session, so every suite run left its own debris on Act 1 — the first screen an investor sees.
 * Measured 2026-08-12: immediately after a clean **43 passed / 0 failed** run, the All Incidents
 * table showed **four** rows — the two curated incidents plus `Runsheet probe 12:46:46` and
 * `Runsheet nav 12:47:07`, both created by that run. 0091 had been marked Resolved on the strength of
 * running the ritual once by hand, which cleaned the state but did not keep it clean.
 *
 * P1-S5 creates a real incident per run and P3-S6/S8 mutate unattached context, by design — there is
 * no delete API (0138 R-2), so the specs cannot tidy up after themselves. The ritual is the
 * compensating control, and this hook is what makes it automatic rather than remembered.
 *
 * ⚠️ **Deletion is by tracked-vs-untracked, never by name.** That rule is 0091's own conclusion:
 * a name-match prune would delete `Naive Smith`, the demo narrative's victim. The script also
 * archives before removing, so a wrongly-swept object is recoverable. Neither behaviour is
 * re-implemented here — this only invokes it.
 *
 * Wired as a project `teardown` rather than Playwright's `globalTeardown` so it follows the
 * config's existing project + `dependencies` idiom (see `auth.setup.ts`, the mirror of this file).
 *
 * Opt out while iterating on a single spec:  `SKIP_DEMO_RESTORE=1 playwright test specs/03-…`
 */
teardown('P0-S10 — restore the curated demo dataset', async () => {
  if (process.env.SKIP_DEMO_RESTORE) {
    console.log('[restore] SKIP_DEMO_RESTORE set — demo data left as the run left it.')
    console.log('[restore] ⚠️ Act 1 may show this run\'s test incidents. Run `node e2e/reset-demo-data.mjs --apply` before demoing.')
    teardown.skip()
    return
  }

  const script = path.join(__dirname, '..', 'reset-demo-data.mjs')
  let output = ''
  try {
    output = execFileSync(process.execPath, [script, '--apply'], {
      cwd: path.join(__dirname, '..', '..'),
      encoding: 'utf8',
      timeout: 120_000,
    })
  } catch (error: unknown) {
    const e = error as { stdout?: string; stderr?: string; message?: string }
    output = `${e.stdout ?? ''}\n${e.stderr ?? ''}`
    console.log(`[restore] ritual output:\n${output}`)
    // Fail loudly. A cleanup that silently failed is how 0091 survived being "Resolved" — the demo
    // dataset would be dirty and nothing on screen would say so.
    throw new Error(`[restore] reset-demo-data.mjs --apply failed: ${e.message ?? 'unknown'}`)
  }

  // Echo the counts into the run log; this is the line that proves the hook did something, and the
  // one that showed each run contributes its own two untracked dirs.
  for (const line of output.split('\n')) {
    if (/purged|git checkout|current_incident|rows|archive kept/i.test(line)) {
      console.log(`[restore] ${line.trim()}`)
    }
  }

  // The ritual prints its own summary; assert it got far enough to report one, so a script that
  // exits 0 without doing the work cannot pass as a restore.
  expect(output, 'the ritual should report what it purged').toMatch(/purged .* incident dir/i)
})
