import { pgTable, serial, text, timestamp, integer, bigint } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  developerName: text("developer_name"),
  city: text("city").notNull(),
  neighborhood: text("neighborhood"),
  description: text("description").notNull(),
  launchPrice: bigint("launch_price", { mode: "number" }),
  paymentPlan: text("payment_plan"),
  deliveryDate: text("delivery_date"),
  photos: text("photos").array(),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Project = typeof projectsTable.$inferSelect;
