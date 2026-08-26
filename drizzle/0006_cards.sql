CREATE TYPE "public"."card_zone" AS ENUM('used', 'free');--> statement-breakpoint
CREATE TABLE "collection_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"zone" "card_zone" DEFAULT 'free' NOT NULL,
	"deck_id" integer,
	"scryfall_id" text,
	"set_code" text,
	"collector_number" text,
	"mana_value" integer,
	"type_line" text,
	"color_identity" text[],
	"image_url" text,
	"rarity" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_cards_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "deck_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"deck_id" integer NOT NULL,
	"name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"scryfall_id" text,
	"set_code" text,
	"collector_number" text,
	"mana_value" integer,
	"type_line" text,
	"color_identity" text[],
	"image_url" text,
	"rarity" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deck_cards_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
ALTER TABLE "decks" ALTER COLUMN "url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "collection_cards" ADD CONSTRAINT "collection_cards_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Reuse the sync helper functions from migration 0005 for the new card tables.
DROP TRIGGER IF EXISTS deck_cards_set_updated_at ON deck_cards;--> statement-breakpoint
CREATE TRIGGER deck_cards_set_updated_at BEFORE UPDATE ON deck_cards FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
DROP TRIGGER IF EXISTS collection_cards_set_updated_at ON collection_cards;--> statement-breakpoint
CREATE TRIGGER collection_cards_set_updated_at BEFORE UPDATE ON collection_cards FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
DROP TRIGGER IF EXISTS deck_cards_record_tombstone ON deck_cards;--> statement-breakpoint
CREATE TRIGGER deck_cards_record_tombstone AFTER DELETE ON deck_cards FOR EACH ROW EXECUTE FUNCTION record_tombstone();--> statement-breakpoint
DROP TRIGGER IF EXISTS collection_cards_record_tombstone ON collection_cards;--> statement-breakpoint
CREATE TRIGGER collection_cards_record_tombstone AFTER DELETE ON collection_cards FOR EACH ROW EXECUTE FUNCTION record_tombstone();
