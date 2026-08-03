import { pgTable, text, index, serial, pgEnum, integer } from "drizzle-orm/pg-core";

import { timestamps } from "./utils";
import { players } from "./players-schema";
import { events } from "./event-schema";

export const winnerEnum = pgEnum('winner', [
  'player1', 'player2'
]);

export const duelStatusEnum = pgEnum('duel_status', [
  'pending', 'completed', 'cancelled'
]);

export type DuelWinner = (typeof winnerEnum.enumValues)[number];
export type DuelStatus = (typeof duelStatusEnum.enumValues)[number];

export const duels = pgTable("duels", {
  id: serial("id").primaryKey(),
  player1Id: integer("player1_id").references(() => players.id).notNull(),
  player2Id: integer("player2_id").references(() => players.id).notNull(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  player1Score: integer("player1_score"),
  player2Score: integer("player2_score"),
  // Referee is optional
  refereeId: integer("referee_id").references(() => players.id),

  videoUrl: text("video_url"),
  status: duelStatusEnum("status").default("pending").notNull(),
  winner: winnerEnum("winner"),
  ...timestamps,
}, (table) => [
  index("duels_player1_id_idx").on(table.player1Id),
  index("duels_player2_id_idx").on(table.player2Id),
  index("duels_referee_id_idx").on(table.refereeId),
]);