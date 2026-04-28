# Issue 37 Plan: External Reference Uses New Hashes Property

This document defines the implementation plan for:

- GitHub issue: `os-threat/os-threat-alpha-1-program#37`
- Title: `Update External References component with new Hashes component`

Issue URL:

- `https://github.com/os-threat/os-threat-alpha-1-program/issues/37`

## 1. Delivery Rule

For issue work in this project:

- create a new page for the issue
- do not update existing showcase or app pages unless fixing a bug on that page
- reusable component/template code can be changed when the issue requires a shared fix

For this issue, that means:

- existing composite showcase pages remain unchanged
- existing packaged `os-triage` forms remain unchanged during the first issue pass
- the shared External Reference component can be updated because this is a reusable STIX property change

## 2. Problem Summary

The issue asks for:

- the old External Reference component to stop using the old hashes representation
- the component to adopt the new hashes property
- downstream form migration after the reusable component is corrected

## 2.1 Issue Summary

The current External Reference composite still authors `hashes` as a plain string-style field. This issue is asking for that child property to be replaced with the newer reusable hashes property so External References align with the updated STIX form model.

## 3. Current Repo Findings

### 3.1 Reusable component state

The current External Reference template is defined in:

- `application/backend/src/main/resources/apps/typerefinery/components/stix/forms/composite/externalreference/template/.content.json`

The current `hashes` child inside that template is still modeled as:

- `typerefinery/components/forms/input`
- `typerefinery/components/stix/forms/fields/input`
- `inputType="string"`

That means the reusable component does not yet reflect a dedicated hashes property.

### 3.2 Showcase and packaged content impact

The External Reference composite is already used in:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/components/forms/composite/.content.xml`
- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/components/forms/forms-test/.content.xml`
- many packaged `os-triage` STIX create/update forms under `pages/os-triage/forms/stixorm-forms/...`

This confirms the issue is a shared component/template concern, not a one-page content edit.

## 4. Goals

The implementation should deliver:

1. a corrected reusable External Reference property definition
2. a dedicated issue-specific showcase page demonstrating the new hashes behavior
3. a clear migration path for the packaged forms that still use the old shape
4. no edits to existing showcase or app pages during the first issue pass

## 5. Proposed Delivery Shape

### 5.1 Shared component work

Update the reusable External Reference template so the `hashes` child uses the new hashes property component rather than a plain string input.

Likely touch points:

- `application/backend/src/main/resources/apps/typerefinery/components/stix/forms/composite/externalreference/template/.content.json`
- possibly supporting field template/dialog files if the new hashes property is not already fully reusable

### 5.2 New issue-specific page

Create a new showcase subpage under the existing composite area:

- parent:
  - `/content/typerefinery-showcase/pages/components/forms/composite`
- new page:
  - `/content/typerefinery-showcase/pages/components/forms/composite/externalreference-hashes`

The new page should:

- demonstrate External Reference in isolation
- show the new hashes property shape
- avoid changing the current composite showcase page

### 5.3 Showcase event analysis

This issue does not require authored showcase page `_events_`.

Exact showcase event outcome:

- exact page events to create: none
- exact showcase requirement: author a new page with one `externalreference` composite using the new hashes child structure

Reason:

- this is a reusable field-template and serialization issue
- the hashes behavior lives inside the composite field structure, not in cross-component page events

## 6. Planned Implementation Steps

## Step 1: Confirm the new hashes component contract

Before editing External Reference, confirm the intended reusable hashes property structure.

Questions this step resolves:

- is the new hashes property key/value based
- is it dictionary-like with hash algorithm keys
- what serialized payload shape should be emitted

## Step 2: Update the External Reference reusable template

Replace the current string-style `hashes` child with the new hashes property component.

Success condition:

- authored content for External Reference can capture hashes in the new structure
- the component emits a STIX-aligned payload shape

## Step 3: Add a new issue-specific showcase page

New file to add:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/components/forms/composite/externalreference-hashes/.content.xml`

Planned content:

- one form
- one External Reference property
- example labels/help text explaining the new hashes behavior

## Step 4: Review downstream migration impact

Document which packaged STIX forms still include External Reference and therefore need follow-up migration.

Important note:

- this should be treated as a second-phase rollout unless the issue explicitly requires full content migration in the same change

## Step 5: Add verification coverage

Preferred coverage:

- a component-level author/preview check if tests already exist nearby
- otherwise a lightweight manual validation checklist in the doc

## 7. Files Likely To Change

Shared component/template work:

- `application/backend/src/main/resources/apps/typerefinery/components/stix/forms/composite/externalreference/template/.content.json`

New issue page:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/components/forms/composite/externalreference-hashes/.content.xml`

Possible follow-up:

- packaged STIX form pages that consume External Reference

## 8. Risks And Notes

- The exact shape of the new hashes property is the main dependency.
- Because External Reference is widely reused, changing the template has broad impact.
- If the new hashes component is not yet complete, this issue depends on that upstream component work first.

## 9. Validation Checklist

- External Reference no longer authors `hashes` as a plain string
- New showcase page renders without modifying the existing composite page
- Serialized output matches the agreed hashes structure
- Existing unrelated composite fields still render correctly
