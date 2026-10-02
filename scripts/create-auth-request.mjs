import { randomBytes } from "crypto";
import { readFileSync } from "fs";

const createAuthRequest = () => {
  let config;
  try {
    const file = readFileSync("config.local.json", "utf8");
    config = JSON.parse(file);
  } catch (err) {
    console.error("Failed to get local config: " + err.message);
    throw new Error("Failed to get local config", { cause: err });
  }
  const client = config[0];
  const qp = {
    client_id: client.client_id,
    state: randomBytes(32).toString("base64url"),
    nonce: randomBytes(32).toString("base64url"),
    redirect_uri: client.redirect_uris[0],
    response_type: "code",
    scope: "openid",
    state: randomBytes(32).toString("base64url"),
    code_challenge: randomBytes(32).toString("base64url"),
    code_challenge_method: "S256",
  };

  const authReq =
    "http://localhost:3002/authorize?" + new URLSearchParams(qp).toString();

  console.log("Authorize request: " + authReq);
};

createAuthRequest();
