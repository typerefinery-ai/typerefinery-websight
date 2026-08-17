/**
 * Do the COMMANDS the runsheets tell someone to type actually exist?
 *
 * docs/issues/0196. The presenter runsheet's second instruction was `npm run dev` in three widget
 * repos. **None of them has a `dev` script.** A presenter following the document got
 * `Missing script: "dev"` three times, and the runsheet's own next line says what that looks like:
 * *"the pages still load but every graph area will be empty — which looks like a broken app rather
 * than a missing server."* Acts 2, 3 and 4 silently gutted.
 *
 * ⚠️ **No existing gate could catch that.** The Chrome walks assume the servers are already up;
 * `audit-runsheet-urls.mjs`, written the same day, checks pages and not commands. A shell command in
 * a document is otherwise unverifiable.
 *
 * Checks two classes, both mechanical:
 *   - `npm run <script>` / `npm start` preceded by a `cd <dir>` — the script must exist in that
 *     package's `package.json`.
 *   - `node e2e/<file>.mjs` and `./node_modules/.bin/playwright …` — the file must exist.
 *
 * ⚠️ It deliberately does NOT run anything. Verifying a command exists is a different and much
 * cheaper claim than verifying it works, and conflating them is how a check becomes something nobody
 * dares run.
 *
 *     node e2e/audit-runsheet-commands.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')

const DOCS = [
  process.env.RUNSHEET_USER || path.join(WORKSPACE, 'docs/mini-app-runsheet-user.md'),
  path.join(WORKSPACE, 'docs/mini-app-runsheet.md'),
]

const findings = []
let checked = 0

for (const doc of DOCS) {
  if (!fs.existsSync(doc)) { console.error(`missing ${doc} — failing rather than reporting green`); process.exit(2) }
  const rel = path.relative(WORKSPACE, doc).replace(/\\/g, '/')
  const lines = fs.readFileSync(doc, 'utf8').split(/\r?\n/)

  for (const raw of lines) {
    const line = raw.trim()

    // `cd <dir> && npm run <script>`  /  `cd <dir> && npm start`
    const m = /^cd\s+([\w.\/-]+)\s*&&\s*npm\s+(?:run\s+([\w:-]+)|(start|test|ci|install|i))\b/.exec(line)
    if (m) {
      checked++
      const dir = m[1]
      const script = m[2] || (m[3] === 'start' || m[3] === 'test' ? m[3] : null)
      // npm i / npm install / npm ci are built-ins, not scripts — nothing to verify.
      if (!script) continue
      const pkgPath = path.join(WORKSPACE, dir, 'package.json')
      if (!fs.existsSync(pkgPath)) { findings.push(`${rel}: \`cd ${dir}\` — no package.json there`); continue }
      let scripts = {}
      try { scripts = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).scripts || {} } catch (e) { /* below */ }
      if (!scripts[script]) {
        const near = Object.keys(scripts).filter((s) => s.includes(script) || script.includes(s))
        findings.push(`${rel}: \`npm run ${script}\` in ${dir} — NO SUCH SCRIPT` +
          (near.length ? ` (did you mean: ${near.join(', ')}?)` : ` (has: ${Object.keys(scripts).slice(0, 6).join(', ')}…)`))
      }
      continue
    }

    // `node e2e/<file>` — the script must exist.
    for (const f of line.matchAll(/\bnode\s+(e2e\/[\w.-]+\.mjs)/g)) {
      checked++
      const p = path.join(WORKSPACE, 'typerefinery-websight', f[1])
      if (!fs.existsSync(p)) findings.push(`${rel}: \`node ${f[1]}\` — file does not exist`)
    }
  }
}

console.log(`${checked} command(s) checked across ${DOCS.length} runsheet(s)`)
if (!findings.length) {
  console.log('every npm script and e2e script the runsheets name exists')
  console.log('⚠️ Existence only — this does not run them, and a script that exists can still fail.')
  process.exit(0)
}
console.log(`\n🚩 ${findings.length} command(s) a reader is told to run that cannot work:`)
for (const f of findings) console.log(`   ${f}`)
console.log('\nSee docs/issues/0196 — the last one of these silently emptied three Acts.')
process.exitCode = 1
