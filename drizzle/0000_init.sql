CREATE TYPE "public"."platform" AS ENUM('moxfield', 'manabox', 'archidekt', 'other');--> statement-breakpoint
CREATE TYPE "public"."win_type" AS ENUM('combat_damage', 'commander_damage', 'burn', 'infect', 'combo', 'mill', 'poison', 'alt_win', 'decking', 'concession', 'other');--> statement-breakpoint
CREATE TYPE "public"."winner_type" AS ENUM('me', 'opponent', 'draw');--> statement-breakpoint
CREATE TABLE "decks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"commander" text NOT NULL,
	"partner_commander" text,
	"platform" "platform" DEFAULT 'other' NOT NULL,
	"url" text NOT NULL,
	"color_identity" text[],
	"bracket" integer,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_opponents" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"player_name" text,
	"commander" text NOT NULL,
	"partner_commander" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"deck_id" integer NOT NULL,
	"played_at" timestamp with time zone DEFAULT now() NOT NULL,
	"bracket" integer,
	"turn_count" integer,
	"winner_type" "winner_type" NOT NULL,
	"winner_opponent_id" integer,
	"win_turn" integer,
	"win_type" "win_type",
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_opponents" ADD CONSTRAINT "game_opponents_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;