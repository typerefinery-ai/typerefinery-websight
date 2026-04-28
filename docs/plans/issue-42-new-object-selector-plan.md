# Issue 42 Plan: New Object Button Opens Object Selector

This document defines the implementation plan for:

- GitHub issue: `os-threat/os-threat-alpha-1-program#42`
- Title: `New Object button Selects from a List of All Objects`

Issue URL:

- `https://github.com/os-threat/os-threat-alpha-1-program/issues/42`

Relevant issue comment:

- `https://github.com/os-threat/os-threat-alpha-1-program/issues/42#issuecomment-3500514322`

## 1. Delivery Rule

For issue work in this project:

- create a new page for the issue
- do not update existing showcase or app pages unless fixing a bug on that page
- reusable modal/event code can be reused or enhanced if the issue needs shared behavior

## 2. Problem Summary

The issue asks for:

- a `New Object` button
- selecting any valid new object type
- opening the matching create form once selected

The existing issue comment clarifies the intended interaction:

- a button from the viz opens a modal with a specific page
- that page triggers an event and closes

## 2.1 Issue Summary

This issue needs a reusable object-picker flow: open a chooser, let the user pick any supported object type, then open the matching create form. Unlike the STIX property issues, this one does need explicit showcase interaction wiring.

## 3. Current Repo Findings

### 3.1 Existing modal patterns are already present

The repo already contains:

- button helper pattern using `actionType="openModal"`
- authored modal widget event actions including `MODAL_OPEN` and `MODAL_CLOSE`

Relevant files:

- `application/backend/src/main/resources/apps/typerefinery/components/forms/fields/button/eventactions/.content.json`
- `application/backend/src/main/resources/apps/typerefinery/components/widgets/modal/eventactions/.content.json`
- `application/backend/src/main/resources/apps/typerefinery/components/clientlibs/clientlibs-header/modal.js`
- `application/backend/src/main/resources/apps/typerefinery/components/widgets/modal/clientlibs/functions.js`

### 3.2 Existing content anchor

The current `Create` page already has a modal-based `Create New Incident` button:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/pages/createnew/.content.xml`

That means the issue fits naturally under the `Create` area.

### 3.3 Missing piece

I did not find an existing packaged `all objects` chooser page in this repo.

What exists instead:

- the default STIX side panel page with guidance text:
  - `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/default/.content.xml`
- many specific object create/update forms

So the chooser page itself appears to be new work.

## 4. Goals

The implementation should deliver:

1. a new issue-specific page for the `New Object` entry point
2. a modal-driven object chooser page
3. event-driven open/close behavior
4. opening the correct create form after selection
5. no edits to the existing `Create` page during the first issue pass

## 5. Proposed Delivery Shape

### 5.1 New issue-specific page

Create a new child page under the existing `Create` area:

- parent:
  - `/content/typerefinery-showcase/pages/os-triage/pages/createnew`
- new page:
  - `/content/typerefinery-showcase/pages/os-triage/pages/createnew/new-object-selector`

This page should showcase the intended user flow without altering the current page.

### 5.2 Modal content page

Use a dedicated modal page that lists valid object types and emits a selection event.

The selection page should:

- present object options
- carry the target form URL for each option
- emit the chosen form target
- trigger modal close after the selection is made

### 5.3 Modal strategy

Preferred approach:

- use the authored modal widget rather than only the simple button helper

Reason:

- the issue comment explicitly points toward event-driven close behavior
- the modal widget already supports `MODAL_OPEN` and `MODAL_CLOSE`

### 5.4 Showcase event analysis

For the new showcase page, the recommended event contract is:

1. entry button emits a modal-open topic
2. authored modal listens and opens
3. chooser content emits a success message to the parent window with the selected object metadata
4. host closes the chooser modal and opens the selected create form

Exact authored events to create on the showcase page:

- opener button `_events_`
  - `action="BUTTON_CLICK"`
  - `type="emit"`
  - `topic="new-object-open"`
  - `nameCustom="new-object-open"`
- chooser modal `_events_`
  - `action="MODAL_OPEN"`
  - `type="listen"`
  - `topic="new-object-open"`
  - `nameCustom="new-object-open"`

Exact chooser-page event contract to use:

- chooser form or chooser action emits `FORM_SUCCESS`
- event config should include `{"postparentwindow":true}`
- payload should include the selected object family, group, form, or target URL

Recommended follow-up host behavior:

- close chooser modal after successful selection
- open the selected target form, ideally using the existing `OPEN_FORM_MODAL` path where the host component supports it

Note:

- the initial open and modal-listen events are fully supported in this repo today
- the post-selection payload shape must be defined as part of implementation

## 6. Planned Implementation Steps

## Step 1: Define the object catalog source

Choose where the chooser list comes from:

- static authored list in the page
- or datasource-driven object registry

Preferred first pass:

- static authored list based on the forms already packaged in the repo

## Step 2: Create the issue-specific entry page

New file to add:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/pages/createnew/new-object-selector/.content.xml`

Planned content:

- a button or trigger from the page
- an authored modal widget
- event wiring between trigger, modal, and selection page

## Step 3: Create the modal chooser content

Create a page that:

- lists valid object types
- maps each type to a create-form URL
- emits the selected target

Possible destinations include packaged STIX ORM create forms already present under:

- `/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/...`

## Step 4: Wire selection to open the chosen create form

Required behavior:

- user selects an object type
- chooser closes
- the matching create form opens

This may be:

- a second modal open event
- or a form iframe source update depending on the chosen modal pattern

## Step 5: Add verification coverage

Preferred validation:

- button opens chooser modal
- choosing an object triggers the correct target form
- modal closes cleanly

## 7. Files Likely To Change

New issue page:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/pages/createnew/new-object-selector/.content.xml`

Possible new chooser page:

- a new page under `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/` or `.../pages/os-triage/pages/createnew/`

Possible shared/event work:

- `application/backend/src/main/resources/apps/typerefinery/components/widgets/modal/clientlibs/functions.js`
- `application/backend/src/main/resources/apps/typerefinery/components/clientlibs/clientlibs-header/modal.js`

## 8. Risks And Notes

- The full list of valid objects must be defined somewhere stable.
- If object metadata is expected from a remote source, this issue becomes partly data-contract work.
- Choosing between one modal flow and chained modal flow affects complexity.

## 9. Validation Checklist

- New page exists under the `Create` area
- Existing `Create` page is untouched
- `New Object` opens a chooser modal
- Selecting an object opens the corresponding create form
- Chooser modal closes correctly after selection
