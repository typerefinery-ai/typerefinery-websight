/** Does each `*-create` form actually render fields? #42 criterion 2. Raw HTML, no browser. */
import fs from 'fs'
import https from 'https'

const CMS = 'https://cms.typerefinery.localhost:8101'
const agent = new https.Agent({ rejectUnauthorized: false })
const state = JSON.parse(fs.readFileSync('.auth/cms.json', 'utf8'))
const cookie = (state.cookies || []).map((c) => `${c.name}=${c.value}`).join('; ')
const { forms } = JSON.parse(fs.readFileSync('create-forms.json', 'utf8'))

const rows = []
for (const path of forms) {
  const res = await fetch(`${CMS}${path}.html`, { headers: { cookie }, agent }).catch(() => null)
  const html = res && res.ok ? await res.text() : ''
  const inputs = (html.match(/<input\b/g) || []).length
  const selects = (html.match(/<select\b/g) || []).length
  const hasForm = /<form\b/.test(html)
  rows.push({
    type: path.split('/').pop().replace(/-create$/, ''),
    status: res ? res.status : 0,
    inputs,
    selects,
    hasForm,
    ok: !!res && res.ok && hasForm && inputs > 3,
  })
}
rows.sort((a, b) => Number(a.ok) - Number(b.ok) || a.type.localeCompare(b.type))
for (const r of rows) {
  console.log(
    `${r.ok ? 'OK  ' : 'BAD '} ${r.type.padEnd(16)} http=${r.status} form=${r.hasForm} inputs=${String(r.inputs).padStart(3)} selects=${r.selects}`,
  )
}
console.log(`\n${rows.filter((r) => r.ok).length}/${rows.length} create forms render fields`)
fs.writeFileSync('create-forms-check.json', JSON.stringify(rows, null, 1))
