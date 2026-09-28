import { JWK, JWKS } from "oidc-provider";
import { getEnv } from "../util/getEnv.js";
import { importPKCS8, exportJWK } from "jose";
import { createPublicKey, createHash, KeyObject } from "node:crypto";
import { isLocalEnv } from "../util/isLocalEnv.js";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

let keys: JWK[] | undefined;
const ssmClient = new SecretsManagerClient({
  region: "eu-west-2",
  ...(process.env.FLOCI_ENDPOINT && {
    endpoint: process.env.FLOCI_ENDPOINT,
  }),
});
const secretSuffix = "oidc-provider-ec-signing-key"; // pragma: allowlist secret

export const getProviderPrivateKeys = async (): Promise<JWKS> => {
  if (keys) {
    return { keys };
  }

  let ecKeyPem: string;
  if (isLocalEnv()) {
    ecKeyPem = getEnv("LOCAL_PROVIDER_EC_SIGNING_KEY");
  } else {
    ecKeyPem = await getPrivateKeyFromSecretsManager();
  }

  const parsedJWK = await convertPrivatePemToJwkWithKid(ecKeyPem);
  keys = [parsedJWK];

  return { keys };
};

const getPrivateKeyFromSecretsManager = async (): Promise<string> => {
  try {
    const getSecretOutput = await ssmClient.send(
      new GetSecretValueCommand({
        SecretId: `${process.env.ENVIRONMENT}-${secretSuffix}`,
      })
    );
    return getSecretOutput.SecretString!;
  } catch (err) {
    console.error(
      "Failed to get secrets manager ec signing key: " + (err as Error).message
    );
    throw new Error("Failed to get secrets manager ec signing key:", {
      cause: err,
    });
  }
};

const convertPrivatePemToJwkWithKid = async (
  pemString: string
): Promise<JWK> => {
  const privateKey = await importPKCS8(pemString, "ES256", {
    extractable: true,
  });
  const privateJwk = await exportJWK(privateKey);
  const kid = sha256(
    createPublicKey(KeyObject.from(privateKey)).export({
      type: "spki",
      format: "pem",
    })
  );
  privateJwk.kid = kid;
  return privateJwk;
};

const sha256 = (content: string): string => {
  return createHash("sha256").update(content).digest("hex");
};
