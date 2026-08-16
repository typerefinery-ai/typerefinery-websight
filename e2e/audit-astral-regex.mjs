// Usage: node audit-astral-regex.mjs [dir]   (default: this directory)
// Sweep the e2e auditors for regex character classes containing an ASTRAL character (outside the
// BMP) without the /u flag. Without /u such a class is split into surrogate halves, so it matches a
// lone leading surrogate and therefore ANY emoji sharing it — a silent false match that reads as a
// pass. Found in audit-harness-vs-runsheet.mjs by its control run; this checks the rest.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const dir = process.argv[2] || path.dirname(fileURLToPath(import.meta.url))
const hasAstral = (s) => [...s].some((ch) => ch.codePointAt(0) > 0xffff)

let scanned = 0
const hits = []
for (const name of fs.readdirSync(dir)) {
  if (!/\.(mjs|ts|js)$/.test(name)) continue
  const p = path.join(dir, name)
  if (!fs.statSync(p).isFile()) continue
  scanned++
  const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/)
  lines.forEach((line, i) => {
    // Regex literals: /.../flags  — crude but enough to find character classes in this codebase.
    for (const m of line.matchAll(/\/((?:[^/\\\n]|\\.)+)\/([a-z]*)/g)) {
      const body = m[1]
      const flags = m[2]
      for (const cls of body.matchAll(/\[[^\]]*\]/g)) {
        if (hasAstral(cls[0]) && !flags.includes('u')) {
          hits.push({ file: name, line: i + 1, cls: cls[0], flags: flags || '(none)', text: line.trim().slice(0, 120) })
        }
      }
    }
  })
}

console.log(`scanned ${scanned} script(s) in ${dir}`)
if (!hits.length) {
  console.log('no astral character class without /u — the surrogate-split false match is not present elsewhere')
  process.exit(0)
}
console.log(`\n${hits.length} astral character class(es) missing /u:`)
for (const h of hits) {
  console.log(`  ${h.file}:${h.line}  class ${h.cls}  flags=${h.flags}`)
  console.log(`     ${h.text}`)
}
process.exitCode = 1
