# TypeRefinery WebSight Repository Knowledge Framework

This document is the top-level orientation guide for the `typerefinery-websight` repository. Its purpose is to give contributors and AI assistants a shared mental model of:

- what this repository contains
- how the runtime and content model fit together
- where different kinds of changes should be made
- which areas are high-impact or tightly coupled

Use this as the first reference before diving into component-specific, Flow-specific, or MCP-specific documentation.

## 1. Repository Purpose

This repository is a TypeRefinery CMS project built on WebSight. It combines:

- a backend application module that defines components, models, services, actions, and server-rendered templates
- a frontend asset pipeline that packages shared styles and static client libraries
- content packages used to seed or test the CMS
- a distribution module that assembles the runnable CMS image and supporting Docker images
- automated test modules, especially Cypress-based end-to-end validation

At a high level, the repository exists to define a TypeRefinery CMS application layer on top of WebSight, including authorable page components, form and Flow integration, publishing helpers, and supporting test content.

## 2. Top-Level Map

The main structure is:

```text
/
|- application/
|  |- backend/
|  `- frontend/
|- content/
|- distribution/
|- environment/
|  `- local/
|- tests/
|  |- content/
|  `- end-to-end/
`- docs/
```

### What each top-level area owns

- `application/`
  Owns the actual CMS application code.
- `application/backend/`
  Owns Sling/OSGi Java code, component definitions, HTL templates, dialogs, clientlibs, and app templates.
- `application/frontend/`
  Owns webpack-based asset packaging for shared styles and static frontend resources.
- `content/`
  Owns a FileVault content package for sample or installable CMS content under `/content`.
- `distribution/`
  Owns the assembled runtime distribution, feature aggregation, and Docker image build definitions.
- `environment/local/`
  Owns the local Docker Compose environment for running the CMS stack.
- `tests/content/`
  Owns test content used by end-to-end scenarios.
- `tests/end-to-end/`
  Owns Cypress functional and visual test coverage.
- `docs/`
  Owns deeper subsystem documentation for Flow, forms, dialogs, and MCP/CMS integration concepts.

## 3. Architectural Layers

The repo is easiest to understand as a layered system.

### Layer 1: Build and Assembly

Build orchestration starts at the root Maven project:

- `pom.xml`
- `application/pom.xml`
- `content/pom.xml`
- `distribution/pom.xml`
- `tests/pom.xml`

The root project aggregates:

- `application`
- `content`
- `distribution`
- `tests`

This means most full builds or CI runs are Maven-driven, even though some subareas use Node tooling internally.

### Layer 2: CMS Application Definition

The backend module defines what the CMS actually knows how to render and manage:

- component resource definitions
- authoring dialogs
- HTL rendering templates
- Sling Models
- OSGi services
- custom actions and REST support
- client-side per-component behavior

This is the primary product surface of the repository.

### Layer 3: Content Packages

The repository packages content into CMS-installable structures. These content packages seed or validate:

- pages
- assets
- showcase examples
- test fixtures

### Layer 4: Runtime Distribution

The distribution module combines:

- the base WebSight CMS features
- the backend bundle
- the frontend bundle
- packaged content
- Docker runtime images

This is the bridge between authored code and an actually runnable local CMS instance.

### Layer 5: Validation and QA

Validation is split between:

- targeted Java unit tests in the backend module
- Cypress end-to-end tests in `tests/end-to-end`
- local stack deployment and manual verification guidance in `QA-Readme.md`

## 4. Core Application Model

The real center of gravity is `application/backend`.

### Backend structure

The backend has two equally important sides:

- Java code in `application/backend/src/main/java`
- CMS app resources in `application/backend/src/main/resources/apps/typerefinery`

These two sides work together:

- Java Sling Models adapt resources into structured data
- HTL templates render those resources
- dialog definitions shape what authors can configure
- component clientlibs add browser behavior
- services support Flow, auth, publishing, REST, and repository operations

### Main backend namespaces

The main Java package is:

- `ai.typerefinery.websight`

Important subareas include:

- `models`
  Component models used by rendering and JSON export.
- `services`
  Shared backend services, especially Flow-related services.
- `actions`
  UI and REST actions for pages, assets, and spaces.
- `authentication`
  Token-based authentication support.
- `publishing`
  Static publishing and publish processor logic.
- `clientlibs`
  Client library publishing and serving support.
- `repository`
  Repository and package utility helpers.
- `utils`
  Cross-cutting helpers used throughout the app.

## 5. CMS Resource and Content Model

This repository maps onto standard CMS-style resource areas.

### `/apps`

Defined primarily by:

- `application/backend/src/main/resources/apps/typerefinery`

This area contains the application-level definitions for:

- components
- templates
- dialogs
- clientlibs
- action scripts

The major groups under `components` are:

