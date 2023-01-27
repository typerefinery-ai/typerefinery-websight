# How to contribute
Typerefinery WebSight CMS Project.

## Feature Requests
Feature Requests by the community are highly encouraged. Feel free to [submit a new one](https://github.com/innovolve-ai/typerefinery-websight/issues/new?assignees=&labels=&template=feature_request.md&title=).

## Bugs
Typerefinery WebSight CMS Project is using [GitHub issues](https://github.com/innovolve-ai/typerefinery-websight/issues) to manage bugs. We keep a close eye on them. Before filing a new issue, try to ensure your problem does not already exist.

## Code of Conduct
This project, and everyone participating in it, are governed by the [WebSight Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold it. Make sure to read the [full text](CODE_OF_CONDUCT.md) to understand which type of actions may or may not be tolerated.

## Documentation

Pull requests related to fixing documentation for the latest release should be directed towards the [documentation repository](https://github.com/websight-io/docs).

## Before Submitting a Pull Request

### Coding standards

Follow Google Style Guide code formatting, particularly set your IDE `tab size`/`ident` to 2 spaces 
and `continuation ident` to 4 spaces.
  - [Google Style Guide for Eclipse](https://raw.githubusercontent.com/google/styleguide/gh-pages/eclipse-java-google-style.xml)
  - [Google Style Guide for IntelliJ](https://raw.githubusercontent.com/google/styleguide/gh-pages/intellij-java-google-style.xml)

Additionally, we use the `maven-checkstyle-plugin` plugin to validate all rules, so if there is some
checkstyle issue, our `mvn clean install` should fail with the message:

```bash
[INFO] Starting audit...
[WARN] /Projects/websight/projects/howlite/core/src/main/java/pl/ds/howlite/components/models/AccordionItemComponent.java:12:8: 'member def modifier' has incorrect indentation level 7, expected level should be 2. [Indentation]
[WARN] /Projects/websight/projects/howlite/core/src/main/java/pl/ds/howlite/components/models/AccordionItemComponent.java:13:3: Annotation 'Inject' have incorrect indentation level 2, expected level should be 7. [AnnotationLocationVariables]
[WARN] /Projects/websight/projects/howlite/core/src/main/java/pl/ds/howlite/components/models/AccordionItemComponent.java:14:3: Annotation 'Default' have incorrect indentation level 2, expected level should be 7. [AnnotationLocationVariables]
Audit done.
```

