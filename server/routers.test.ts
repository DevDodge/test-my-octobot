import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createNonAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
    });
  });
});

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated users", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Admin User");
    expect(result?.role).toBe("admin");
  });
});

describe("bots router - access control", () => {
  it("rejects unauthenticated users from listing bots", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.bots.list()).rejects.toThrow();
  });

  it("rejects non-admin users from listing bots", async () => {
    const { ctx } = createNonAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.bots.list()).rejects.toThrow();
  });
});

describe("bots router - CRUD", () => {
  it("creates a bot and lists it", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const { id } = await caller.bots.create({
      name: "Test Bot",
      clientName: "Test Client",
      flowiseApiUrl: "https://flowise.example.com/api/v1/prediction/test-id",
    });

    expect(id).toBeDefined();
    expect(typeof id).toBe("number");

    const bots = await caller.bots.list();
    expect(bots.length).toBeGreaterThanOrEqual(1);
    const created = bots.find((b) => b.id === id);
    expect(created).toBeDefined();
    expect(created?.name).toBe("Test Bot");
    expect(created?.clientName).toBe("Test Client");
    expect(created?.status).toBe("active");
  });

  it("updates a bot", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const { id } = await caller.bots.create({
      name: "Update Bot",
      clientName: "Update Client",
      flowiseApiUrl: "https://flowise.example.com/api/v1/prediction/update-id",
    });

    await caller.bots.update({ id, name: "Updated Bot Name", status: "paused" });

    const bot = await caller.bots.getById({ id });
    expect(bot?.name).toBe("Updated Bot Name");
    expect(bot?.status).toBe("paused");
  });

  it("deletes a bot", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const { id } = await caller.bots.create({
      name: "Delete Bot",
      clientName: "Delete Client",
      flowiseApiUrl: "https://flowise.example.com/api/v1/prediction/delete-id",
    });

    await caller.bots.delete({ id });

    const bot = await caller.bots.getById({ id });
    expect(bot).toBeUndefined();
  });
});

describe("teams router", () => {
  it("creates a team and lists it", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const { id } = await caller.teams.create({ name: "QA Team" });
    expect(id).toBeDefined();

    const teams = await caller.teams.list();
    const created = teams.find((t) => t.id === id);
    expect(created).toBeDefined();
    expect(created?.name).toBe("QA Team");
  });

  it("adds and removes team members", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const { id: teamId } = await caller.teams.create({ name: "Dev Team" });
    const { id: memberId } = await caller.teams.members.add({ teamId, memberName: "Alice" });

    const members = await caller.teams.members.list({ teamId });
    expect(members.length).toBeGreaterThanOrEqual(1);
    const alice = members.find((m) => m.id === memberId);
    expect(alice?.memberName).toBe("Alice");

    await caller.teams.members.remove({ id: memberId });
    const afterRemove = await caller.teams.members.list({ teamId });
    expect(afterRemove.find((m) => m.id === memberId)).toBeUndefined();
  });
});

describe("testers router", () => {
  it("creates a tester with share token", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a bot first
    const { id: botId } = await caller.bots.create({
      name: "Tester Bot",
      clientName: "Tester Client",
      flowiseApiUrl: "https://flowise.example.com/api/v1/prediction/tester-id",
    });

    const { id, shareToken } = await caller.testers.create({
      name: "Tester One",
      email: "tester@example.com",
      botId,
    });

    expect(id).toBeDefined();
    expect(shareToken).toBeDefined();
    expect(shareToken.length).toBe(16);

    const testers = await caller.testers.list();
    const created = testers.find((t) => t.id === id);
    expect(created).toBeDefined();
    expect(created?.name).toBe("Tester One");
  });
});

