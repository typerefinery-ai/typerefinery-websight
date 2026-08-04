/**
 * #42 — "New Object button Selects from a List of All Objects".
 *
 * Authors a New Object button on the Composer page, following the pattern the app already uses for
 * Act 1's "+ Create" button (`/content/.../admin/header/default/jcr:content/container/container2/button_1`):
 * a `forms/fields/button` with `actionType=openDropdown` and a `dropdownItems` child node whose
 * numbered children each carry `{label, action:"modal", link}`.
 *
 * Two details copied from that button rather than guessed:
 *  - `link` is stored WITHOUT the `.html` extension; the renderer appends it.
 *  - the dropdown itself is generic (`clientlibs-header/dropdown.js` renders whatever
 *    `dropdownItems` it is given), so the object vocabulary lives in authored content — which is
 *    where the data-agnostic rule wants it, not in the component.
 *
 * The list is DERIVED from create-forms.json (see enumerate-create-forms.mjs), not hardcoded:
 * offering a type whose family has no create form would open the 404 of docs/issues/0049 and fail
 * #42's second acceptance criterion.
 */
import fs from 'fs'
import https from 'https'

const CMS = 'https://cms.typerefinery.localhost:8101'
const PARENT =
  '/content/typerefinery-showcase/pages/os-triage/forms/composer-local/jcr:content/rootcontainer/main'
const NODE = 'newobject'

const agent = new https.Agent({ rejectUnauthorized: false })
const state = JSON.parse(fs.readFileSync('.auth/cms.json', 'utf8'))
const cookie = (state.cookies || []).map((c) => `${c.name}=${c.value}`).join('; ')

const { forms } = JSON.parse(fs.readFileSync('create-forms.json', 'utf8'))

/** "email-addr" -> "Email Addr"; the label the analyst reads in the dropdown. */
const labelFor = (type) =>
  type.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

const items = forms
  .map((path) => ({ type: path.split('/').pop().replace(/-create$/, ''), path }))
  .sort((a, b) => a.type.localeCompare(b.type))

// Sling's default POST servlet answers 405 for /content on this instance, so authoring goes
// through the project's own guarded servlet (see ComponentNodeServlet — added for exactly this,
// alongside the existing ComponentPropertyServlet).
const dropdownItems = {}
items.forEach((item, i) => {
  dropdownItems[String(i)] = {
    label: labelFor(item.type),
    action: 'modal',
    link: item.path, // no .html — matches how the "+ Create" button stores its links
  }
})

const description = {
  'sling:resourceType': 'typerefinery/components/forms/fields/button',
  label: 'New Object',
  actionType: 'openDropdown',
  buttonType: 'action',
  icon: 'pi pi-plus',
  showIcon: 'true',
  iconPosition: 'left',
  buttonStyle: 'warning',
  classes: 'btn-sm',
  hideButtonLabel: 'false',
  showTextualElementOfButton: 'false',
  isOutlinedButton: 'false',
  persistColorWhenThemeSwitches: 'true',
  dropdownItems,
}

console.log(`authoring ${NODE} with ${items.length} dropdown items:`)
console.log(items.map((i) => labelFor(i.type)).join(', '))

const body = new URLSearchParams()
body.append('parent', PARENT)
body.append('name', NODE)
body.append('json', JSON.stringify(description))

const res = await fetch(`${CMS}/bin/typerefinery/component-node`, {
  method: 'POST',
  headers: { cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
  body,
  agent,
})
console.log(`\nPOST component-node -> ${res.status}`)
console.log((await res.text()).slice(0, 500))
