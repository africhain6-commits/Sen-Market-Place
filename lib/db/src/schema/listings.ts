import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  numeric,
  json,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const listingsTable = pgTable("listings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }),
  category: text("category").notNull(),
  city: text("city").notNull(),
  photos: json("photos").$type<string[]>().default([]).notNull(),
  status: text("status").notNull().default("active"),
  isBoosted: boolean("is_boosted").notNull().default(false),
  boostedUntil: timestamp("boosted_until"),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;
