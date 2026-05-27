import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  relatedId: integer("related_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notificationsTable.$inferSelect;
