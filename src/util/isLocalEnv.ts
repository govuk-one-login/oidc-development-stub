export const isLocalEnv = (): boolean =>
  typeof process.env.ENVIRONMENT === "undefined" ||
  process.env.ENVIRONMENT === "local" ||
  process.env.ENVIRONMENT?.length === 0;
