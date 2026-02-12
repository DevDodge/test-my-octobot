export const ENV = {
  appId: process.env.VITE_APP_ID ?? "dk-octobot",
  cookieSecret: process.env.JWT_SECRET ?? "dk-octobot-secret-key-change-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
