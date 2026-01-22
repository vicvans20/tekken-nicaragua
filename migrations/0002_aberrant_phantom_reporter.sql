CREATE TYPE "public"."duel_status" AS ENUM('pending', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."winner" AS ENUM('player1', 'player2');--> statement-breakpoint
CREATE TABLE "duels" (
	"id" serial PRIMARY KEY NOT NULL,
	"player1_id" integer NOT NULL,
	"player2_id" integer NOT NULL,
	"player1_score" integer,
	"player2_score" integer,
	"referee_id" integer,
	"video_url" text,
	"status" "duel_status" DEFAULT 'pending' NOT NULL,
	"winner" "winner",
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "duels" ADD CONSTRAINT "duels_player1_id_players_id_fk" FOREIGN KEY ("player1_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duels" ADD CONSTRAINT "duels_player2_id_players_id_fk" FOREIGN KEY ("player2_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duels" ADD CONSTRAINT "duels_referee_id_players_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "duels_player1_id_idx" ON "duels" USING btree ("player1_id");--> statement-breakpoint
CREATE INDEX "duels_player2_id_idx" ON "duels" USING btree ("player2_id");--> statement-breakpoint
CREATE INDEX "duels_referee_id_idx" ON "duels" USING btree ("referee_id");