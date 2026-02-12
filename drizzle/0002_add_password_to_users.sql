-- Migration: Add password column to users table for simple email/password auth
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" text;
