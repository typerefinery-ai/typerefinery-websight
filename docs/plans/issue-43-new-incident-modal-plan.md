# Issue 43 Plan: New Incident Button Opens Modal Incident Form

This document defines the implementation plan for:

- GitHub issue: `os-threat/os-threat-alpha-1-program#43`
- Title: `New Incident button opens modal Incident form`

Issue URL:

- `https://github.com/os-threat/os-threat-alpha-1-program/issues/43`

## 1. Delivery Rule

For issue work in this project:

- create a new page for the issue
- do not update existing showcase or app pages unless fixing a bug on that page
- reuse existing shared modal/form patterns where they already fit

## 2. Problem Summary

The issue asks for:

- a `New Incident` button
- opening the create incident form in a modal
- after save, opening the Incident page on the Overview tab
- using a static URL for the Incident form

## 2.1 Issue Summary

This issue needs a modal create flow for incidents: open the existing incident-create form in a modal, submit it successfully, then land on the created incident page with the Overview tab active.

## 3. Current Repo Findings

### 3.1 There is already a close match

The current `Create` page already contains:

- a button with `actionType="openModal"`
- `actionUrl="/content/typerefinery-showcase/pages/os-triage/forms/createincident/"`

Relevant file:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/pages/createnew/.content.xml`

### 3.2 The create incident form already exists

Relevant file:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/createincident/.content.xml`

This is a good reuse point because the issue explicitly says to use a static incident form URL.

### 3.3 Destination page exists, but success routing is not yet evident

The incident page with tabs already exists:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/pages/incidents/incident/.content.xml`

I did not find existing packaged wiring that clearly:

- takes modal form success
- resolves the created incident identifier
- opens the incident page directly on the Overview tab

That makes the success-navigation step the main unresolved part of the issue.

## 4. Goals

The implementation should deliver:

1. a new issue-specific page under the `Create` area
2. reuse of the existing create incident form URL inside a modal
3. correct success handling after save
4. navigation to the incident page Overview tab
5. no edits to the current `Create` page during the first issue pass

## 5. Proposed Delivery Shape

### 5.1 New issue-specific page

Create a new child page under:

- parent:
  - `/content/typerefinery-showcase/pages/os-triage/pages/createnew`
- new page:
  - `/content/typerefinery-showcase/pages/os-triage/pages/createnew/new-incident-modal`

### 5.2 Reuse the static form URL

Use:

- `/content/typerefinery-showcase/pages/os-triage/forms/createincident/`

as the modal body URL, matching the issue note.

### 5.3 Define the success navigation contract

The issue requires post-save navigation to the incident Overview tab.

This means the implementation must define:

- how the created incident id is returned
- how the target incident page URL is built
- how the Overview tab is selected on load

### 5.4 Showcase event analysis

For the new showcase page, the recommended event contract is:

1. a trigger opens the modal
2. the modal hosts the static incident form URL
3. the modal form emits `FORM_SUCCESS` back to the parent window
4. the parent flow closes the modal and navigates or opens the created incident on Overview

Exact authored events to create on the showcase page if we use the authored modal-widget pattern:

- opener button `_events_`
  - `action="BUTTON_CLICK"`
  - `type="emit"`
  - `topic="new-incident-open"`
  - `nameCustom="new-incident-open"`
- incident modal `_events_`
  - `action="MODAL_OPEN"`
  - `type="listen"`
  - `topic="new-incident-open"`
  - `nameCustom="new-incident-open"`

Exact modal-form event contract to reuse:

- modal form emits `FORM_SUCCESS`
- event config should include `{"postparentwindow":true}`

Reference pattern:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/modal-forms/sro-constraints/.content.xml`

Important unresolved part:

- the repo confirms `FORM_SUCCESS` emission, but the exact parent-side event or navigation contract for “open created incident on Overview” is not yet defined in packaged content
- that success-routing contract is the main dependency for implementation

## 6. Planned Implementation Steps

## Step 1: Create the issue-specific page

New file to add:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/pages/createnew/new-incident-modal/.content.xml`

Planned content:

- one `New Incident` trigger
- modal wiring to the existing incident create form

## Step 2: Reuse the existing create incident modal pattern

Start with the same basic modal approach already used on the current `Create` page.

This avoids unnecessary reinvention and keeps the issue focused on navigation after submit.

## Step 3: Add success handling

Define how the modal flow reacts when the form reports success.

Possible approaches:

- use existing modal/form success messaging if the form already emits enough data
- add a lightweight event payload that includes the created incident id

## Step 4: Open the incident page on the Overview tab

The incident page already uses tabs, so this step should define:

- target incident URL format
- tab selection mechanism

If tab selection is URL-driven, use that.
If not, document the smallest required tab-selection enhancement.

## Step 5: Validate the full flow

Required validation:

- button opens modal
- modal loads the create incident form
- save succeeds
- user lands on the intended incident page and Overview tab

## 7. Files Likely To Change

New issue page:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/pages/createnew/new-incident-modal/.content.xml`

Possible supporting work:

- modal/form event wiring in shared JS if the current success payload is not sufficient
- possibly tabs page wiring if Overview tab selection needs an explicit contract

## 8. Risks And Notes

- The main dependency is the created incident identifier after submit.
- The existing simple button modal helper may not be enough if custom success navigation is needed.
- If so, the authored modal widget pattern may be the better implementation path.

## 9. Validation Checklist

- New page exists under the `Create` area
- Existing `Create` page is untouched
- Modal opens the static incident form URL
- Successful save opens the incident page
- The destination lands on the Overview tab
