/**
 * Render `run-log.md` from a Playwright JSON report.
 *
 * Usage: node make-run-log.mjs <runDir>
 *
 * The runsheet's step IDs are the join key: every test is titled "<step id> — <title>",
 * so the log can be read side by side with docs/mini-app-runsheet.md.
 */
import * as fs from 'fs'
import * as path from 'path'

const runDir = process.argv[2]
if (!runDir) {
  console.error('usage: node make-run-log.mjs <runDir>')
  process.exit(1)
}

const results = JSON.parse(fs.readFileSync(path.join(runDir, 'results.json'), 'utf8'))

const rows = []
function walk(suite, file) {
  for (const spec of suite.specs || []) {
    for (const t of spec.tests || []) {
      const r = t.results?.[0] || {}
      const ann = (t.annotations || []).concat(r.annotations || [])
      const get = (type) => ann.filter((a) => a.type === type).map((a) => a.description).join('; ')
      const [id, ...rest] = spec.title.split(' — ')
      rows.push({
        id,
        title: rest.join(' — '),
        file: file || suite.file,
        baseline: get('baseline') || '—',
        issue: get('issue'),
        observed: get('observed') || '(no observation recorded)',
        status: t.status || r.status,
        durationMs: r.duration || 0,
        error: (r.error?.message || '').split('\n').slice(0, 3).join(' ').slice(0, 300),
        attachments: (r.attachments || []).map((a) => a.name + ': ' + path.basename(a.path || '')),
      })
    }
  }
  for (const child of suite.suites || []) walk(child, file || suite.file)
}
for (const s of results.suites || []) walk(s)

const icon = (r) => {
  if (r.status === 'expected' || r.status === 'passed') return '✅'
  if (r.status === 'skipped') return r.baseline === 'manual' ? '✋' : '⬜'
  return '❌'
}

const stamp = path.basename(runDir)
let md = `# Mini App run log — ${stamp}\n\n`
md += `Generated from \`results.json\`. Step IDs match [\`../../mini-app-runsheet.md\`](../../mini-app-runsheet.md).\n\n`
md += `- **Total steps:** ${rows.length}\n`
md += `- **Passed:** ${rows.filter((r) => icon(r) === '✅').length}\n`
md += `- **Regressions (red):** ${rows.filter((r) => icon(r) === '❌').length}\n`
md += `- **Known-broken / not exercised:** ${rows.filter((r) => icon(r) === '⬜').length}\n`
md += `- **Manual-only:** ${rows.filter((r) => icon(r) === '✋').length}\n\n`
md += `Video, trace and screenshots for each step are under \`test-output/\`; open the HTML report with\n`
md += `\`npx playwright show-report ${path.join(stamp, 'html-report')}\`.\n\n`
md += `| Step | Title | Baseline | Observed | Result | Issue |\n|---|---|---|---|---|---|\n`
for (const r of rows) {
  md += `| **${r.id}** | ${r.title} | ${r.baseline} | ${r.observed.replace(/\|/g, '\\|')} | ${icon(r)} | ${r.issue || '—'} |\n`
}

const reds = rows.filter((r) => icon(r) === '❌')
if (reds.length) {
  md += `\n## Regressions — steps the runsheet claims work\n\n`
  for (const r of reds) md += `### ${r.id} — ${r.title}\n\n\`\`\`\n${r.error}\n\`\`\`\n\n`
}

fs.writeFileSync(path.join(runDir, 'run-log.md'), md)
console.log('wrote', path.join(runDir, 'run-log.md'), `(${rows.length} steps)`)
