import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";
import { SignJWT } from "jose";
import { ENV } from "./env";
import * as db from "../db";
import bcrypt from "bcryptjs";

function getSessionSecret() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

async function createSessionToken(userId: number, email: string): Promise<string> {
  const secretKey = getSessionSecret();
  const expiresInMs = ONE_YEAR_MS;
  const expirationSeconds = Math.floor((Date.now() + expiresInMs) / 1000);

  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

export function registerOAuthRoutes(app: Express) {
  // Simple login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان" });
        return;
      }

      // Find user by email
      const user = await db.getUserByEmail(email);
      if (!user || !user.password) {
        res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        return;
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        return;
      }

      // Check if user is admin
      if (user.role !== "admin") {
        res.status(403).json({ error: "ليس لديك صلاحيات المسؤول" });
        return;
      }

      // Update last signed in
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });

      // Create session token
      const sessionToken = await createSessionToken(user.id, user.email || "");
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      res.status(500).json({ error: "حدث خطأ في تسجيل الدخول" });
    }
  });
}
