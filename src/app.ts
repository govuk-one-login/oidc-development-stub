import express, { Request, Response, Express } from "express";
import { createOidcProvider } from "./provider/create-oidc-provider.js";
import { isLocalEnv } from "./util/isLocalEnv.js";
import path from "path";
const __dirname = import.meta.dirname;

export const createApp = async (): Promise<Express> => {
  const app = express();
  const oidcProvider = await createOidcProvider();

  app.get("/healthcheck", (req: Request, res: Response) => {
    res.status(200).send("OK");
  });

  if (isLocalEnv()) {
    app.use(express.static(path.join(__dirname, "./../public")));
  } else {
    app.use("/assets", express.static(path.join("/opt", "assets")));
  }
  app.use(oidcProvider.callback());
  app.set("trust proxy", true);
  return app;
};
