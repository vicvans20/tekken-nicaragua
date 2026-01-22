import { pgTable, text, timestamp, index, serial } from "drizzle-orm/pg-core";

const timestamps = {
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}

export const user = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name"),
  nickname: text("nickname").notNull().unique(),
  tekken_id: text("tekken_id").unique(),
  ...timestamps,
}, (table) => [
  index("players_nickname_idx").on(table.nickname),
  index("players_tekken_id_idx").on(table.tekken_id),
]);