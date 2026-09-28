export type EnvironmentVariable =
  "LOCAL_PROVIDER_EC_SIGNING_KEY" | "PROVIDER_ISSUER";

export const getEnv = (name: EnvironmentVariable): string => {
  const variable = process.env[name];

  if (!variable) {
    throw new Error("Unset environment variable: " + name);
  }

  return variable;
};
