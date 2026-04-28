# Issue 39 Plan: Dictionary Property Supports Key/Value Pairs

This document defines the implementation plan for:

- GitHub issue: `os-threat/os-threat-alpha-1-program#39`
- Title: `Dictionary Property Supports Key/Value pairs`

Issue URL:

- `https://github.com/os-threat/os-threat-alpha-1-program/issues/39`

## 1. Delivery Rule

For issue work in this project:

- create a new page for the issue
- do not update existing showcase or app pages unless fixing a bug on that page
- reusable property code can be changed when the issue requires a shared behavior change

## 2. Problem Summary

The issue asks for:

- a Dictionary property that is no longer select-based
- repeatable key/value pairs
- unique keys
- STIX-compliant dictionary constraints

The issue body also references STIX rules:

- keys must be unique
- keys are ASCII and constrained in format
- empty dictionaries are not valid when the property is present

## 2.1 Issue Summary

The current Dictionary property is still modeled like a select-style field. This issue asks for a real dictionary authoring experience with repeatable key or value rows, uniqueness rules, and STIX-aligned validation.

## 3. Current Repo Findings

### 3.1 Current component state

The current Dictionary template is:

- `application/backend/src/main/resources/apps/typerefinery/components/stix/forms/select/dictionary/template/.content.json`

It currently maps to:

- `typerefinery/components/stix/forms/fields/select`
- `inputType="dictionary"`

That means the Dictionary property is still select-like at the template level, which matches the issue description.

### 3.2 Current packaged usages

Packaged usages found in this repo:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sco-forms/email-message-forms/email-message-create/.content.xml`
- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sco-forms/email-message-forms/email-message-update/.content.xml`

### 3.3 Scope ambiguity

The acceptance criteria mention:

- `The Granular Markings Selector property can select values from properties or lists from within that same object`

That acceptance criteria does not fully align with the issue title and description.

This should be treated as an open scope question in the plan:

- primary scope appears to be the Dictionary property
- secondary selector behavior may be related but should not be assumed without confirmation

## 4. Goals

The implementation should deliver:

1. a reusable Dictionary property based on repeatable key/value entries
2. STIX-oriented validation rules for key format and uniqueness
3. a new issue-specific showcase page
4. no edits to existing showcase or app pages during the first issue pass

## 5. Proposed Delivery Shape

### 5.1 Shared property work

Replace the current select-like Dictionary behavior with a repeatable authored structure that captures:

- `key`
- `value`

Expected behavior:

- duplicate keys are blocked
- invalid keys are blocked or warned
- empty entries are not serialized

### 5.2 New issue-specific page

Create a new showcase subpage under the composite forms area:

- parent:
  - `/content/typerefinery-showcase/pages/components/forms/composite`
- new page:
  - `/content/typerefinery-showcase/pages/components/forms/composite/dictionary-key-value`

Rationale:

- the new behavior is closer to repeatable composite input than a simple select
- it keeps the issue example isolated from current showcase pages

### 5.3 Showcase event analysis

This issue does not require authored showcase page `_events_`.

Exact showcase event outcome:

- exact page events to create: none
- exact showcase requirement: author a new page with one dictionary property and sample key or value rows

Reason:

- the change is in field structure, validation, and serialization
- duplicate-key checking and key-format rules should be enforced in the component, not orchestrated by page events

## 6. Planned Implementation Steps

## Step 1: Confirm the final authored/serialized shape

Before implementation, confirm:

- whether values are always strings or may be broader STIX base types
- whether UI should support multiple value types now or just string entry first

## Step 2: Replace the select-style dictionary model

Likely work areas:

- dictionary template
- any supporting field/dialog/template logic needed for repeatable entries
- client-side validation logic if uniqueness is enforced in authored UI

## Step 3: Add STIX-oriented validation

Minimum validation targets:

- unique keys within one dictionary
- allowed key character set
- max key length
- no empty dictionary serialization

## Step 4: Add a new issue-specific showcase page

New file to add:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/components/forms/composite/dictionary-key-value/.content.xml`

Planned content:

- one form
- one dictionary property
- a few sample entries
- visible help text describing key constraints

## Step 5: Review downstream form adoption

Identify packaged forms that currently use the old Dictionary property and document follow-up migration.

## 7. Files Likely To Change

Shared property work:

- `application/backend/src/main/resources/apps/typerefinery/components/stix/forms/select/dictionary/template/.content.json`
- possibly related dialog/template files under the Dictionary and STIX fields areas

New issue page:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/components/forms/composite/dictionary-key-value/.content.xml`

## 8. Risks And Notes

- The acceptance criteria contain a scope mismatch with the issue title.
- Supporting all STIX base value types may be larger than a first-pass implementation.
- If the UI only supports string values first, that limitation should be documented explicitly.

## 9. Validation Checklist

- Dictionary is no longer select-based
- Duplicate keys are prevented or clearly rejected
- Invalid keys are rejected according to the agreed rule set
- New showcase page works without editing existing pages
- Existing unrelated STIX properties still render correctly