- `actions`
- `clientlibs`
- `content`
- `dialog`
- `flow`
- `forms`
- `graphs`
- `layout`
- `parsys`
- `stix`
- `structure`
- `widgets`

### `/content`

Packaged primarily by:

- `content/src/main/content`
- `tests/content/src/main/content`

This area contains authorable content structures such as pages, assets, showcase examples, and test pages.

### `/var`

This is not authored directly in the repository in the same way as `/apps` or `/content`, but it is important to the runtime architecture.

The Flow subsystem stores Flow-managed state in `/var/typerefinery/flow/...` rather than writing service-managed state back into `/content`. This avoids repository event loops and separates:

- user-authored metadata in `/content`
- service-managed synchronization state in `/var`

This is a key architectural decision in the repo.

## 6. Component Anatomy

A typical TypeRefinery component spans several files and concerns.

### Typical component pieces

For a given component, you may find:

- a Sling Model in Java
- a component folder under `apps/typerefinery/components/...`
- one or more HTL templates such as `component.html` or `variant.html`
- authoring dialog definitions
- a `README.md` describing usage and authoring
- `clientlibs/behaviour.js`
- `clientlibs/functions.js`
- `clientlibs/style.css`
- templates or sample JSON files for Flow-enabled components
- Cypress tests in `tests/end-to-end/tests/...`

### Example working pattern

When changing a component, the real change surface often spans:

1. authoring configuration
2. server-side model behavior
3. rendered markup
4. client-side behavior
5. sample or Flow template data
6. end-to-end verification

This repo rewards thinking in full component slices rather than single files.

## 7. Frontend Architecture

The standalone frontend module is relatively thin compared with the backend.

### What it does

The frontend module mainly:

- bundles shared SCSS
- copies resources into output locations
- packages static assets with webpack
- provides vendor libraries under `src/static/clientlibs`

Key files include:

- `application/frontend/package.json`
- `application/frontend/webpack.common.js`
- `application/frontend/webpack.dev.js`
- `application/frontend/webpack.prod.js`
- `application/frontend/src/main.ts`
- `application/frontend/src/main.scss`

### Practical interpretation

Most feature work in this repository does not start in the standalone frontend bundle. More often, it starts in:

- backend component resources
- component-specific clientlibs
- HTL templates
- Java models

The frontend module is still important because it owns shared asset packaging and a large curated vendor/clientlib set.

## 8. Flow Architecture

Flow is one of the most important subsystems in this repository.

### What Flow does

The Flow subsystem connects CMS components, especially forms and Flow-enabled widgets, to an external Flow service. It handles:

- provisioning flows from templates
- updating flow metadata
- generating client-facing URLs
- syncing changes from CMS resources
- tracking processing state
- pausing and resuming flows
- storing service-managed state in `/var`

### Core implementation areas

Important files and docs include:

- `application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java`
- `application/backend/src/main/java/ai/typerefinery/websight/jobs/flow/FlowSyncJobConsumer.java`
- `application/backend/src/main/java/ai/typerefinery/websight/events/flow/...`
- `application/backend/src/main/java/ai/typerefinery/websight/models/components/FlowComponent.java`
- `docs/flow/flow-service.md`
- `docs/flow/flow-execution-flow.md`
- `docs/flow/flow-sync-flow.md`

### Why Flow matters

Any change to Flow-enabled components can affect:

- authoring dialogs
- generated URLs
- external Flow API calls
- `/var` synchronization
- job processing
- local runtime assumptions

Flow work is typically higher-risk than a static component markup change.

## 9. Forms and Interactive Components

Forms are a major functional area in this repo.

### Form system shape

The form system includes:

- server-side form models
- reusable dialog field definitions
- component clientlibs for data collection, submit, load, and event wiring
- Flow integration for service-backed forms
- multiple field types such as input, checkbox, select, composite, file upload, and textarea

Important references:

- `application/backend/src/main/resources/apps/typerefinery/components/forms`
- `application/backend/src/main/resources/apps/typerefinery/components/forms/form/clientlibs/functions.js`
- `docs/forms/developer-guide.md`
- `docs/forms/*.md`

### Important behavior model

Form components are not just templates. They are a coordinated system involving:

- DOM scanning for field values
- event bus integration
- file upload handling
- optional read/write endpoints
- Flow event and endpoint wiring

Changes here often require both code review and functional testing.

## 10. REST Actions, Spaces, Publishing, and Auth

The repository includes several platform-level capabilities beyond visual components.

### Actions and REST

The `actions` and `rest` areas support custom operations around:

- pages
- assets
- spaces
- publish tree actions
- import/export operations

These capabilities are important when the repo is used as a CMS platform, not just a component library.

### Publishing

Publishing-related code supports static or transformed output behavior, especially around:

- assets
- pages
- clientlibs

### Authentication

Authentication support includes token-based logic in:

- `application/backend/src/main/java/ai/typerefinery/websight/authentication`

This is infrastructure-level code and should be treated carefully because behavior changes can affect all API or UI access.

