// Scan the project's markdown for bytes that should never appear in it.
//
// alpha-launch docs/issues/0088. A NUL byte was found inside docs/issues/0005, between a pair of
// backticks - an authored value had been destroyed by a bad write. A single NUL makes grep, diff and
// most tooling treat the file as binary, so the damage is invisible until something refuses to
// search it.
//
// ⚠️ This audit deliberately CLASSIFIES rather than reporting every control byte. A first version
// flagged 33 files on every run - all of them known and harmless - which is how a check becomes
// noise and then gets ignored (the same muted-guard failure fixed for P0-S8). Only genuine damage
// exits non-zero.
//
// Usage: node audit-doc-integrity.mjs [rootDir] [--verbose]

import fs from 'fs'
import path from 'path'

const root = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'docs'
const verbose = process.argv.includes('--verbose')

/**
 * Known-benign control bytes, with the reason. Anything not matched here is treated as damage.
 *
 * - ESC (0x1b) in a run log: early runs captured coloured Playwright output verbatim. Cosmetic.
 *   The current make-run-log.mjs emits none, so this only affects historical artefacts.
 * - VT (0x0b) in the source task document: the author's in-cell line break, e.g.
 *   "…so Form data is Filled␋Error on Form fill, needs Max". This is FORMATTING, not corruption -
 *   "fixing" it would edit someone's source document.
 */
const benign = (file, code) => {
  const p = file.replace(/\\/g, '/')
  if (code === 0x1b && /docs\/runs\/.*run-log\.md$/.test(p)) return 'ANSI in a historical run log'
  if (code === 0x0b && /Mini_App_Tasks\.md$/.test(p)) return "author's in-cell line break"
  return null
}

const damage = []
const ignored = new Map() // reason -> count
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
      for (let i = 0; i < b.length; i++) {
        const c = b[i]
        // Tab (9), LF (10) and CR (13) are legitimate.
        if (c === 9 || c === 10 || c === 13 || c >= 32) continue
        const why = benign(p, c)
        if (why) {
          ignored.set(why, (ignored.get(why) || 0) + 1)
          continue
        }
        const ctx = b
          .slice(Math.max(0, i - 60), i)
          .toString('utf8')
          .replace(/\n/g, '\\n')
        damage.push({ file: p, byte: i, code: c, ctx: ctx.slice(-60) })
      }
    }
  }
}

walk(root)

console.log(`scanned ${scanned} markdown files under ${root}`)
for (const [why, n] of ignored) console.log(`  ignored ${n} known-benign byte(s): ${why}`)

if (!damage.length) {
  console.log('\nno control-byte damage found')
  process.exit(0)
}

console.log(`\n🚩 ${damage.length} control byte(s) that should not be there:`)
for (const d of damage.slice(0, verbose ? damage.length : 20)) {
  const name = d.code === 0 ? 'NUL' : '0x' + d.code.toString(16)
  console.log(`  ${d.file}  ${name} at byte ${d.byte}`)
  console.log(`     after: …${d.ctx}`)
}
if (!verbose && damage.length > 20) console.log(`  …and ${damage.length - 20} more (--verbose to list)`)
console.log('\nA single NUL makes grep and git treat the whole file as binary — it will be silently')
console.log('excluded from every text search until repaired. See docs/issues/0088.')
process.exitCode = 1
