import Router from "@koa/router";
import Provider from "oidc-provider";
import { accounts } from "../accounts/accounts.js";
import { parseUrlEncodedBody } from "../util/parseUrlEncodedBody.js";

export const createInteractionRoutes = (provider: Provider): Router => {
  const interactionRouter = new Router();

  interactionRouter.get("/interaction/:uid", async (ctx) => {
    const details = await provider.interactionDetails(ctx.req, ctx.res);
    const { prompt, session } = details;

    // Already authenticated — skip the picker
    if (prompt.name === "consent" || (session && session.accountId)) {
      const accountId = session?.accountId ?? "";
      await provider.interactionFinished(ctx.req, ctx.res, {
        login: { accountId },
      });
      ctx.respond = false;
      return;
    }

    const accountOptions = [
      {
        value: "",
        text: "N/A",
        selected: true,
      },
      ...accounts.map((account) => ({
        value: account.sub,
        text: account.email,
      })),
    ];

    await ctx.render("auth.njk", {
      interactionUid: details.uid,
      accountOptions,
    });

    return;
  });

  interactionRouter.post("/interaction/:uid/login", async (ctx) => {
    const body = await parseUrlEncodedBody(ctx.req);
    const accountId = body.get("account");

    if (!accountId) {
      ctx.status = 400;
      ctx.body = "Missing accountId";
      return;
    }

    await provider.interactionFinished(ctx.req, ctx.res, {
      login: { accountId },
    });
    ctx.respond = false;
    return;
  });

  interactionRouter.post("/interaction/:uid/error", async (ctx) => {
    const body = await parseUrlEncodedBody(ctx.req);

    // TODO: handle errors issued at token exchange or userinfo
    if (body.get("errorWhere") !== "authorize") {
      throw new Error("Cannot return errors on token exchange or userinfo yet");
    }

    await provider.interactionFinished(ctx.req, ctx.res, {
      error: body.get("error"),
      error_description: body.get("error_description"),
    });
    ctx.respond = false;
    return;
  });

  return interactionRouter;
};
