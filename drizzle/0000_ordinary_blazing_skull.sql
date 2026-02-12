CREATE TYPE "public"."bot_status" AS ENUM('active', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('like', 'dislike');--> statement-breakpoint
CREATE TYPE "public"."message_role" AS ENUM('user', 'bot');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('live', 'completed', 'reviewed');--> statement-breakpoint
CREATE TABLE "bots" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"clientName" varchar(255) NOT NULL,
	"brandLogoUrl" text,
	"flowiseApiUrl" text NOT NULL,
	"flowiseApiKey" text,
	"firstMessage" text,
	"status" "bot_status" DEFAULT 'active' NOT NULL,
	"createdById" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientTesterId" integer NOT NULL,
	"content" text NOT NULL,
	"createdById" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_testers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320),
	"botId" integer NOT NULL,
	"shareToken" varchar(64) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "client_testers_shareToken_unique" UNIQUE("shareToken")
);
--> statement-breakpoint
CREATE TABLE "message_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"messageId" integer NOT NULL,
	"sessionId" integer NOT NULL,
	"feedbackType" "feedback_type" NOT NULL,
	"comment" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sessionId" integer NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"editedContent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"sessionId" integer NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"teamId" integer NOT NULL,
	"memberName" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"sessionToken" varchar(64) NOT NULL,
	"botId" integer NOT NULL,
	"clientTesterId" integer NOT NULL,
	"status" "session_status" DEFAULT 'live' NOT NULL,
	"adminNotes" text,
	"reviewSubmitted" boolean DEFAULT false NOT NULL,
	"reviewRating" integer,
	"reviewComment" text,
	"assignedTeamMemberId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "test_sessions_sessionToken_unique" UNIQUE("sessionToken")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
