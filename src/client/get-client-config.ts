import { readFile } from "fs/promises";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { ClientMetadata } from "oidc-provider";
import { isLocalEnv } from "../util/isLocalEnv.js";

const ssmClient = new SecretsManagerClient({
  region: "eu-west-2",
  ...(process.env.FLOCI_ENDPOINT && {
    endpoint: process.env.FLOCI_ENDPOINT,
  }),
});
export const secretSuffix = "oidc-stub-client-config"; // pragma: allowlist secret

let cachedConfg: ClientMetadata[];

export const getClientConfig = async (): Promise<ClientMetadata[]> => {
  if (isLocalEnv()) {
    return await getLocalConfig();
  }
  return await getSecretsManagerConfig();
};

const getLocalConfig = async (): Promise<ClientMetadata[]> => {
  try {
    const config = await readFile("config.local.json", "utf8");
    return JSON.parse(config);
  } catch (err) {
    console.error("Failed to get local config: " + (err as Error).message);
    throw new Error("Failed to get local config", { cause: err });
  }
};

const getSecretsManagerConfig = async (): Promise<ClientMetadata[]> => {
  if (cachedConfg) {
    return cachedConfg;
  }
  try {
    const getSecretOutput = await ssmClient.send(
      new GetSecretValueCommand({
        SecretId: `${process.env.ENVIRONMENT}-${secretSuffix}`,
      })
    );

    const secretString = getSecretOutput.SecretString!;
    const parsedConfig = JSON.parse(secretString);
    cachedConfg = parsedConfig;
    return cachedConfg;
  } catch (err) {
    console.error(
      "Failed to get secrets manager config: " + (err as Error).message
    );
    throw new Error("Failed to get secrets manager config", { cause: err });
  }
};
