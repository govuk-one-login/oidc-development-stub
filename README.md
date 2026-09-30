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

To get started with either local running mode, make a copy of the `.env.example` file and create a valid EC signing key, populating the env var `LOCAL_PROVIDER_EC_SIGNING_KEY` with the PEM encoded private key in PKCS#8 format. Note this should include new lines:

```
LOCAL_PROVIDER_EC_SIGNING_KEY="-----BEGIN PRIVATE KEY-----
include
new
lines
-----END PRIVATE KEY-----"
```

Once this `.env` is populated, spin up the floci container the following command:

```sh
npm run localstack:up
```

### Client Config

To update the configured clients, copy the `config.template.json` into a file called `config.local.json`. This will be used when running locally to setup the registered clients of the stub.

### 1: Running the express server directly

This is best for local development and should be how the application is ran most of the time. To run this, copy the `.env.example` to `.env` and generate a PEM formatted EC signing key for the application to use. Ensure the key is formatted in PKCS#8 format. Running in this mode will use the local client configuration defined in `config.local.json`.

To start the express server run the following command:

```sh
npm run start:express
```

### 2: Running using SAM local

Running in this mode is best for fully replicating what the deployed environment looks like. This will build the lambda function and layers according to the `template.yaml` file.

To run in this mode set the following value in your `.env` file: `ENVIRONMENT=sam-local`

To build the lambda and layer run the following command:

```sh
npm run build:lambda
```

and to start sam local run this command:

```sh
npm run start:sam:local
```
