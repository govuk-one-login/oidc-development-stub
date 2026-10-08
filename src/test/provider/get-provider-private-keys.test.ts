import { mockClient } from "aws-sdk-client-mock";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { generateKeyPairSync } from "node:crypto";
import { JWKS } from "oidc-provider";

const ssmMock = mockClient(SecretsManagerClient);

const generateValidEcPem = (): string => {
  const { privateKey } = generateKeyPairSync("ec", {
    namedCurve: "P-256",
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return privateKey;
};

describe("getProviderPrivateKeys", () => {
  const mockPem = generateValidEcPem();
  let getProviderPrivateKeys: () => Promise<JWKS>;

  beforeEach(async () => {
    // Weird import needed here to clear the local caching of keys between test runs
    getProviderPrivateKeys = (
      await import("./../../provider/get-provider-private-keys.js")
    ).getProviderPrivateKeys;
    vi.resetModules();

    vi.clearAllMocks();
    ssmMock.reset();
  });

  afterEach(() => {
    delete process.env.ENVIRONMENT;
    delete process.env.LOCAL_PROVIDER_EC_SIGNING_KEY;
  });

  it("should return keys from local environment when running locally", async () => {
    process.env.LOCAL_PROVIDER_EC_SIGNING_KEY = mockPem;

    const result = await getProviderPrivateKeys();
    expect(ssmMock.calls()).toHaveLength(0);

    expect(result.keys).toHaveLength(1);
    expect(result.keys[0]).toMatchObject({
      kty: "EC",
      crv: "P-256",
    });
    expect(result.keys[0].kid).toBeDefined();
  });

  it("should fetch key from Secrets Manager when not in local environment", async () => {
    process.env.ENVIRONMENT = "dev";
    ssmMock.on(GetSecretValueCommand).resolves({
      SecretString: mockPem,
    });

    const result = await getProviderPrivateKeys();

    expect(ssmMock.calls()).toHaveLength(1);
    expect(ssmMock).toHaveReceivedCommandWith(GetSecretValueCommand, {
      SecretId: "dev-oidc-provider-ec-signing-key", //pragma: allowlist secret
    });
    expect(result.keys).toHaveLength(1);
    expect(result.keys[0].kid).toBeDefined();
    expect(result.keys[0]).toMatchObject({
      kty: "EC",
      crv: "P-256",
    });
  });

  it("should return cached keys on subsequent calls without calling Secrets Manager again", async () => {
    process.env.ENVIRONMENT = "dev";
    ssmMock.on(GetSecretValueCommand).resolves({
      SecretString: mockPem,
    });

    const result1 = await getProviderPrivateKeys();
    const result2 = await getProviderPrivateKeys();

    expect(ssmMock.calls()).toHaveLength(1);
    expect(result1.keys).toHaveLength(1);
    expect(result2.keys).toHaveLength(1);
    expect(result1).toStrictEqual(result2);
  });

  it("should log and re-throw an error if Secrets Manager call fails", async () => {
    process.env.ENVIRONMENT = "dev";
    ssmMock
      .on(GetSecretValueCommand)
      .rejects(new Error("AWS Secret not found"));

    await expect(getProviderPrivateKeys()).rejects.toThrow(
      "Failed to get secrets manager ec signing key:"
    );
  });
});
