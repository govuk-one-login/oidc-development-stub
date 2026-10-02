/* eslint-disable  @typescript-eslint/no-unused-expressions */
import { createApp } from "./app.js";

const port = process.env.PORT || 3002;
(async (): Promise<void> => {
  const app = await createApp();

  app.listen(port, () => {
    console.log(`[server] OIDC provider is running on port: ${port}\n\n`);
    console.log(
      `[server] Hit the healthcheck http://localhost:${port}/healthcheck`
    );
    console.log(
      `[server] Hit the discovery endpoint at http://localhost:${port}/.well-known/openid-configuration`
    );
  });
  return;
})();
