# OIDC Development Stub

This is an OIDC provider stub that allows mocking out OIDC interactions using the [node-oidc-provider](https://github.com/panva/node-oidc-provider) package. This stub runs as an express application locally and when deployed as an AWS lambda function with an API gateway with a proxy configuration. For persistence storage of OIDC data, this uses DyanmoDB.

## Getting started

This project uses pre-commit hooks to ensure linting and code formatting is ran before each commit, and can be setup by running the following command:

```sh
pre-commit install
```

Once this is done, dependencies can be installed by running the following command:

```sh
npm ci
```

## Running locally

Because the stub is an express app mounted via an AWS lambda function, there are a couple of ways to run it locally.

For stubbing out AWS interactions, this project uses floci. To spin up the floci container, run the following command:

```sh
npm run localstack:up
```

### 1: Running the express server directly

This is best for local development and should be how the application is ran most of the time. To run this, copy the `.env.example` to `.env` and generate a PEM formatted EC signing key for the application to use. Ensure the key is formatted in PKCS#8 format. Running in this mode will use the local client configuration defined in `config.local.json`.

To start the express server run the following command:

```sh
npm run start:express
```

### 2: Running using SAM local

Running in this mode is best for fully replicating what the deployed environment looks like. This will build the lambda function and layers according to the `template.yaml` file. To build the lambda and layer run the following command:

```sh
npm run build:lambda
```

and to start sam local run this command:

```sh
npm run start:sam:local
```
