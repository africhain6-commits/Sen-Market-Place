import { pgTable, serial, integer, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const searchAlertsTable = pgTable("search_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  query: text("query"),
  category: text("category"),
  city: text("city"),
  minPrice: numeric("min_price"),
  maxPrice: numeric("max_price"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
