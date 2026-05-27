import { pgTable, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { listingsTable } from "./listings";

export const priceHistoryTable = pgTable("price_history", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listingsTable.id, { onDelete: "cascade" }),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export type PriceHistory = typeof priceHistoryTable.$inferSelect;
