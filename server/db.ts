import { eq, desc, and, sql, count, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  InsertUser, users,
  bots, Bot, InsertBot,
  teams, teamMembers,
  clientTesters,
  testSessions,
  messages,
  messageFeedback,
  sessionNotes,
  clientNotes,
  banners,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import bcrypt from "bcryptjs";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER HELPERS ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod", "password"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listAdmins() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  }).from(users).where(eq(users.role, "admin")).orderBy(desc(users.createdAt));
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(users).where(eq(users.id, id));
}

export async function updateUserPassword(id: number, hashedPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
}

// ============ SEED DEFAULT ADMIN ============
export async function seedDefaultAdmin() {
  const db = await getDb();
  if (!db) { console.warn("[Seed] Cannot seed: database not available"); return; }

  const defaultEmail = "DK-OctoBot-Tests@Gmail.com";
  const defaultPassword = "Eng.OCTOBOT.DK.Company.Dodge.Kareem.12.it.com";

  const existing = await getUserByEmail(defaultEmail);
  if (!existing) {
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    await upsertUser({
      openId: `admin-${Date.now()}`,
      name: "DK Admin",
      email: defaultEmail,
      password: hashedPassword,
      role: "admin",
      lastSignedIn: new Date(),
    });
    console.log("[Seed] Default admin created:", defaultEmail);
  } else {
    // Ensure the existing user has a password and is admin
    if (!existing.password) {
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      await updateUserPassword(existing.id, hashedPassword);
      console.log("[Seed] Default admin password set");
    }
    if (existing.role !== "admin") {
      await upsertUser({ openId: existing.openId, role: "admin" });
      console.log("[Seed] Default admin role updated");
    }
  }
}

// ============ BOT HELPERS ============
export async function createBot(data: { name: string; clientName: string; brandLogoUrl?: string; flowiseApiUrl: string; flowiseApiKey?: string; firstMessage?: string; createdById: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(bots).values({
    name: data.name,
    clientName: data.clientName,
    brandLogoUrl: data.brandLogoUrl || null,
    flowiseApiUrl: data.flowiseApiUrl,
    flowiseApiKey: data.flowiseApiKey || null,
    firstMessage: data.firstMessage || null,
    status: "testing",
    createdById: data.createdById,
  }).returning({ id: bots.id });
  return result[0].id;
}

export async function listBots() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bots).orderBy(desc(bots.createdAt));
}

export async function getBotById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bots).where(eq(bots.id, id)).limit(1);
  return result[0];
}

export async function updateBot(id: number, data: Partial<{ name: string; clientName: string; brandLogoUrl: string; flowiseApiUrl: string; flowiseApiKey: string; firstMessage: string; status: "in_review" | "testing" | "live" | "not_live" | "cancelled" }>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(bots).set(data).where(eq(bots.id, id));
}

export async function deleteBot(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(bots).where(eq(bots.id, id));
}

// ============ BANNER HELPERS ============
export async function createBanner(data: { title: string; content: string; botId?: number | null; createdById: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(banners).values(data).returning({ id: banners.id });
  return result[0].id;
}

export async function listBanners() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(banners).orderBy(desc(banners.createdAt));
}

export async function updateBanner(id: number, data: Partial<{ title: string; content: string; botId: number | null; isActive: boolean }>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(banners).set(data).where(eq(banners.id, id));
}

export async function deleteBanner(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(banners).where(eq(banners.id, id));
}

export async function getActiveBannersForBot(botId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(banners).where(
    and(
      eq(banners.isActive, true),
    )
  ).orderBy(desc(banners.createdAt));
  return result.filter(b => b.botId === null || b.botId === botId);
}

// ============ TEAM HELPERS ============
export async function createTeam(name: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(teams).values({ name }).returning({ id: teams.id });
  return result[0].id;
}

export async function listTeams() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teams).orderBy(desc(teams.createdAt));
}

export async function deleteTeam(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(teamMembers).where(eq(teamMembers.teamId, id));
  await db.delete(teams).where(eq(teams.id, id));
}

export async function addTeamMember(teamId: number, memberName: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(teamMembers).values({ teamId, memberName }).returning({ id: teamMembers.id });
  return result[0].id;
}

export async function listTeamMembers(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
}

export async function removeTeamMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(teamMembers).where(eq(teamMembers.id, id));
}

export async function listAllTeamMembers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: teamMembers.id, teamId: teamMembers.teamId, memberName: teamMembers.memberName, teamName: teams.name }).from(teamMembers).leftJoin(teams, eq(teamMembers.teamId, teams.id));
}