describe("sessions router - getOrCreate", () => {
  it("creates a session for a valid tester token", async () => {
    const { ctx } = createAdminContext();
    const adminCaller = appRouter.createCaller(ctx);

    // Create bot and tester
    const { id: botId } = await adminCaller.bots.create({
      name: "Session Bot",
      clientName: "Session Client",
      flowiseApiUrl: "https://flowise.example.com/api/v1/prediction/session-id",
    });

    const { shareToken } = await adminCaller.testers.create({
      name: "Session Tester",
      botId,
    });

    // Public caller creates session
    const { ctx: publicCtx } = createPublicContext();
    const publicCaller = appRouter.createCaller(publicCtx);

    const result = await publicCaller.sessions.getOrCreate({ shareToken });
    expect(result.session).toBeDefined();
    expect(result.bot).toBeDefined();
    expect(result.tester).toBeDefined();
    expect(result.session.status).toBe("live");
    expect(result.messages).toEqual([]);
  });

  it("rejects invalid share tokens", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.sessions.getOrCreate({ shareToken: "invalid-token" })).rejects.toThrow("Invalid share link");
  });
});

describe("reviews router", () => {
  it("submits a review for a session", async () => {
    const { ctx } = createAdminContext();
    const adminCaller = appRouter.createCaller(ctx);

    // Setup
    const { id: botId } = await adminCaller.bots.create({
      name: "Review Bot",
      clientName: "Review Client",
      flowiseApiUrl: "https://flowise.example.com/api/v1/prediction/review-id",
    });

    const { shareToken } = await adminCaller.testers.create({
      name: "Review Tester",
      botId,
    });

    const { ctx: publicCtx } = createPublicContext();
    const publicCaller = appRouter.createCaller(publicCtx);

    const { session } = await publicCaller.sessions.getOrCreate({ shareToken });

    const result = await publicCaller.reviews.submit({
      sessionId: session.id,
      rating: 4,
      comment: "Great bot!",
      shareToken,
    });

    expect(result.success).toBe(true);

    // Verify session was updated
    const updatedSession = await adminCaller.sessions.getDetail({ id: session.id });
    expect(updatedSession?.session.reviewSubmitted).toBeTruthy();
    expect(updatedSession?.session.reviewRating).toBe(4);
    expect(updatedSession?.session.reviewComment).toBe("Great bot!");
  });
});

describe("analytics router", () => {
  it("returns analytics overview for admin", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const analytics = await caller.analytics.overview();
    expect(analytics).toBeDefined();
    expect(typeof analytics.totalBots).toBe("number");
    expect(typeof analytics.totalTesters).toBe("number");
    expect(typeof analytics.totalSessions).toBe("number");
    expect(typeof analytics.totalMessages).toBe("number");
    expect(typeof analytics.totalLikes).toBe("number");
    expect(typeof analytics.totalDislikes).toBe("number");
  });

  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.analytics.overview()).rejects.toThrow();
  });
});

describe("export router", () => {
  it("exports session as markdown", async () => {
    const { ctx } = createAdminContext();
    const adminCaller = appRouter.createCaller(ctx);

    // Setup
    const { id: botId } = await adminCaller.bots.create({
      name: "Export Bot",
      clientName: "Export Client",
      flowiseApiUrl: "https://flowise.example.com/api/v1/prediction/export-id",
    });

    const { shareToken } = await adminCaller.testers.create({
      name: "Export Tester",
      botId,
    });

    const { ctx: publicCtx } = createPublicContext();
    const publicCaller = appRouter.createCaller(publicCtx);

    const { session } = await publicCaller.sessions.getOrCreate({ shareToken });

    const md = await adminCaller.sessions.export({ id: session.id, format: "md" });
    expect(md).toContain("# Test Session Report");
    expect(md).toContain("Export Bot");
  });

  it("exports session as text", async () => {
    const { ctx } = createAdminContext();
    const adminCaller = appRouter.createCaller(ctx);

    // Setup
    const { id: botId } = await adminCaller.bots.create({
      name: "TXT Bot",
      clientName: "TXT Client",
      flowiseApiUrl: "https://flowise.example.com/api/v1/prediction/txt-id",
    });

    const { shareToken } = await adminCaller.testers.create({
      name: "TXT Tester",
      botId,
    });

    const { ctx: publicCtx } = createPublicContext();
    const publicCaller = appRouter.createCaller(publicCtx);

    const { session } = await publicCaller.sessions.getOrCreate({ shareToken });

    const txt = await adminCaller.sessions.export({ id: session.id, format: "txt" });
    expect(txt).toContain("TEST SESSION REPORT");
    expect(txt).toContain("TXT Bot");
  });
});