## 11. Runtime and Local Environment

The local runtime is defined under:

- `environment/local`

Important files:

- `environment/local/docker-compose.yml`
- `environment/local/README.md`

### Local stack summary

The local environment runs:

- CMS container
- MongoDB
- nginx
- optional test helpers

Common local ports include:

- `8113` for the CMS container's internal application port
- `80` for published nginx-served pages

The local environment also passes Flow-related configuration through container environment variables.

## 12. Build, Package, and Deployment Model

The build model is mixed but consistent.

### Maven responsibilities

Maven drives:

- multi-module orchestration
- OSGi/backend packaging
- content package creation
- distribution assembly
- Docker image build
- some test aggregation

### Node responsibilities

Node tooling drives:

- frontend asset bundling
- Cypress test execution

### Common workflows

Typical workflows in this repo are:

- build the whole project with Maven
- run the local Docker environment
- deploy backend or content packages locally
- run Cypress tests against the local CMS instance

The PowerShell helper scripts at the repo root are thin workflow shortcuts around these operations.

## 13. Testing Strategy

Testing is not centralized in one place.

### Backend tests

Backend tests are relatively light and currently cover targeted areas such as:

- Flow service behavior
- selected component model behavior

Key location:

- `application/backend/src/test`

### End-to-end tests

The stronger safety net is the Cypress suite in:

- `tests/end-to-end`

Coverage includes:

- author mode
- preview mode
- widgets
- layout components
- forms
- dashboard pages

### Test content

The test suite depends on content in:

- `tests/content/src/main/content`

This means many UI tests are tightly coupled to the packaged showcase/test content model.

## 14. Documentation Landscape

The repository already contains several subsystem-level doc sets:

- `docs/flow`
  Detailed Flow architecture and operational behavior.
- `docs/forms`
  Form and field behavior documentation.
- `docs/dialog`
  Shared dialog element documentation.
- `docs/mcp`
  CMS/MCP integration strategy, tool discovery, and AI-assisted content workflows.

This document sits above those and should be treated as the repo-wide entry point.

## 15. How to Decide Where a Change Belongs

Use this quick routing guide.

### If the change is visual or markup-related

Start in:

- `application/backend/src/main/resources/apps/typerefinery/components/...`

Look for:

- `*.html`
- `variant.html`
- `clientlibs/style.css`

### If the change is model or authorable property related

Start in:

- `application/backend/src/main/java/ai/typerefinery/websight/models/...`
- component dialog definitions under component resource folders

### If the change affects behavior in the browser

Start in:

- `clientlibs/functions.js`
- `clientlibs/behaviour.js`

Then check whether end-to-end tests exist for that component.

### If the change affects forms or Flow-backed features

Start in:

- form component resources
- `FlowComponent`
- `FlowService`
- Flow docs

Assume broader system impact until proven otherwise.

### If the change affects runtime packaging or deployment

Start in:

- `distribution`
- `environment/local`
- root PowerShell scripts

### If the change affects authoring or content examples

Start in:

- `content`
- `tests/content`

## 16. High-Risk Areas

The following areas should be treated as system-sensitive:

- Flow synchronization and job handling
- authentication handlers
- publishing processors
- repository/package utilities
- shared form clientlibs
- structure/page templates that affect every page
- distribution and Docker build definitions

Changes in these areas can have wide impact even if the code edit is small.

## 17. Low-to-Medium Risk Areas

These are usually more contained:

- isolated component HTL changes
- component-local CSS
- component-local clientlib behavior
- component README updates
- test-only content updates
- targeted Cypress test additions

These can still ripple, but the blast radius is usually narrower.

## 18. Suggested Reading Order for New Contributors

For a new person or assistant joining the repo, this reading order is efficient:

1. `README.md`
2. this document
3. `pom.xml`
4. `application/pom.xml`
5. `application/backend/src/main/java/ai/typerefinery/websight/models/components/BaseComponent.java`
6. `docs/flow/flow-service.md`
7. `docs/forms/developer-guide.md`
8. one representative component folder under `application/backend/src/main/resources/apps/typerefinery/components`
9. `tests/end-to-end/README.md`
10. `environment/local/README.md`

## 19. Knowledge Framework Summary

The most useful mental model for this repository is:

- Maven assembles the project.
- `application/backend` defines the CMS application.
- `application/frontend` packages shared frontend assets.
- `content` and `tests/content` provide repository content structures.
- `distribution` turns modules into a runnable CMS image.
- `environment/local` runs the local stack.
- `tests/end-to-end` validates real user flows.
- Flow is the deepest cross-cutting subsystem and should be treated as a core platform concern.

If a future task touches rendering, authoring, behavior, data synchronization, and tests all at once, that is normal for this repo. The architecture is component-oriented, but many components are full-stack slices that span Java, HTL, JS, CSS, content, and operational docs.

