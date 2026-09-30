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
import { getProviderPrivateKeys } from "./get-provider-private-keys.js";

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
    },

    pkce: {
      required: (): true => true,
    },
    ttl: {
      Session: (): number => 1800, // 30 mins
      AccessToken: (): number => 180, // 3 mins
      AuthorizationCode: (): number => 300, // 5 mins
      IdToken: (): number => 180, // 3 mins,
      Interaction: (): number => 900, // 15 mins,
      RefreshToken: (): number => 180, // 3 mins,
      Grant: (): number => 900, // 15 mins
    },
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

      grant.addOIDCScope("openid");
      await grant.save();
      return grant;
    },
  });
  configureNunjucks(provider);
  const interactionRouter = createInteractionRoutes(provider);
  provider.use(interactionRouter.routes());
  provider.proxy = true;
  return provider;
};
