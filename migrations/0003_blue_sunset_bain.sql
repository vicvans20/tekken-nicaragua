CREATE TYPE "public"."event_format" AS ENUM('ft10');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('pending', 'completed', 'ongoing');--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description_markdown" text,
	"status" "event_status" DEFAULT 'pending' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"format" "event_format" NOT NULL,
	"winner_id" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events_players" (
	"event_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_players_event_id_player_id_unique" UNIQUE("event_id","player_id")
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_winner_id_players_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events_players" ADD CONSTRAINT "events_players_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events_players" ADD CONSTRAINT "events_players_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_players_event_id_idx" ON "events_players" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "events_players_player_id_idx" ON "events_players" USING btree ("player_id");