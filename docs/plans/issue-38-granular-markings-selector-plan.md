# Issue 38 Plan: Correct Granular Markings Property

This document defines the implementation analysis for:

- GitHub issue: `os-threat/os-threat-alpha-1-program#38`
- Title: `Correct Granular Markings Property`

Issue URL:

- `https://github.com/os-threat/os-threat-alpha-1-program/issues/38`

## 1. Delivery Rule

For issue work in this project:

- create a new page for the issue
- do not update existing showcase or app pages unless fixing a bug on that page
- reusable STIX property code can be changed when the issue requires a shared fix

## 2. Problem Summary

The issue asks for:

- a Granular Markings selector that can choose properties from the same object
- support for selectors that point to schema keys from the current form
- support for array references using item indexes such as `[1]`
- correct interaction between `lang`, `marking_ref`, and `selectors`

## 2.1 Issue Summary

The current Granular Markings composite exists, but its `selectors` field is still authored like a plain string input. This issue is asking for the existing reusable component to support schema-based selector authoring, where selectors are built from the current form structure rather than free-typed selector text.

Latest clarification from issue discussion:

- this is not a new CMS-specific component or page
- the existing Granular Markings component must be corrected
- the selector should behave like a tree select or tag field
- the selector source is the schema or keys of the current form
- arrays should reference the item index using notation like `[1]`
- non-array fields should use their schema key path

## 3. Current Repo Findings

### 3.1 Current reusable component state

The current Granular Marking composite template is:

- `application/backend/src/main/resources/apps/typerefinery/components/stix/forms/composite/granularmarking/template/.content.json`

Current state:

- `lang` is a plain string input
- `marking_ref` is a plain string input
- `selectors` is also a plain string input

There is also a reusable selector component already present in the repo:

- `application/backend/src/main/resources/apps/typerefinery/components/stix/forms/input/selector/template/.content.json`

This means the repo already has a selector field concept, but the Granular Markings composite is not using it yet.

### 3.2 Existing showcase and packaged usage

Existing showcase usage:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/components/forms/composite/.content.xml`

Packaged form usage exists in many STIX ORM forms, including:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/...`

This makes the issue a shared component-template concern, not a one-page content change.

## 4. Goals

The implementation should deliver:

1. a corrected reusable Granular Markings property
2. selector behavior that is based on same-object schema references instead of free text
3. support for list or array item references using index notation
4. no issue-specific CMS page for this work

## 5. Proposed Delivery Shape

### 5.1 Shared component work

Update the Granular Markings composite so `selectors` uses the selector property behavior rather than a plain string field.

Likely touch points:

- `application/backend/src/main/resources/apps/typerefinery/components/stix/forms/composite/granularmarking/template/.content.json`
- possibly selector field support files if same-object introspection is not already supported

### 5.2 Component behavior direction

Expected selector behavior:

- parent composite may contain a list of objects
- selector UI should behave like a tree select or tag field
- selector choices should be generated from the current form schema
- normal object fields should use key-based paths
- arrays should use index notation such as `[1]`

### 5.3 Showcase event analysis

This issue does not require authored showcase page `_events_`.

Exact showcase event outcome:

- exact page events to create: none
- exact showcase requirement: validate the corrected existing component against real composite form structures that contain nested keys and arrays

Reason:

- the issue is about same-object selector behavior inside a composite property
- the behavior should come from field wiring and selector resolution, not page-level event orchestration
- the work belongs to the existing reusable component, not to a new issue-specific page

## 6. Validation Focus

- selector can reference same-object properties
- selector can reference list values when required
- `lang` and `marking_ref` behavior matches the intended mutually exclusive rules
- new showcase page demonstrates the corrected selector behavior without editing existing pages
