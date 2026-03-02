ALTER TABLE "api_tokens" ADD COLUMN "hash" varchar(64) PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "hash" varchar(64) PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "api_tokens" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "id";