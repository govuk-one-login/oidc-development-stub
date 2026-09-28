import request from "supertest";
import { createApp } from "../app.js";
import { Express } from "express";
import { generateTestEcJWK } from "./test-utils/keyHelpers.js";
import { getClientConfig } from "../client/get-client-config.js";
import { getProviderPrivateKeys } from "../provider/get-provider-private-keys.js";

vi.mock("../client/get-client-config.js", () => ({
  getClientConfig: vi.fn(),
}));

vi.mock("../provider/get-provider-private-keys.js", () => ({
  getProviderPrivateKeys: vi.fn(),
}));

describe("app api tests", () => {
  let app: Express;
  const mockProviderJWKs = { keys: [generateTestEcJWK()] };
  const mockClient = [
    {
      provider_url: "http://localhost:9001",
      client_id: "consumer",
      client_secret: "", // pragma: allowlist secret
      redirect_uris: ["http://localhost:9001/consumer/callback"],
      post_logout_redirect_uris: ["http://localhost:9001/consumer"],
    },
  ];

  beforeEach(async () => {
    vi.mocked(getClientConfig).mockResolvedValue(mockClient);
    vi.mocked(getProviderPrivateKeys).mockResolvedValue(mockProviderJWKs);
    process.env.PROVIDER_ISSUER = "http://localhost:3002";
    app = await createApp();
  });

  it("has a healthcheck endpoint", async () => {
    const response = await request(app).get("/healthcheck");

    expect(response.status).toBe(200);
    expect(response.text).toEqual("OK");
  });

  it("has an openid config endpoint attached to the app", async () => {
    const response = await request(app).get(
      "/.well-known/openid-configuration"
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      //Can't assert on the whole structure as the port rotates between test runs
      code_challenge_methods_supported: ["S256"],
    });
  });
});