// ============ CLIENT TESTER HELPERS ============
export async function createClientTester(data: { name: string; email?: string; botId: number; shareToken: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(clientTesters).values(data).returning({ id: clientTesters.id });
  return result[0].id;
}

export async function listClientTesters(botId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (botId) return db.select().from(clientTesters).where(eq(clientTesters.botId, botId)).orderBy(desc(clientTesters.createdAt));
  return db.select().from(clientTesters).orderBy(desc(clientTesters.createdAt));
}

export async function getClientTesterByToken(shareToken: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clientTesters).where(eq(clientTesters.shareToken, shareToken)).limit(1);
  return result[0];
}

export async function deleteClientTester(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(clientTesters).where(eq(clientTesters.id, id));
}

// ============ TEST SESSION HELPERS ============
export async function createTestSession(data: { sessionToken: string; botId: number; clientTesterId: number; createdByRefresh?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(testSessions).values({ ...data, status: "live", createdByRefresh: data.createdByRefresh ?? false }).returning({ id: testSessions.id });
  return result[0].id;
}

export async function listTestSessions(botId?: number, clientTesterId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (botId) conditions.push(eq(testSessions.botId, botId));
  if (clientTesterId) conditions.push(eq(testSessions.clientTesterId, clientTesterId));
  if (conditions.length > 0) return db.select().from(testSessions).where(and(...conditions)).orderBy(desc(testSessions.createdAt));
  return db.select().from(testSessions).orderBy(desc(testSessions.createdAt));
}

export async function getTestSession(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(testSessions).where(eq(testSessions.id, id)).limit(1);
  return result[0];
}

export async function getTestSessionByToken(sessionToken: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(testSessions).where(eq(testSessions.sessionToken, sessionToken)).limit(1);
  return result[0];
}

export async function updateTestSession(id: number, data: Partial<{ status: "live" | "completed" | "reviewed"; adminNotes: string; reviewSubmitted: boolean; reviewRating: number; reviewComment: string; assignedTeamMemberId: number; lastSeenAt: Date }>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(testSessions).set(data).where(eq(testSessions.id, id));
}

export async function updateSessionLastSeen(sessionId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(testSessions).set({ lastSeenAt: new Date() }).where(eq(testSessions.id, sessionId));
}

export async function getMessageCountsForSessions() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ sessionId: messages.sessionId, count: count() }).from(messages).groupBy(messages.sessionId);
}

// ============ MESSAGE HELPERS ============
export async function createMessage(data: { sessionId: number; role: "user" | "bot"; content: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(messages).values(data).returning({ id: messages.id });
  return result[0].id;
}

export async function listMessages(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.sessionId, sessionId)).orderBy(messages.createdAt);
}

export async function updateMessageEditedContent(messageId: number, editedContent: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(messages).set({ editedContent }).where(eq(messages.id, messageId));
}

// ============ FEEDBACK HELPERS ============
export async function createFeedback(data: { messageId: number; sessionId: number; feedbackType: "like" | "dislike"; comment?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(messageFeedback).values(data).returning({ id: messageFeedback.id });
  return result[0].id;
}

export async function listFeedback(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messageFeedback).where(eq(messageFeedback.sessionId, sessionId));
}

// ============ SESSION NOTES HELPERS ============
export async function upsertSessionNote(sessionId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(sessionNotes).where(eq(sessionNotes.sessionId, sessionId)).limit(1);
  if (existing.length > 0) {
    await db.update(sessionNotes).set({ content }).where(eq(sessionNotes.sessionId, sessionId));
    return existing[0].id;
  }
  const result = await db.insert(sessionNotes).values({ sessionId, content }).returning({ id: sessionNotes.id });
  return result[0].id;
}

export async function getSessionNote(sessionId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(sessionNotes).where(eq(sessionNotes.sessionId, sessionId)).limit(1);
  return result[0];
}

// ============ CLIENT NOTES HELPERS ============
export async function createClientNote(data: { clientTesterId: number; content: string; createdById: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(clientNotes).values(data).returning({ id: clientNotes.id });
  return result[0].id;
}

export async function listClientNotes(clientTesterId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientNotes).where(eq(clientNotes.clientTesterId, clientTesterId)).orderBy(desc(clientNotes.createdAt));
}

export async function deleteClientNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(clientNotes).where(eq(clientNotes.id, id));
}

