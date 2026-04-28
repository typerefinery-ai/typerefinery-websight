# Issue Review And TODOs: 37, 39, 42, 43, 72

This document captures the current repo review, likely delivery shape, and TODO list for:

- `os-threat/os-threat-alpha-1-program#37`
- `os-threat/os-threat-alpha-1-program#39`
- `os-threat/os-threat-alpha-1-program#42`
- `os-threat/os-threat-alpha-1-program#43`
- `os-threat/os-threat-alpha-1-program#72`

## Delivery Rule

For issue work in this project, the default content policy is:

- create a new page for the issue
- do not update existing showcase or app pages unless fixing a bug on that page
- shared component code can be updated when the issue reveals a reusable product gap

## Issue 37

- Title: `Update External References component with new Hashes component`
- URL: `https://github.com/os-threat/os-threat-alpha-1-program/issues/37`

### Review summary

- The current reusable External Reference template still models `hashes` as a plain input field, not a dedicated hashes property component.
- The packaged template lives at:
  - `application/backend/src/main/resources/apps/typerefinery/components/stix/forms/composite/externalreference/template/.content.json`
- The current template shape is used widely across packaged STIX forms:
  - many `os-triage` STIX create/update pages reference `typerefinery/components/stix/forms/composite/externalreference`
- There is already a component showcase anchor for this area:
  - `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/components/forms/composite/.content.xml`

### TODOs

- define the new reusable hashes property shape first
- update the External Reference template to embed that new hashes property
- add a new issue-specific composite showcase subpage
- identify which packaged forms should adopt the new External Reference component
- add regression coverage for authored/serialized output

### Proposed new page

- `/content/typerefinery-showcase/pages/components/forms/composite/externalreference-hashes`

## Issue 39

- Title: `Dictionary Property Supports Key/Value pairs`
- URL: `https://github.com/os-threat/os-threat-alpha-1-program/issues/39`

### Review summary

- The current reusable Dictionary component is still select-based.
- The packaged template lives at:
  - `application/backend/src/main/resources/apps/typerefinery/components/stix/forms/select/dictionary/template/.content.json`
- The field implementation currently points to:
  - `typerefinery/components/stix/forms/fields/select`
- Current packaged usages found in the repo are in the email-message forms:
  - `.../email-message-create/.content.xml`
  - `.../email-message-update/.content.xml`
- The acceptance criteria mention the Granular Markings selector property, which does not fully match the issue title and description. That ambiguity should be called out before implementation.

### TODOs

- confirm whether the issue scope is only the Dictionary property or also the Granular Markings selector behavior
- replace the select-style dictionary model with repeatable key/value entries
- enforce key uniqueness and STIX key constraints
- add a new issue-specific showcase page for the dictionary behavior
- identify forms that should migrate to the new dictionary component

### Proposed new page

- `/content/typerefinery-showcase/pages/components/forms/composite/dictionary-key-value`

## Issue 42

- Title: `New Object button Selects from a List of All Objects`
- URL: `https://github.com/os-threat/os-threat-alpha-1-program/issues/42`

### Review summary

- There is already an issue comment indicating the intended pattern:
  - open a modal with a specific page
  - that page triggers an event and closes
- Existing modal/button patterns already exist in this repo:
  - button helper with `actionType="openModal"`
  - authored modal widget with `MODAL_OPEN` and `MODAL_CLOSE`
- The current `Create` page already has a `Create New Incident` modal button:
  - `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/pages/createnew/.content.xml`
- I did not find an existing packaged `all objects` chooser page in this repo.
- The default STIX side panel exists, but it only shows guidance text plus sample fields:
  - `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/default/.content.xml`

### TODOs

- create a new issue-specific page under the `Create` area
- create a new modal content page that lists valid object types
- decide whether object selection is static authored content or datasource-driven
- on select, open the corresponding create form and close the chooser modal
- use the authored modal widget if event-driven close behavior is required

### Proposed new page

- `/content/typerefinery-showcase/pages/os-triage/pages/createnew/new-object-selector`

## Issue 43

- Title: `New Incident button opens modal Incident form`
- URL: `https://github.com/os-threat/os-threat-alpha-1-program/issues/43`

### Review summary

- There is already a close match in the repo:
  - the `Create` page already has a button opening `/pages/os-triage/forms/createincident/` in a modal
- Relevant files:
  - `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/pages/createnew/.content.xml`
  - `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/createincident/.content.xml`
- The create incident form exists and is modal-friendly.
- The incident destination page with tabs also exists:
  - `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/pages/incidents/incident/.content.xml`
- I have not found existing packaged wiring that takes modal submit success and opens the incident overview tab automatically.

### TODOs

- add a new issue-specific page rather than editing the current `Create` page
- reuse the existing create incident form URL as the modal body
- wire modal success to open the incident page on the Overview tab
- define how the new incident identifier is passed from form submit to the destination page
- validate that modal close and navigation happen in the right order

### Proposed new page

- `/content/typerefinery-showcase/pages/os-triage/pages/createnew/new-incident-modal`

## Issue 72

- Title: `Overview Force Graph Needs Left-select, Drag to Positionm, Zoom and Pan enabled`
- URL: `https://github.com/os-threat/os-threat-alpha-1-program/issues/72`
- State: `closed` on `2026-02-06`

### Review summary

- The packaged overview pages in this repo are integration shells around externally hosted graph widgets.
- Local dev embed:
  - `https://widgetdevoverview.typerefinery.localhost:8101/`
- Public embed:
  - `https://typerefinery-ai.github.io/widget-graph-viz-overview/`
- Relevant packaged pages:
  - `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/overview-local/.content.xml`
  - `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/overview-public/.content.xml`
- Based on the current repo contents, the graph interaction behavior itself is not implemented here. This repo mainly owns the embed page, data request wiring, and form-side event integration.

### TODOs

- confirm whether any follow-up is still needed despite the issue being closed
- if follow-up is needed, separate widget-project work from CMS integration work
- add a new issue-specific overview integration page only if we need to demonstrate a changed embed contract
- avoid planning graph interaction code changes in this repo unless the widget source is brought into scope

### Proposed new page

- `/content/typerefinery-showcase/pages/os-triage/forms/overview-local/force-graph-interactions`

## Related Plan Docs

- `docs/plans/issue-37-externalreference-hashes-plan.md`
- `docs/plans/issue-39-dictionary-key-value-plan.md`
- `docs/plans/issue-42-new-object-selector-plan.md`
- `docs/plans/issue-43-new-incident-modal-plan.md`
- `docs/plans/issue-72-force-graph-interactions-plan.md`
