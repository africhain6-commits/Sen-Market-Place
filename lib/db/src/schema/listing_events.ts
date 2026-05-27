import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const listingEventsTable = pgTable("listing_events", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull(),
  eventType: text("event_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
