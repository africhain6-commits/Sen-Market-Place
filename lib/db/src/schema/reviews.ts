import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  toUserId: integer("to_user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Review = typeof reviewsTable.$inferSelect;