// ============ ANALYTICS HELPERS ============
export async function getAnalytics() {
  const db = await getDb();
  const defaultResult = {
    totalBots: 0, totalTesters: 0, totalSessions: 0,
    liveSessions: 0, completedSessions: 0, reviewedSessions: 0,
    totalMessages: 0, totalLikes: 0, totalDislikes: 0,
    botsInReview: 0, botsTesting: 0, botsLive: 0, botsNotLive: 0, botsCancelled: 0,
  };
  if (!db) return defaultResult;

  try {
    const [botCount] = await db.select({ count: count() }).from(bots);
    const [testerCount] = await db.select({ count: count() }).from(clientTesters);
    const [sessionCount] = await db.select({ count: count() }).from(testSessions);
    const [liveCount] = await db.select({ count: count() }).from(testSessions).where(eq(testSessions.status, "live"));
    const [completedCount] = await db.select({ count: count() }).from(testSessions).where(eq(testSessions.status, "completed"));
    const [reviewedCount] = await db.select({ count: count() }).from(testSessions).where(eq(testSessions.status, "reviewed"));
    const [msgCount] = await db.select({ count: count() }).from(messages);
    const [likeCount] = await db.select({ count: count() }).from(messageFeedback).where(eq(messageFeedback.feedbackType, "like"));
    const [dislikeCount] = await db.select({ count: count() }).from(messageFeedback).where(eq(messageFeedback.feedbackType, "dislike"));

    // Bot status counts - use raw SQL with text cast to handle both old and new enum values gracefully
    let botsInReview = 0, botsTesting = 0, botsLive = 0, botsNotLive = 0, botsCancelled = 0;
    try {
      const statusCounts = await db.execute(sql`
        SELECT status::text as status_val, COUNT(*)::int as cnt
        FROM bots
        GROUP BY status::text
      `);
      for (const row of statusCounts.rows) {
        const statusVal = (row as any).status_val;
        const cnt = Number((row as any).cnt) || 0;
        switch (statusVal) {
          case 'in_review': botsInReview = cnt; break;
          case 'testing': botsTesting = cnt; break;
          case 'live': botsLive = cnt; break;
          case 'active': botsLive += cnt; break; // map old 'active' to 'live'
          case 'not_live': botsNotLive = cnt; break;
          case 'paused': botsNotLive += cnt; break; // map old 'paused' to 'not_live'
          case 'cancelled': botsCancelled = cnt; break;
          case 'archived': botsCancelled += cnt; break; // map old 'archived' to 'cancelled'
        }
      }
    } catch (statusErr) {
      console.warn("[Analytics] Failed to get bot status counts:", statusErr);
    }

    return {
      totalBots: botCount.count,
      totalTesters: testerCount.count,
      totalSessions: sessionCount.count,
      liveSessions: liveCount.count,
      completedSessions: completedCount.count,
      reviewedSessions: reviewedCount.count,
      totalMessages: msgCount.count,
      totalLikes: likeCount.count,
      totalDislikes: dislikeCount.count,
      botsInReview,
      botsTesting,
      botsLive,
      botsNotLive,
      botsCancelled,
    };
  } catch (err) {
    console.error("[Analytics] Failed to get analytics:", err);
    return defaultResult;
  }
}

export async function getBotAnalytics(botId: number) {
  const db = await getDb();
  if (!db) return null;
  const [sessionCount] = await db.select({ count: count() }).from(testSessions).where(eq(testSessions.botId, botId));
  const [liveCount] = await db.select({ count: count() }).from(testSessions).where(and(eq(testSessions.botId, botId), eq(testSessions.status, "live")));
  const [completedCount] = await db.select({ count: count() }).from(testSessions).where(and(eq(testSessions.botId, botId), eq(testSessions.status, "completed")));
  const [reviewedCount] = await db.select({ count: count() }).from(testSessions).where(and(eq(testSessions.botId, botId), eq(testSessions.status, "reviewed")));

  const ratings = await db.select({ rating: testSessions.reviewRating }).from(testSessions).where(and(eq(testSessions.botId, botId), eq(testSessions.reviewSubmitted, true)));
  const validRatings = ratings.filter(r => r.rating !== null).map(r => r.rating!);
  const avgRating = validRatings.length > 0 ? validRatings.reduce((a, b) => a + b, 0) / validRatings.length : 0;

  return {
    totalSessions: sessionCount.count,
    liveSessions: liveCount.count,
    completedSessions: completedCount.count,
    reviewedSessions: reviewedCount.count,
    avgRating: Math.round(avgRating * 10) / 10,
  };
}
