CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "decks" ALTER COLUMN "commander" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "game_opponents" ALTER COLUMN "commander" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "decks" ADD COLUMN "theme" text;--> statement-breakpoint
ALTER TABLE "formats" ADD COLUMN "has_commander" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "game_opponents" ADD COLUMN "theme" text;--> statement-breakpoint
-- Commander is the one seeded format that uses a Commander.
UPDATE "formats" SET "has_commander" = true WHERE "name" = 'Commander';--> statement-breakpoint
-- Seed the common paper formats (only those not already present).
INSERT INTO "formats" ("name", "construction_type", "multiplayer", "has_commander")
SELECT v.name, 'constructed', false, false
FROM (VALUES ('Standard'), ('Pioneer'), ('Modern'), ('Legacy'), ('Vintage'), ('Pauper')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM "formats" f WHERE f.name = v.name);--> statement-breakpoint
-- Default format filter for dashboard/deck list (Commander).
INSERT INTO "app_settings" ("key", "value")
SELECT 'default_format_id', (SELECT "id"::text FROM "formats" WHERE "name" = 'Commander' ORDER BY "id" LIMIT 1)
WHERE EXISTS (SELECT 1 FROM "formats" WHERE "name" = 'Commander')
ON CONFLICT ("key") DO NOTHING;