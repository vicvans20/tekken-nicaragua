import { pgTable, text, index, serial, pgEnum, integer, timestamp, unique } from "drizzle-orm/pg-core";

import { timestamps } from "./utils";
import { players } from "./players-schema";

export const eventStatusEnum = pgEnum('event_status', ['pending', 'completed', 'ongoing']);
export const eventFormatEnum = pgEnum('event_format', ['ft10']);

export type EventStatus = (typeof eventStatusEnum.enumValues)[number];
export type EventFormat = (typeof eventFormatEnum.enumValues)[number];

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  descriptionMarkdown: text("description_markdown"),
  status: eventStatusEnum("status").default("pending").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  format: eventFormatEnum("format").notNull(),
  winnerId: integer("winner_id").references(() => players.id),
  ...timestamps,
})

// EventsXPlayers

export const eventsPlayers = pgTable("events_players", {
  eventId: integer("event_id").references(() => events.id).notNull(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  ...timestamps,
}, (table) => [
  index("events_players_event_id_idx").on(table.eventId),
  index("events_players_player_id_idx").on(table.playerId),
  // Unique constraint: a player can only participate once per event
  unique().on(table.eventId, table.playerId),
]);