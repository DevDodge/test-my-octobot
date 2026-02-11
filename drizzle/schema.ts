import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

// ============ USERS ============
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============ BOTS ============
export const bots = mysqlTable("bots", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  brandLogoUrl: text("brandLogoUrl"),
  flowiseApiUrl: text("flowiseApiUrl").notNull(),
  flowiseApiKey: text("flowiseApiKey"),
  firstMessage: text("firstMessage"),
  status: mysqlEnum("status", ["active", "paused", "archived"]).default("active").notNull(),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bot = typeof bots.$inferSelect;
export type InsertBot = typeof bots.$inferInsert;

// ============ TEAMS ============
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;

// ============ TEAM MEMBERS ============
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  memberName: varchar("memberName", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;

// ============ CLIENT TESTERS (assigned to bots via share link) ============
export const clientTesters = mysqlTable("client_testers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  botId: int("botId").notNull(),
  shareToken: varchar("shareToken", { length: 64 }).notNull().unique(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientTester = typeof clientTesters.$inferSelect;

// ============ TEST SESSIONS ============
export const testSessions = mysqlTable("test_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionToken: varchar("sessionToken", { length: 64 }).notNull().unique(),
  botId: int("botId").notNull(),
  clientTesterId: int("clientTesterId").notNull(),
  status: mysqlEnum("status", ["live", "completed", "reviewed"]).default("live").notNull(),
  adminNotes: text("adminNotes"),
  reviewSubmitted: boolean("reviewSubmitted").default(false).notNull(),
  reviewRating: int("reviewRating"),
  reviewComment: text("reviewComment"),
  assignedTeamMemberId: int("assignedTeamMemberId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TestSession = typeof testSessions.$inferSelect;

// ============ MESSAGES ============
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  role: mysqlEnum("role", ["user", "bot"]).notNull(),
  content: text("content").notNull(),
  editedContent: text("editedContent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;

// ============ MESSAGE FEEDBACK ============
export const messageFeedback = mysqlTable("message_feedback", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(),
  sessionId: int("sessionId").notNull(),
  feedbackType: mysqlEnum("feedbackType", ["like", "dislike"]).notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MessageFeedback = typeof messageFeedback.$inferSelect;

// ============ SESSION NOTES (agent notes from client) ============
export const sessionNotes = mysqlTable("session_notes", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SessionNote = typeof sessionNotes.$inferSelect;

// ============ CLIENT NOTES (admin notes about the client - for agent knowledge base) ============
export const clientNotes = mysqlTable("client_notes", {
  id: int("id").autoincrement().primaryKey(),
  clientTesterId: int("clientTesterId").notNull(),
  content: text("content").notNull(),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientNote = typeof clientNotes.$inferSelect;
