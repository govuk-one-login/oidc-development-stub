import Provider from "oidc-provider";
import nunjucks from "nunjucks";
import path from "path";
import { isLocalEnv } from "../util/isLocalEnv.js";
const __dirname = import.meta.dirname;

export const configureNunjucks = (provider: Provider): void => {
  // /opt is the dir used for lambda layers
  const viewsDir = isLocalEnv() ? path.join(__dirname, "..", "views") : "/opt";

  const govukFrontendViews = isLocalEnv()
    ? path.resolve("node_modules/govuk-frontend/dist/")
    : path.join("/opt", "nodejs", "node_modules/govuk-frontend/dist/");

  nunjucks.configure([viewsDir, govukFrontendViews], {
    autoescape: true,
    trimBlocks: true,
  });

  provider.context.render = function (
    path: string,
    data: Record<string | number, unknown>
  ): void {
    this.body = nunjucks.render(path, data);
  };
};
