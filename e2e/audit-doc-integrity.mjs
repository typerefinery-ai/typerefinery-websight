// Scan the project's markdown for bytes that should never appear in it.
//
// alpha-launch docs/issues/0088. A NUL byte was found inside docs/issues/0005, between a pair of
// backticks - an authored value had been destroyed by a bad write. A single NUL makes grep, diff and
// most tooling treat the file as binary, so the damage is invisible until something refuses to
// search it.
//
// Usage: node audit-doc-integrity.mjs [rootDir]

import fs from 'fs'
import path from 'path'

const root = process.argv[2] || 'docs'
const findings = []
let scanned = 0

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'test-output') continue
      walk(p)
    } else if (entry.name.endsWith('.md')) {
      scanned++
      const b = fs.readFileSync(p)
      const bad = []
      for (let i = 0; i < b.length; i++) {
        const c = b[i]
        // Allow tab (9), LF (10), CR (13). Everything else below 32 is suspect.
        if (c === 0) bad.push({ byte: i, what: 'NUL' })
        else if (c < 9 || (c > 10 && c < 13) || (c > 13 && c < 32)) bad.push({ byte: i, what: '0x' + c.toString(16) })
      }
      if (bad.length) findings.push({ file: p, bad })
    }
  }
}

walk(root)

console.log(`scanned ${scanned} markdown files under ${root}`)
if (!findings.length) {
  console.log('no control-byte damage found')
  process.exit(0)
}
console.log(`\n${findings.length} file(s) with control bytes:`)
for (const f of findings) {
  console.log(`  ${f.file} — ${f.bad.length} occurrence(s)`)
  for (const b of f.bad.slice(0, 5)) {
    const raw = fs.readFileSync(f.file)
    const ctx = raw.slice(Math.max(0, b.byte - 60), b.byte).toString('utf8').replace(/\n/g, '\\n')
    console.log(`     ${b.what} at byte ${b.byte} — after: …${ctx.slice(-60)}`)
  }
}
process.exitCode = 1
