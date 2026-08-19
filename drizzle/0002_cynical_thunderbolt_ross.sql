CREATE TABLE "player_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"player_names" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
