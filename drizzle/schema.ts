import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean, serial } from "drizzle-orm/pg-core";

// ============ ENUMS ============
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const botStatusEnum = pgEnum("bot_status", ["in_review", "testing", "live", "not_live", "cancelled"]);
export const sessionStatusEnum = pgEnum("session_status", ["live", "completed", "reviewed"]);
export const messageRoleEnum = pgEnum("message_role", ["user", "bot"]);
export const feedbackTypeEnum = pgEnum("feedback_type", ["like", "dislike"]);

// ============ USERS ============
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  password: text("password"), // bcrypt hashed password
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============ BOTS ============
export const bots = pgTable("bots", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  brandLogoUrl: text("brandLogoUrl"),
  flowiseApiUrl: text("flowiseApiUrl").notNull(),
  flowiseApiKey: text("flowiseApiKey"),
  firstMessage: text("firstMessage"),
  status: botStatusEnum("status").default("testing").notNull(),
  createdById: integer("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Bot = typeof bots.$inferSelect;
export type InsertBot = typeof bots.$inferInsert;

// ============ BANNERS ============
export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  botId: integer("botId"), // null means applies to all bots
  isActive: boolean("isActive").default(true).notNull(),
  createdById: integer("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Banner = typeof banners.$inferSelect;
export type InsertBanner = typeof banners.$inferInsert;

// ============ TEAMS ============
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Team = typeof teams.$inferSelect;

// ============ TEAM MEMBERS ============
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("teamId").notNull(),
  memberName: varchar("memberName", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;

// ============ CLIENT TESTERS (assigned to bots via share link) ============
export const clientTesters = pgTable("client_testers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  botId: integer("botId").notNull(),
  shareToken: varchar("shareToken", { length: 64 }).notNull().unique(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

export type ClientTester = typeof clientTesters.$inferSelect;

// ============ TEST SESSIONS ============
export const testSessions = pgTable("test_sessions", {
  id: serial("id").primaryKey(),
  sessionToken: varchar("sessionToken", { length: 64 }).notNull().unique(),
  botId: integer("botId").notNull(),
  clientTesterId: integer("clientTesterId").notNull(),
  status: sessionStatusEnum("status").default("live").notNull(),
  adminNotes: text("adminNotes"),
  reviewSubmitted: boolean("reviewSubmitted").default(false).notNull(),
  reviewRating: integer("reviewRating"),
  reviewComment: text("reviewComment"),
  assignedTeamMemberId: integer("assignedTeamMemberId"),
  createdByRefresh: boolean("createdByRefresh").default(false).notNull(),
  lastSeenAt: timestamp("lastSeenAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TestSession = typeof testSessions.$inferSelect;

// ============ MESSAGES ============
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  editedContent: text("editedContent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;

// ============ MESSAGE FEEDBACK ============
export const messageFeedback = pgTable("message_feedback", {
  id: serial("id").primaryKey(),
  messageId: integer("messageId").notNull(),
  sessionId: integer("sessionId").notNull(),
  feedbackType: feedbackTypeEnum("feedbackType").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MessageFeedback = typeof messageFeedback.$inferSelect;

// ============ SESSION NOTES (agent notes from client) ============
export const sessionNotes = pgTable("session_notes", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SessionNote = typeof sessionNotes.$inferSelect;

// ============ CLIENT NOTES (admin notes about the client - for agent knowledge base) ============
export const clientNotes = pgTable("client_notes", {
  id: serial("id").primaryKey(),
  clientTesterId: integer("clientTesterId").notNull(),
  content: text("content").notNull(),
  createdById: integer("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ClientNote = typeof clientNotes.$inferSelect;
