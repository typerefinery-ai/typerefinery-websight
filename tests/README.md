# Tests
This module is responsible for the automatic distribution validation.

It contains:
- [content](./content) - providing test content
- [end-to-end](./end-to-end) - end-to-end tests

## How to run

```bash
mvn clean verify -P e2e
```

First we need to start a docker container with Mongo:
```bash
docker run -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=mongoadmin -e MONGO_INITDB_ROOT_PASSWORD=mongoadmin mongo:4.4.6
```

Then from `end-to-end` run the CMS with debug mode:
```bash
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=localhost:5005 \
-jar target/dependency/org.apache.sling.feature.launcher.jar  \
-f target/slingfeature-tmp/feature-typerefinery-tests.json
```