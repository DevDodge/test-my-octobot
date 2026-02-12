-- Migration: Update bot_status enum and add banners table
-- This migration updates the bot_status enum to new values and creates the banners table

-- Step 1: Create new enum type with updated values
CREATE TYPE "public"."bot_status_new" AS ENUM('in_review', 'testing', 'live', 'not_live', 'cancelled');

-- Step 2: Update existing bots to map old statuses to new ones
UPDATE "bots" SET "status" = 'live' WHERE "status" = 'active';
UPDATE "bots" SET "status" = 'not_live' WHERE "status" = 'paused';
UPDATE "bots" SET "status" = 'cancelled' WHERE "status" = 'archived';

-- Step 3: Alter column to use text temporarily
ALTER TABLE "bots" ALTER COLUMN "status" TYPE text;

-- Step 4: Drop old enum and rename new one
DROP TYPE "public"."bot_status";
ALTER TYPE "public"."bot_status_new" RENAME TO "bot_status";

-- Step 5: Alter column back to enum
ALTER TABLE "bots" ALTER COLUMN "status" TYPE "public"."bot_status" USING "status"::"public"."bot_status";
ALTER TABLE "bots" ALTER COLUMN "status" SET DEFAULT 'testing';

-- Step 6: Create banners table
CREATE TABLE IF NOT EXISTS "banners" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "botId" integer,
  "isActive" boolean DEFAULT true NOT NULL,
  "createdById" integer NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
