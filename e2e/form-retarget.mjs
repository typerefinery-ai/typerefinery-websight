/**
 * Retarget every string in the cloned tree that names the TEMPLATE's type (docs/issues/0158).
 *
 * ⚠️ Cloning carries far more type identity than the Object group. Measured on the first cut of
 * these forms: `incident-update` rendered `<h1>Identity Form</h1>` with a greyed `type` field
 * reading `identity`, an "Update Identity" button, an "Identity Contact Extension" add-button — and
 * `writeUrl`/`readUrl` still pointing at **identity-update's own endpoint**. The Object group was
 * correct throughout, which is exactly why a field-count check could not see any of it.
 *
 * 🔑 **Enumerated, not search-and-replace.** One occurrence of the template's type is *correct* and
 * must survive: `created_by_ref`'s `readPayload` is `{"object_type":"identity",…}` for every STIX
 * type, because a `created_by_ref` genuinely references an Identity. A blind replace would corrupt
 * the one field it should leave alone, so each retarget below names its own path.
 */
export const titleCase = (type) =>
  type.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')

/**
 * @param targetPath the content path this form will actually live at, WITHOUT the `.html` — e.g.
 *   `/content/…/stixorm-forms/os-threat-forms/sdo-forms/impact-forms/impact-update`.
 *
 * ⚠️ Required, not optional, and it must be the real path. Rewriting only the leaf
 * (`identity-forms/identity-update` → `impact-forms/impact-update`) leaves the template's **root**
 * in place, and `impact` does not live under `stix-forms` — it is an os-threat type. Measured: that
 * shortcut produced a `writeUrl` of `stix-forms/sdo-forms/impact-forms/…`, a path with no resource
 * behind it. The endpoint is rebuilt from the target path rather than patched.
 */
export const retarget = (tree, type, templateType, targetPath) => {
  const content = tree['jcr:content']
  const header = content.rootcontainer.header?.two
  const form = content.rootcontainer.main.form
  const label = titleCase(type)
  const changed = []

  const set = (obj, key, value, where) => {
    if (!obj || obj[key] === undefined) return
    changed.push(`${where}: ${String(obj[key]).slice(0, 46)} -> ${String(value).slice(0, 46)}`)
    obj[key] = value
  }

  set(header?.container1?.text, 'text', `<h1>  ${label} Form</h1>`, 'heading')
  set(header?.container2?.button, 'title', `Update ${label}`, 'submit button')

  // The `type` constant is NOT a caption — it is the value that serialises. An incident saved
  // through a form whose type reads `identity` is written as an identity.
  const typeField = form.composite?.field?.one?.container1?.string?.field
  set(typeField, 'value', type, 'type value')
  set(typeField, 'placeholder', type, 'type placeholder')

  // The form must post to ITS OWN path, not the template's. Rebuild from the target path so the
  // ROOT changes too (os-threat-forms vs stix-forms), keeping the template's origin and suffix.
  if (!targetPath) throw new Error('retarget: targetPath is required — see docs/issues/0158')
  for (const key of ['writeUrl', 'readUrl']) {
    const url = form[key]
    if (typeof url !== 'string') continue
    const [origin, rest] = [url.slice(0, url.indexOf('/content/')), url.slice(url.indexOf('/content/'))]
    const suffix = rest.slice(rest.indexOf('/_jcr_content/'))
    set(form, key, `${origin}${targetPath}${suffix}`, key)
  }

  // The extension add-button is the template's extension; a type without one should not offer it.
  const extButton = form.two?.container2?.button
  if (extButton?.title && new RegExp(templateType, 'i').test(extButton.title)) {
    set(extButton, 'title', `${label} Extension`, 'extension button')
  }
  return changed
}

