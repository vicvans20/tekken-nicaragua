CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"nickname" text NOT NULL,
	"tekken_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_nickname_unique" UNIQUE("nickname"),
	CONSTRAINT "players_tekken_id_unique" UNIQUE("tekken_id")
);
--> statement-breakpoint
CREATE INDEX "players_nickname_idx" ON "players" USING btree ("nickname");--> statement-breakpoint
CREATE INDEX "players_tekken_id_idx" ON "players" USING btree ("tekken_id");