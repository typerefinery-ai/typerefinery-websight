/**
 * docs/issues/0138 phase 2 / decision 0027 — can we recompute a STIX SCO's deterministic id?
 *
 * 0027 (Decided) says to *rename* the junk-named fixtures to analyst-plausible names. For SDOs that is
 * free — their ids are random UUIDv4. For SCOs it is not: `email-addr` and `user-account` ids are
 * **UUIDv5 derived from the object's ID-contributing properties**, so renaming the value without
 * recomputing the id leaves an identifier that no longer derives from its content.
 *
 * That is only a blocker if the id cannot be recomputed. It can — STIX 2.1 §2.9 specifies UUIDv5 over
 * the namespace `00abedb4-aa42-466c-9c01-fed23315a9b7` with the name being the RFC 8785 (JCS)
 * canonicalisation of the ID-contributing properties.
 *
 * ⚠️ An implementation of that is worth nothing until it reproduces ids the platform already wrote.
 * So this does not compute a new id at all — it recomputes the ids of EXISTING demo objects and
 * compares. If it cannot reproduce them, the renaming plan must stay off the SCOs, and we will know
 * that rather than assume it.
 *
 *     node e2e/probe-0138-stix-scoid.mjs
 */
import crypto from 'crypto'

const NS = '00abedb4-aa42-466c-9c01-fed23315a9b7'

// RFC 8785 for the shapes STIX ID-contributing properties actually take (flat string/array maps).
const jcs = (v) => {
  if (v === null || typeof v === 'number' || typeof v === 'boolean') return JSON.stringify(v)
  if (typeof v === 'string') return JSON.stringify(v)
  if (Array.isArray(v)) return `[${v.map(jcs).join(',')}]`
  const keys = Object.keys(v).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${jcs(v[k])}`).join(',')}}`
}

const uuid5 = (namespace, name) => {
  const nsBytes = Buffer.from(namespace.replace(/-/g, ''), 'hex')
  const hash = crypto.createHash('sha1').update(Buffer.concat([nsBytes, Buffer.from(name, 'utf8')])).digest()
  const b = Buffer.from(hash.subarray(0, 16))
  b[6] = (b[6] & 0x0f) | 0x50 // version 5
  b[8] = (b[8] & 0x3f) | 0x80 // RFC 4122 variant
  const h = b.toString('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

// ID-contributing properties, STIX 2.1 §6.
const CONTRIB = {
  'email-addr': ['value'],
  'user-account': ['account_type', 'user_id', 'account_login'],
  url: ['value'],
  'domain-name': ['value'],
  'ipv4-addr': ['value'],
}

const scoId = (obj) => {
  const props = CONTRIB[obj.type]
  if (!props) return null
  const contributing = {}
  for (const p of props) if (obj[p] !== undefined) contributing[p] = obj[p]
  if (!Object.keys(contributing).length) return null
  return `${obj.type}--${uuid5(NS, jcs(contributing))}`
}

// Objects the PLATFORM wrote, read straight out of the demo dataset.
const CASES = [
  { type: 'email-addr', value: 'sbilly@example.com', id: 'email-addr--b0708db8-71e9-50f9-950c-610fccd2c30b' },
  { type: 'email-addr', value: 'wwhilly@example.com', id: 'email-addr--72fa6570-cce5-5be5-916d-452de0e1adb5' },
  { type: 'email-addr', value: 'strange@mycompany.com', id: 'email-addr--b8048a91-def8-5ef7-8cd3-a7b3db9278e5' },
  { type: 'email-addr', value: 'naive@example.com', id: 'email-addr--4722424c-7012-56b0-84d5-01d076fc547b' },
  {
    type: 'user-account',
    user_id: '79563143',
    account_login: 'sbilly',
    account_type: 'sales,',
    id: 'user-account--5c0dcb9b-5784-5aaf-b393-d990a4d68dd3',
  },
  {
    type: 'user-account',
    user_id: '79563902',
    account_login: 'nsmith',
    account_type: 'sales,',
    id: 'user-account--597ad4d4-35ba-585d-8f6d-134a75032f9b',
  },
]

let ok = 0
for (const c of CASES) {
  const { id, ...obj } = c
  const computed = scoId(obj)
  const match = computed === id
  if (match) ok++
  console.log(`${match ? '✅' : '❌'} ${c.type.padEnd(13)} ${String(c.value || c.account_login).padEnd(24)}`)
  if (!match) {
    console.log(`     expected ${id}`)
    console.log(`     computed ${computed}`)
  }
}

console.log(`\n${ok}/${CASES.length} platform-written ids reproduced`)
if (ok === CASES.length) {
  console.log('✅ the id computation is PROVEN against ids the platform wrote — a rename of an SCO can')
  console.log('   recompute its id correctly, so decision 0027\'s rename is available for SCOs too.')
} else {
  console.log('❌ NOT proven. Do not recompute SCO ids with this; 0138 phase 2 must stay off the SCOs')
  console.log('   (rename display fields only) until the real canonicalisation is matched.')
}
process.exit(ok === CASES.length ? 0 : 1)
