import Provider, {
  Account,
  AccountClaims,
  CanBePromise,
  Grant,
} from "oidc-provider";
import { accounts } from "../accounts/accounts.js";
import { createDynamoDbAdapter } from "../adapter/create-dynamo-adapter.js";
import { getClientConfig } from "../client/get-client-config.js";
import { configureNunjucks } from "../nunjucks/configureNunjucks.js";
import { createInteractionRoutes } from "../ui/interactionRoutes.js";
import { getEnv } from "../util/getEnv.js";
import { getProviderPrivateKeys, sha256 } from "./get-provider-private-keys.js";
import { isLocalEnv } from "../util/isLocalEnv.js";

const SCOPES = ["openid", "email"];

export const createOidcProvider = async (): Promise<Provider> => {
  const clients = await getClientConfig();
  const providerKeys = await getProviderPrivateKeys();
  const provider = new Provider(getEnv("PROVIDER_ISSUER"), {
    clients: clients,
    jwks: providerKeys,
    adapter: createDynamoDbAdapter(),
    routes: {
      //Overwrite these to more expected values, as the defaults aren't what you expect
      authorization: "/authorize", // default: /auth
      jwks: "/.well-known/jwks.json", // default: /jwks
      userinfo: "/userinfo", // default: /me
      end_session: "/logout", //default /session/end
    },
    features: {
      devInteractions: { enabled: false },
      requestObjects: { enabled: true },
    },

    pkce: {
      required: (): true => true,
    },
    claims: {
      openid: ["sub"],
      email: ["email", "email_verified"],
    },
    ttl: {
      Session: 1800, // 30 mins
      AccessToken: 180, // 3 mins
      AuthorizationCode: 300, // 5 mins
      IdToken: 180, // 3 mins,
      Interaction: 900, // 15 mins,
      RefreshToken: 180, // 3 mins,
      Grant: 900, // 15 mins
      ClientCredentials: 3 * 60, // 3 mins
    },
    subjectTypes: ["pairwise"],
    clientAuthMethods: [
      "private_key_jwt",
      // client_secret_post
    ],
    responseTypes: ["code"],
    findAccount: (_ctx, id): CanBePromise<Account | undefined> => {
      const account = accounts.find((a) => a.sub === id);
      if (!account) return undefined;

      return {
        accountId: account.sub,
        claims: (use: string): CanBePromise<AccountClaims> => {
          const base = {
            sub: account.sub,
            name: account.name,
            email: account.email,
            email_verified: account.email_verified,
          };

          const extra =
            use === "userinfo" ? account.userinfoClaims : account.tokenClaims;

          return { ...base, ...extra };
        },
      };
    },

    loadExistingGrant: async (ctx): Promise<Grant | undefined> => {
      const { oidc } = ctx;
      const grantId =
        oidc.result?.consent?.grantId ??
        oidc.session!.grantIdFor(oidc.client!.clientId);

      if (grantId) {
        return ctx.oidc.provider.Grant.find(grantId);
      }

      const grant = new ctx.oidc.provider.Grant({
        accountId: oidc.session!.accountId,
        clientId: oidc.client!.clientId,
      });

      SCOPES.forEach((scope) => grant.addOIDCScope(scope));
      await grant.save();
      return grant;
    },
    fetch: async (url, options): Promise<Response> => {
      const fetchOptions = { ...options };
      if (isLocalEnv()) {
        // Only do this in the local env as the package
        // attaches a custom dispatcher to all requests
        // which blocks local/private reservered IPs
        // to prevent SSRF. This blocks localhost
        // which blocks running locally when fetching our
        // JWKS endpoint
        delete (fetchOptions as Response & { dispatcher: unknown }).dispatcher;
      }

      const newHeaders = new Headers(fetchOptions.headers);
      newHeaders.append("User-Agent", "OidcStub");
      fetchOptions.headers = newHeaders;
      return fetch(url, fetchOptions);
    },
    pairwiseIdentifier: (_ctx, accountId, client): string => {
      return `urn:stub-id:${sha256(`${accountId}:${client.clientId}`)}`;
    },
  });
  configureNunjucks(provider);
  provider.on("server_error", (ctx, err) => {
    console.error(`Error on path ${ctx.path}`);
    console.error(`Error: ${err}`);
  });
  provider.on("authorization.error", (ctx, err) => {
    console.error(`Error on path ${ctx.path}`);
    console.error(`Error: ${err}`);
    console.error(`Error: ${err.cause}`);
  });
  const interactionRouter = createInteractionRoutes(provider);
  provider.use(interactionRouter.routes());
  provider.proxy = true;
  return provider;
};
