import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { ENV } from "./env";
import { sdk } from "./sdk";
import * as db from "../db";

// Dev-mode fake admin user (used when OAuth is not configured)
const DEV_ADMIN_OPEN_ID = "dev-admin-local";

async function getOrCreateDevAdmin(): Promise<User> {
  let user = await db.getUserByOpenId(DEV_ADMIN_OPEN_ID);
  if (!user) {
    await db.upsertUser({
      openId: DEV_ADMIN_OPEN_ID,
      name: "Local Admin",
      email: "admin@localhost",
      role: "admin",
      lastSignedIn: new Date(),
    });
    user = await db.getUserByOpenId(DEV_ADMIN_OPEN_ID);
  }
  return user!;
}

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // If OAuth is not configured, bypass auth with a local admin user
  if (!ENV.oAuthServerUrl) {
    user = await getOrCreateDevAdmin();
  } else {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
