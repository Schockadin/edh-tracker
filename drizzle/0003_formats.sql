CREATE TYPE "public"."construction_type" AS ENUM('constructed', 'limited');--> statement-breakpoint
CREATE TABLE "formats" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"construction_type" "construction_type" NOT NULL,
	"multiplayer" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

INSERT INTO "formats" ("name", "construction_type", "multiplayer") VALUES ('Commander', 'constructed', true);--> statement-breakpoint
ALTER TABLE "decks" ADD COLUMN "format_id" integer;--> statement-breakpoint
UPDATE "decks" SET "format_id" = (SELECT "id" FROM "formats" WHERE "name" = 'Commander' LIMIT 1);--> statement-breakpoint
ALTER TABLE "decks" ALTER COLUMN "format_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "decks" ADD CONSTRAINT "decks_format_id_formats_id_fk" FOREIGN KEY ("format_id") REFERENCES "public"."formats"("id") ON DELETE restrict ON UPDATE no action;