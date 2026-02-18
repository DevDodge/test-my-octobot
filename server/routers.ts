import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";
import axios from "axios";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ ADMIN MANAGEMENT ============
  admins: router({
    list: adminProcedure.query(async () => {
      return db.listAdmins();
    }),
    create: adminProcedure.input(z.object({
      name: z.string().min(1),
      email: z.string().email().min(1),
      password: z.string().min(6),
    })).mutation(async ({ input }) => {
      // Check if email already exists
      const existing = await db.getUserByEmail(input.email);
      if (existing) {
        throw new Error("هذا البريد الإلكتروني مسجل بالفعل");
      }
      const hashedPassword = await bcrypt.hash(input.password, 12);
      await db.upsertUser({
        openId: `admin-${nanoid(12)}`,
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: "admin",
        lastSignedIn: new Date(),
      });
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      // Prevent deleting yourself
      if (ctx.user.id === input.id) {
        throw new Error("لا يمكنك حذف حسابك الخاص");
      }
      await db.deleteUser(input.id);
      return { success: true };
    }),
    updatePassword: adminProcedure.input(z.object({
      id: z.number(),
      password: z.string().min(6),
    })).mutation(async ({ input }) => {
      const hashedPassword = await bcrypt.hash(input.password, 12);
      await db.updateUserPassword(input.id, hashedPassword);
      return { success: true };
    }),
  }),

  // ============ BOTS ============
  bots: router({
    list: adminProcedure.query(async () => {
      return db.listBots();
    }),
    getById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getBotById(input.id);
    }),
    create: adminProcedure.input(z.object({
      name: z.string().min(1),
      clientName: z.string().min(1),
      brandLogoUrl: z.string().optional(),
      flowiseApiUrl: z.string().min(1),
      firstMessage: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const id = await db.createBot({ ...input, createdById: ctx.user.id });
      return { id };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      clientName: z.string().min(1).optional(),
      brandLogoUrl: z.string().optional(),
      flowiseApiUrl: z.string().min(1).optional(),
      firstMessage: z.string().optional(),
      status: z.enum(["in_review", "testing", "live", "not_live", "cancelled"]).optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateBot(id, data);
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteBot(input.id);
      return { success: true };
    }),
    analytics: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getBotAnalytics(input.id);
    }),
  }),

  // ============ IMAGE UPLOAD ============
  upload: router({
    image: adminProcedure.input(z.object({
      base64: z.string(),
      filename: z.string(),
      contentType: z.string(),
    })).mutation(async ({ input }) => {
      const uploadsDir = path.resolve(process.cwd(), "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const safeName = `${nanoid(12)}-${input.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const filePath = path.join(uploadsDir, safeName);
      const buffer = Buffer.from(input.base64, "base64");
      fs.writeFileSync(filePath, buffer);
      return { url: `/uploads/${safeName}` };
    }),
  }),

  // ============ BANNERS ============
  banners: router({
    list: adminProcedure.query(async () => {
      return db.listBanners();
    }),
    create: adminProcedure.input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      botId: z.number().nullable().optional(),
    })).mutation(async ({ input, ctx }) => {
      const id = await db.createBanner({ ...input, botId: input.botId ?? null, createdById: ctx.user.id });
      return { id };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      botId: z.number().nullable().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateBanner(id, data);
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteBanner(input.id);
      return { success: true };
    }),
    // Public: get active banners for a bot
    getForBot: publicProcedure.input(z.object({ botId: z.number() })).query(async ({ input }) => {
      return db.getActiveBannersForBot(input.botId);
    }),
  }),

  // ============ TEAMS ============
  teams: router({
    list: adminProcedure.query(async () => {
      return db.listTeams();
    }),
    create: adminProcedure.input(z.object({ name: z.string().min(1) })).mutation(async ({ input }) => {
      const id = await db.createTeam(input.name);
      return { id };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteTeam(input.id);
      return { success: true };
    }),
    members: router({
      list: adminProcedure.input(z.object({ teamId: z.number() })).query(async ({ input }) => {
        return db.listTeamMembers(input.teamId);
      }),
      listAll: adminProcedure.query(async () => {
        return db.listAllTeamMembers();
      }),
      add: adminProcedure.input(z.object({ teamId: z.number(), memberName: z.string().min(1) })).mutation(async ({ input }) => {
        const id = await db.addTeamMember(input.teamId, input.memberName);
        return { id };
      }),
      remove: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await db.removeTeamMember(input.id);
        return { success: true };
      }),
    }),
  }),

  // ============ CLIENT TESTERS ============
  testers: router({
    list: adminProcedure.input(z.object({ botId: z.number().optional() }).optional()).query(async ({ input }) => {
      return db.listClientTesters(input?.botId);
    }),
    create: adminProcedure.input(z.object({
      name: z.string().min(1),
      email: z.string().optional(),
      botId: z.number(),
    })).mutation(async ({ input }) => {
      const shareToken = nanoid(16);
      const id = await db.createClientTester({ ...input, shareToken });
      return { id, shareToken };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteClientTester(input.id);
      return { success: true };
    }),
    getByToken: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      const tester = await db.getClientTesterByToken(input.token);
      if (!tester) return null;
      const bot = await db.getBotById(tester.botId);
      return { tester, bot };
    }),
    listDeleted: adminProcedure.query(async () => {
      return db.listDeletedTesters();
    }),
    restore: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.restoreTester(input.id);
      return { success: true };
    }),
    permanentDelete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.permanentDeleteTester(input.id);
      return { success: true };
    }),
  }),

  // ============ TEST SESSIONS ============
  sessions: router({
    list: adminProcedure.input(z.object({ botId: z.number().optional(), clientTesterId: z.number().optional() }).optional()).query(async ({ input }) => {
      return db.listTestSessions(input?.botId, input?.clientTesterId);
    }),
    get: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const session = await db.getTestSession(input.id);
      if (!session) return null;
      const msgs = await db.listMessages(session.id);
      const feedback = await db.listFeedback(session.id);
      const note = await db.getSessionNote(session.id);
      return { session, messages: msgs, feedback, note };
    }),
    getDetail: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const session = await db.getTestSession(input.id);
      if (!session) return null;
      const msgs = await db.listMessages(session.id);
      const feedback = await db.listFeedback(session.id);
      const note = await db.getSessionNote(session.id);
      return { session, messages: msgs, feedback, note };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["live", "completed", "reviewed"]).optional(),
      adminNotes: z.string().optional(),
      assignedTeamMemberId: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateTestSession(id, data);
      return { success: true };
    }),
    // Client-side: create or get session
    getOrCreate: publicProcedure.input(z.object({ shareToken: z.string() })).mutation(async ({ input }) => {
      const tester = await db.getClientTesterByToken(input.shareToken);
      if (!tester) throw new Error("Invalid share link");
      const bot = await db.getBotById(tester.botId);
      if (!bot) throw new Error("Bot not found");
      const existingSessions = await db.listTestSessions(tester.botId, tester.id);
      const liveSession = existingSessions.find(s => s.status === "live");
      if (liveSession) {
        const msgs = await db.listMessages(liveSession.id);
        const note = await db.getSessionNote(liveSession.id);
        return { session: liveSession, bot, tester, messages: msgs, note };
      }
      const sessionToken = nanoid(24);
      const sessionId = await db.createTestSession({ sessionToken, botId: tester.botId, clientTesterId: tester.id });
      const newSession = await db.getTestSession(sessionId);
      return { session: newSession!, bot, tester, messages: [], note: undefined };
    }),
    createNew: publicProcedure.input(z.object({ shareToken: z.string() })).mutation(async ({ input }) => {
      const tester = await db.getClientTesterByToken(input.shareToken);
      if (!tester) throw new Error("Invalid share link");
      const bot = await db.getBotById(tester.botId);
      if (!bot) throw new Error("Bot not found");
      // Create a new session without touching existing ones - old sessions keep all data
      const sessionToken = nanoid(24);
      const sessionId = await db.createTestSession({ sessionToken, botId: tester.botId, clientTesterId: tester.id, createdByRefresh: true });
      const newSession = await db.getTestSession(sessionId);
      return { session: newSession!, bot, tester, messages: [], note: undefined };
    }),
    // Client heartbeat - updates lastSeenAt for presence tracking
    heartbeat: publicProcedure.input(z.object({ sessionId: z.number(), shareToken: z.string() })).mutation(async ({ input }) => {
      const tester = await db.getClientTesterByToken(input.shareToken);
      if (!tester) throw new Error("Invalid share link");
      await db.updateSessionLastSeen(input.sessionId);
      return { ok: true };
    }),
    // Admin: get message counts for all sessions
    messageCounts: adminProcedure.query(async () => {
      return db.getMessageCountsForSessions();
    }),
    export: adminProcedure.input(z.object({ id: z.number(), format: z.enum(["txt", "md"]) })).query(async ({ input }) => {
      const session = await db.getTestSession(input.id);
      if (!session) throw new Error("Session not found");
      const msgs = await db.listMessages(session.id);
      const feedback = await db.listFeedback(session.id);
      const note = await db.getSessionNote(session.id);
      const bot = await db.getBotById(session.botId);

      const feedbackMap = new Map<number, typeof feedback>();
      feedback.forEach(f => {
        const existing = feedbackMap.get(f.messageId) || [];
        existing.push(f);
        feedbackMap.set(f.messageId, existing);
      });

      if (input.format === "md") {
        let md = `# Test Session Report\n\n`;
        md += `**Bot:** ${bot?.name || "Unknown"}\n`;
        md += `**Client:** ${bot?.clientName || "Unknown"}\n`;
        md += `**Session ID:** ${session.sessionToken}\n`;
        md += `**Status:** ${session.status}\n`;
        md += `**Created:** ${session.createdAt}\n\n`;
        md += `## Chat History\n\n`;
        msgs.forEach(m => {
          const role = m.role === "user" ? "Client" : "Bot";
          md += `### ${role} (${m.createdAt})\n\n${m.content}\n\n`;
          if (m.editedContent) md += `> **Edited Response:** ${m.editedContent}\n\n`;
          const fb = feedbackMap.get(m.id);
          if (fb) {
            fb.forEach(f => {
              md += `> **${f.feedbackType === "like" ? "Positive" : "Negative"}:** ${f.comment || "No comment"}\n\n`;
            });
          }
        });
        if (note) md += `## Session Notes\n\n${note.content}\n\n`;
        if (session.adminNotes) md += `## Admin Notes\n\n${session.adminNotes}\n\n`;
        if (session.reviewComment) md += `## Review\n\n**Rating:** ${session.reviewRating}/5\n\n${session.reviewComment}\n`;
        return md;
      }

      // TXT format — rich box-drawing style
      const LINE = "═".repeat(65);
      const THIN = "─".repeat(65);
      const BOX_TOP = "┌" + "─".repeat(65);
      const BOX_MID = "├" + "─".repeat(65);
      const BOX_BTM = "└" + "─".repeat(65);

      const formatTime = (d: Date) => {
        const date = new Date(d);
        const h = date.getHours();
        const m = date.getMinutes().toString().padStart(2, "0");
        const ampm = h >= 12 ? "pm" : "am";
        const h12 = h % 12 || 12;
        return `${h12}:${m} ${ampm}`;
      };
      const formatDateLabel = (d: Date) => {
        const date = new Date(d);
        return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      };
      const formatExportDate = (d: Date) => {
        const date = new Date(d);
        return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) + ", " + formatTime(date);
      };
      const getDateKey = (d: Date) => {
        const date = new Date(d);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      };
      const wrapLines = (text: string) => text.split("\n").map(l => `│ ${l}`).join("\n");

      let txt = `${LINE}\n`;
      txt += `                     OCTOBOT SESSION EXPORT\n`;
      txt += `${LINE}\n\n`;
      txt += `Session ID: ${session.sessionToken}\n`;
      txt += `Bot: ${bot?.name || "Unknown"}\n`;
      txt += `Client: ${bot?.clientName || "Unknown"}\n`;
      txt += `Status: ${session.status}\n`;
      txt += `Export Date: ${formatExportDate(new Date())}\n`;
      txt += `Total Messages: ${msgs.length}\n`;
      txt += `\n${LINE}\n`;
      txt += `                         MESSAGES\n`;
      txt += `${LINE}\n\n`;

      let lastDateKey = "";
      msgs.forEach(m => {
        const dateKey = getDateKey(m.createdAt);
        if (dateKey !== lastDateKey) {
          txt += `\n───────────────── ${formatDateLabel(m.createdAt)} ─────────────────\n\n`;
          lastDateKey = dateKey;
        }
        const emoji = m.role === "user" ? "👤 USER" : "🤖 BOT";
        const time = formatTime(m.createdAt);
        txt += `${BOX_TOP}\n`;
        txt += `│ ${emoji}  [${time}]\n`;
        txt += `${BOX_MID}\n`;
        txt += wrapLines(m.content) + "\n";

        if (m.editedContent) {
          txt += `│\n│ ✏️ EDITED RESPONSE:\n`;
          txt += wrapLines(m.editedContent) + "\n";
        }

        const fb = feedbackMap.get(m.id);
        if (fb && fb.length > 0) {
          txt += `│\n│ 💬 FEEDBACK COMMENTS (${fb.length}):\n`;
          fb.forEach(f => {
            const icon = f.feedbackType === "like" ? "✅ POSITIVE" : "❌ NEGATIVE";
            txt += `│   [${icon}] "${f.comment || "No comment"}"\n`;
          });
        }

        txt += `${BOX_BTM}\n\n`;
      });

      if (note) {
        txt += `${BOX_TOP}\n│ 📝 SESSION NOTES\n${BOX_MID}\n`;
        txt += wrapLines(note.content) + "\n";
        txt += `${BOX_BTM}\n\n`;
      }
      if (session.adminNotes) {
        txt += `${BOX_TOP}\n│ 🔒 ADMIN NOTES\n${BOX_MID}\n`;
        txt += wrapLines(session.adminNotes) + "\n";
        txt += `${BOX_BTM}\n\n`;
      }
      if (session.reviewComment) {
        txt += `${BOX_TOP}\n│ ⭐ REVIEW (Rating: ${session.reviewRating}/5)\n${BOX_MID}\n`;
        txt += wrapLines(session.reviewComment) + "\n";
        txt += `${BOX_BTM}\n\n`;
      }

      txt += `${LINE}\n`;
      txt += `                      END OF EXPORT\n`;
      txt += `${LINE}\n`;
      return txt;
    }),
  }),

  // ============ MESSAGES (Client-side) ============
  messages: router({
    send: publicProcedure.input(z.object({
      sessionId: z.number(),
      content: z.string().min(1),
      shareToken: z.string(),
    })).mutation(async ({ input }) => {
      const tester = await db.getClientTesterByToken(input.shareToken);
      if (!tester) throw new Error("Invalid share link");
      const session = await db.getTestSession(input.sessionId);
      if (!session || session.clientTesterId !== tester.id) throw new Error("Unauthorized");
      const bot = await db.getBotById(session.botId);
      if (!bot) throw new Error("Bot not found");

      const userMsgId = await db.createMessage({ sessionId: input.sessionId, role: "user", content: input.content });

      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (bot.flowiseApiKey) headers["Authorization"] = `Bearer ${bot.flowiseApiKey}`;

        const response = await axios.post(bot.flowiseApiUrl, {
          question: input.content,
          overrideConfig: { sessionId: `octobot-${session.sessionToken}` },
        }, { headers, timeout: 60000 });

        const botReply = response.data?.text || response.data?.message || "No response from agent";
        const botMsgId = await db.createMessage({ sessionId: input.sessionId, role: "bot", content: botReply });

        return { userMsgId, botMsgId, botReply };
      } catch (error: any) {
        const errorMsg = `Error: ${error.message || "Failed to get response from agent"}`;
        const botMsgId = await db.createMessage({ sessionId: input.sessionId, role: "bot", content: errorMsg });
        return { userMsgId, botMsgId, botReply: errorMsg };
      }
    }),
    edit: publicProcedure.input(z.object({
      messageId: z.number(),
      editedContent: z.string(),
      shareToken: z.string(),
    })).mutation(async ({ input }) => {
      await db.updateMessageEditedContent(input.messageId, input.editedContent);
      return { success: true };
    }),
    feedback: publicProcedure.input(z.object({
      messageId: z.number(),
      sessionId: z.number(),
      feedbackType: z.enum(["like", "dislike"]),
      comment: z.string().optional(),
      shareToken: z.string(),
    })).mutation(async ({ input }) => {
      const { shareToken, ...data } = input;
      const id = await db.createFeedback(data);
      return { id };
    }),
  }),

  // ============ NOTES ============
  notes: router({
    saveSessionNote: publicProcedure.input(z.object({
      sessionId: z.number(),
      content: z.string(),
      shareToken: z.string(),
    })).mutation(async ({ input }) => {
      const id = await db.upsertSessionNote(input.sessionId, input.content);
      return { id };
    }),
    getSessionNote: publicProcedure.input(z.object({ sessionId: z.number() })).query(async ({ input }) => {
      return db.getSessionNote(input.sessionId);
    }),
    listClientNotes: adminProcedure.input(z.object({ clientTesterId: z.number() })).query(async ({ input }) => {
      return db.listClientNotes(input.clientTesterId);
    }),
    createClientNote: adminProcedure.input(z.object({
      clientTesterId: z.number(),
      content: z.string().min(1),
    })).mutation(async ({ input, ctx }) => {
      const id = await db.createClientNote({ ...input, createdById: ctx.user.id });
      return { id };
    }),
    deleteClientNote: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteClientNote(input.id);
      return { success: true };
    }),
  }),

  // ============ REVIEWS (Client submit) ============
  reviews: router({
    submit: publicProcedure.input(z.object({
      sessionId: z.number(),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
      shareToken: z.string(),
    })).mutation(async ({ input }) => {
      await db.updateTestSession(input.sessionId, {
        reviewSubmitted: true,
        reviewRating: input.rating,
        reviewComment: input.comment,
        status: "completed",
      });
      return { success: true };
    }),
  }),

  // ============ ANALYTICS ============
  analytics: router({
    overview: adminProcedure.query(async () => {
      return db.getAnalytics();
    }),
  }),

  // ============ LINK PREVIEW ============
  linkPreview: router({
    fetch: publicProcedure.input(z.object({ url: z.string().url() })).query(async ({ input }) => {
      try {
        const response = await axios.get(input.url, {
          timeout: 5000,
          maxRedirects: 5,
          headers: { "User-Agent": "Mozilla/5.0 (compatible; OctoBot/1.0)" },
          responseType: "text",
        });
        const html = typeof response.data === "string" ? response.data : "";
        const getMetaContent = (property: string): string | null => {
          const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, "i");
          const match = html.match(regex);
          if (match) return match[1];
          // Try reversed attribute order
          const regex2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`, "i");
          const match2 = html.match(regex2);
          return match2 ? match2[1] : null;
        };
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        const title = getMetaContent("og:title") || getMetaContent("twitter:title") || (titleMatch ? titleMatch[1].trim() : null);
        const description = getMetaContent("og:description") || getMetaContent("twitter:description") || getMetaContent("description");
        const image = getMetaContent("og:image") || getMetaContent("twitter:image");
        const siteName = getMetaContent("og:site_name");
        const url = new URL(input.url);
        const domain = url.hostname.replace("www.", "");
        const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        return { title, description, image, siteName, domain, favicon, url: input.url };
      } catch {
        const url = new URL(input.url);
        const domain = url.hostname.replace("www.", "");
        return { title: null, description: null, image: null, siteName: null, domain, favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`, url: input.url };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
