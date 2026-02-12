import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { jwtVerify } from "jose";
import { ENV } from "./env";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

function getSessionSecret() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const cookieHeader = opts.req.headers.cookie;
    if (cookieHeader) {
      const cookies = parseCookieHeader(cookieHeader);
      const token = cookies[COOKIE_NAME];
      if (token) {
        const secretKey = getSessionSecret();
        const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
        const userId = payload.userId as number;
        if (userId) {
          const dbUser = await db.getUserById(userId);
          if (dbUser) {
            user = dbUser;
          }
        }
      }
    }
  } catch (error) {
    // Invalid or expired token - user stays null
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
