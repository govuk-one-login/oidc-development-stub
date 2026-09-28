import { generateKeyPairSync } from "node:crypto";

export const generateTestEcJWK = (): JsonWebKey => {
  const { privateKey } = generateKeyPairSync("ec", {
    namedCurve: "P-256",
    privateKeyEncoding: { type: "pkcs8", format: "jwk" },
  });
  return privateKey;
};
