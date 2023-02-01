[![CI](https://github.com/typerefinery-ai/typerefinery-websight/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/typerefinery-ai/typerefinery-websight/actions/workflows/ci.yml)

# Typerefinery WebSight CMS Project

This project is adapted from WebSight Starter.

## Development

### Prerequisites

- [AdoptOpenJDK 17](https://adoptium.net/) with `x64`/`aarch64` architecture (on mac use `brew install openjdk@17`).
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### How to build

First, build and install he project with Maven:

```bash
./mvnw clean install
```

Run the command

```bash
./mvnw clean verify -P e2e
```

to build the sample websight, aggregate all required CMS dependencies, run end-to-end tests with Cypress, build Docker images (`ds/nginx-luna:latest`, `ds/websight-cms-luna:latest`).

### How to run

Once you have build the project, you can run local containerized environment:

```bash
cd environment/local
docker compose up
```

## Project structure

- `application` - components related code and scripts
    - `backend` - contains application elements (components, templates, etc.) and Java code
- `content` - contains sample content created with use of application
- `distribution` - builds a distribution of the project - instance feature model and docker images for runtime components
- `environment` - contains scripts and files used but build environment
    - `local` - starts local environment
- `tests` - responsible for the automatic distribution validation
    - `content` - contains content used for end to end tests
    - `end-to-end` - end-to-end tests validating distribution

## Contributing
Please read our [Contributing Guide](./CONTRIBUTING.md) before submitting a Pull Request to the project.

## Deploy

To install application code to your local instance:

```bash
./mvnw -f application/backend/pom.xml clean install -P autoInstallBundle
```

To install content to your local instance:

```bash
./mvnw -f content/pom.xml clean install -P autoInstallPackage
```
