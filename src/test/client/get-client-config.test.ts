import { ClientMetadata } from "oidc-provider";
import { mockClient } from "aws-sdk-client-mock";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import {
  getClientConfig,
  secretSuffix,
} from "../../client/get-client-config.js";

const expectedConfig: Partial<ClientMetadata> = {
  provider_url: "http://localhost:9001",
  client_id: "consumer",
  client_secret: "consumer-secret", // pragma: allowlist secret
  redirect_uris: ["http://localhost:9001/consumer/callback"],
  post_logout_redirect_uris: ["http://localhost:9001/consumer"],
};

vi.mock("fs/promises", () => {
  return {
    readFile: vi.fn().mockResolvedValue(
      JSON.stringify({
        provider_url: "http://localhost:9001",
        client_id: "consumer",
        client_secret: "consumer-secret", // pragma: allowlist secret
        redirect_uris: ["http://localhost:9001/consumer/callback"],
        post_logout_redirect_uris: ["http://localhost:9001/consumer"],
      })
    ),
  };
});

describe("fetch configuration", () => {
  beforeEach(() => {
    delete process.env.ENVIRONMENT;
  });

  it("should fetch configuration from local config file if environment is not set", async () => {
    const actualConfig = await getClientConfig();

    expect(actualConfig).toStrictEqual(expectedConfig);
  });

  it("should fetch configuration from AWS secret if environment is set", async () => {
    process.env.ENVIRONMENT = "dev";
    const smMock = mockClient(SecretsManagerClient);
    smMock.on(GetSecretValueCommand).resolves({
      SecretString: JSON.stringify(expectedConfig),
    });

    const actualConfig = await getClientConfig();

    expect(actualConfig).toStrictEqual(expectedConfig);
    expect(smMock).toReceiveCommandWith(GetSecretValueCommand, {
      SecretId: `${process.env.ENVIRONMENT}-${secretSuffix}`,
    });
  });
});
