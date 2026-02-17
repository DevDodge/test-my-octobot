CREATE TABLE "banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"botId" integer,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdById" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bots" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "bots" ALTER COLUMN "status" SET DEFAULT 'testing'::text;--> statement-breakpoint
DROP TYPE "public"."bot_status";--> statement-breakpoint
CREATE TYPE "public"."bot_status" AS ENUM('in_review', 'testing', 'live', 'not_live', 'cancelled');--> statement-breakpoint
ALTER TABLE "bots" ALTER COLUMN "status" SET DEFAULT 'testing'::"public"."bot_status";--> statement-breakpoint
ALTER TABLE "bots" ALTER COLUMN "status" SET DATA TYPE "public"."bot_status" USING "status"::"public"."bot_status";--> statement-breakpoint
ALTER TABLE "test_sessions" ADD COLUMN "createdByRefresh" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "test_sessions" ADD COLUMN "lastSeenAt" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" text;