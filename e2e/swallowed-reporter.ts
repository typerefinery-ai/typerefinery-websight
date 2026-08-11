/**
 * docs/issues/0143 Option 2 — make a swallowed failure impossible to read as a pass.
 *
 * `runsheet.ts`'s `step()` deliberately converts a throw from any step whose baseline is not
 * `'pass'` into `base.skip()`, so that a run's *failures* always mean "something that used to work
 * no longer does". That is the right behaviour. **The reporting is what is dangerous:** Playwright
 * then prints
 *
 *     1 passed
 *     1 skipped
 *
 * and those two lines are easy to read — or filter — as a clean run. It is not hypothetical: three
 * successive regression guards for docs/issues/0142 were failing exactly as designed, were converted
 * to skips, and were wrongly concluded worthless and discarded, with that conclusion written into two
 * documents before it was caught (docs/issues/0143).
 *
 * A skip has two very different meanings and the summary gives them the same shape:
 *
 *   DELIBERATE  a `manual` baseline, or Act 4 steps whose feature is unbuilt — nothing ran, nothing
 *               was expected to
 *   SWALLOWED   the step RAN and THREW, and the harness downgraded it
 *
 * This reporter separates them. It reads the `observed:` annotation `step()` already writes and
 * reports every swallowed failure loudly at the end of the run, with the step id, its baseline and
 * the assertion message — and writes the same list to the run directory so a recorded run carries it
 * too. It changes no exit code: turning these red is Option 1/3 of 0143 and needs the baselines
 * sorted out first (Act 4 would fail every run).
 *
 * ⚠️ **`--reporter=...` on the command line REPLACES the config's reporter list, so it disables this
 * one.** That is exactly backwards from when you need it: `--reporter=list` is what you reach for
 * while debugging a step, which is precisely when a swallowed failure matters. Run the suite with no
 * `--reporter` flag (the config already includes `list`), or add this reporter explicitly:
 *
 *     node node_modules/@playwright/test/cli.js test --project=runsheet specs/05-forms.spec.ts
 *     …                                          --reporter=list,./swallowed-reporter.ts
 */
import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter'
import fs from 'fs'
import path from 'path'
import { RUN_DIR } from './playwright.config'

type Swallowed = { title: string; baseline: string; issue?: string; detail: string }

const annotation = (test: TestCase, result: TestResult, type: string) =>
  [...(result.annotations ?? []), ...test.annotations].find((a) => a.type === type)?.description

class SwallowedReporter implements Reporter {
  private swallowed: Swallowed[] = []
  private deliberate = 0

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status !== 'skipped') return
    const observed = annotation(test, result, 'observed') ?? ''
    // `step()` writes `observed: manual: …` for a deliberate skip and
    // `observed: partial/fail: …` / `fail (expected): …` when it has caught a throw.
    if (/^(partial\/fail|fail)/.test(observed)) {
      this.swallowed.push({
        title: test.title,
        baseline: annotation(test, result, 'baseline') ?? '(unknown)',
        issue: annotation(test, result, 'issue'),
        detail: observed.replace(/^[^:]+:\s*/, ''),
      })
    } else {
      this.deliberate++
    }
  }

  onEnd(_result: FullResult) {
    if (!this.swallowed.length) {
      if (this.deliberate) {
        console.log(`\n  ${this.deliberate} step(s) skipped deliberately (manual or unbuilt); 0 swallowed failures.`)
      }
      return
    }

    const lines: string[] = []
    lines.push(`${this.swallowed.length} SWALLOWED FAILURE(S) — steps that RAN, THREW, and were downgraded to "skipped"`)
    lines.push('')
    lines.push('These do NOT appear in the pass/fail counts. A step is only downgraded when its')
    lines.push("baseline is not 'pass' (docs/issues/0143); promote the baseline once it earns it, or")
    lines.push('the next regression here will be invisible too.')
    lines.push('')
    for (const s of this.swallowed) {
      lines.push(`  ${s.title}`)
      lines.push(`      baseline: ${s.baseline}${s.issue ? `   issue: ${s.issue}` : ''}`)
      lines.push(`      threw   : ${s.detail}`)
    }
    if (this.deliberate) {
      lines.push('')
      lines.push(`  (${this.deliberate} further step(s) skipped deliberately — manual or unbuilt — not counted above.)`)
    }

    const banner = '='.repeat(96)
    console.log(`\n${banner}\n${lines.join('\n')}\n${banner}\n`)

    try {
      fs.mkdirSync(RUN_DIR, { recursive: true })
      fs.writeFileSync(path.join(RUN_DIR, 'swallowed-failures.md'),
        `# Swallowed failures\n\n> ${new Date().toISOString()} — docs/issues/0143\n\n` +
        lines.map((l) => (l.startsWith('  ') ? l : l ? `${l}` : '')).join('\n') + '\n')
    } catch (err) {
      console.log(`  (could not write swallowed-failures.md: ${(err as Error).message})`)
    }
  }
}

export default SwallowedReporter
