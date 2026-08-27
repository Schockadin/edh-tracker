CREATE TABLE "sync_tombstones" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_name" text NOT NULL,
	"row_uuid" uuid NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "decks" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "formats" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "game_opponents" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "game_opponents" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "player_groups" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "decks" ADD CONSTRAINT "decks_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "formats" ADD CONSTRAINT "formats_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "game_opponents" ADD CONSTRAINT "game_opponents_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "player_groups" ADD CONSTRAINT "player_groups_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
-- gen_random_uuid() lives in core on PG13+, but guard for pgcrypto just in case.
CREATE EXTENSION IF NOT EXISTS pgcrypto;--> statement-breakpoint
-- Bump updated_at automatically on every UPDATE so sync change-tracking is
-- reliable regardless of which code path performed the update.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
-- Record a tombstone whenever a syncable row is deleted, so sync clients can
-- mirror the deletion.
CREATE OR REPLACE FUNCTION record_tombstone() RETURNS trigger AS $$
BEGIN
  INSERT INTO sync_tombstones (table_name, row_uuid) VALUES (TG_TABLE_NAME, OLD.uuid);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
DROP TRIGGER IF EXISTS decks_set_updated_at ON decks;--> statement-breakpoint
CREATE TRIGGER decks_set_updated_at BEFORE UPDATE ON decks FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
DROP TRIGGER IF EXISTS formats_set_updated_at ON formats;--> statement-breakpoint
CREATE TRIGGER formats_set_updated_at BEFORE UPDATE ON formats FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
DROP TRIGGER IF EXISTS games_set_updated_at ON games;--> statement-breakpoint
CREATE TRIGGER games_set_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
DROP TRIGGER IF EXISTS game_opponents_set_updated_at ON game_opponents;--> statement-breakpoint
CREATE TRIGGER game_opponents_set_updated_at BEFORE UPDATE ON game_opponents FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
DROP TRIGGER IF EXISTS player_groups_set_updated_at ON player_groups;--> statement-breakpoint
CREATE TRIGGER player_groups_set_updated_at BEFORE UPDATE ON player_groups FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
DROP TRIGGER IF EXISTS app_settings_set_updated_at ON app_settings;--> statement-breakpoint
CREATE TRIGGER app_settings_set_updated_at BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
DROP TRIGGER IF EXISTS decks_record_tombstone ON decks;--> statement-breakpoint
CREATE TRIGGER decks_record_tombstone AFTER DELETE ON decks FOR EACH ROW EXECUTE FUNCTION record_tombstone();--> statement-breakpoint
DROP TRIGGER IF EXISTS formats_record_tombstone ON formats;--> statement-breakpoint
CREATE TRIGGER formats_record_tombstone AFTER DELETE ON formats FOR EACH ROW EXECUTE FUNCTION record_tombstone();--> statement-breakpoint
DROP TRIGGER IF EXISTS games_record_tombstone ON games;--> statement-breakpoint
CREATE TRIGGER games_record_tombstone AFTER DELETE ON games FOR EACH ROW EXECUTE FUNCTION record_tombstone();--> statement-breakpoint
DROP TRIGGER IF EXISTS game_opponents_record_tombstone ON game_opponents;--> statement-breakpoint
CREATE TRIGGER game_opponents_record_tombstone AFTER DELETE ON game_opponents FOR EACH ROW EXECUTE FUNCTION record_tombstone();--> statement-breakpoint
DROP TRIGGER IF EXISTS player_groups_record_tombstone ON player_groups;--> statement-breakpoint
CREATE TRIGGER player_groups_record_tombstone AFTER DELETE ON player_groups FOR EACH ROW EXECUTE FUNCTION record_tombstone();
