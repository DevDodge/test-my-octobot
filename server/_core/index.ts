import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import fs from "fs";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { seedDefaultAdmin, getDb } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function runMigration() {
  const db = await getDb();
  if (!db) {
    console.warn("[Migration] Database not available, skipping migration");
    return;
  }
  try {
    // Add password column if it doesn't exist
    await db.execute({
      sql: `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" text`,
      params: [],
    } as any);
    console.log("[Migration] Password column ensured");
  } catch (error: any) {
    // Column might already exist, that's fine
    if (!error.message?.includes("already exists")) {
      console.warn("[Migration] Warning:", error.message);
    }
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Run migration and seed
  await runMigration();
  await seedDefaultAdmin();

  // Serve uploaded files
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  app.use("/uploads", express.static(uploadsDir));

  // Audio proxy for Google Drive files (bypass CORS)
  app.get("/api/audio-proxy", async (req, res) => {
    const fileId = req.query.id as string;
    if (!fileId) {
      res.status(400).json({ error: "Missing file id" });
      return;
    }
    try {
      const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const response = await (await import("axios")).default.get(driveUrl, {
        responseType: "stream",
        maxRedirects: 10,
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      const contentType = response.headers["content-type"] || "audio/mpeg";
      const contentLength = response.headers["content-length"];
      res.setHeader("Content-Type", contentType);
      if (contentLength) res.setHeader("Content-Length", contentLength);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Cache-Control", "public, max-age=86400");
      response.data.pipe(res);
    } catch (err: any) {
      console.error("[audio-proxy] Error:", err.message);
      res.status(502).json({ error: "Failed to fetch audio" });
    }
  });

  // Auth routes (login endpoint)
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
