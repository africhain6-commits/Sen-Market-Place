import { Router, type IRouter } from "express";
import { eq, and, or, gte, lte, ilike } from "drizzle-orm";
import { db, searchAlertsTable, listingsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { createNotification } from "./notifications";

const router: IRouter = Router();

router.get("/search-alerts", requireAuth, async (req, res): Promise<void> => {
  const alerts = await db
    .select()
    .from(searchAlertsTable)
    .where(eq(searchAlertsTable.userId, req.userId!));

  res.json(alerts.map((a) => ({
    ...a,
    minPrice: a.minPrice !== null ? Number(a.minPrice) : null,
    maxPrice: a.maxPrice !== null ? Number(a.maxPrice) : null,
    createdAt: a.createdAt.toISOString(),
  })));
});

router.post("/search-alerts", requireAuth, async (req, res): Promise<void> => {
  const { query, category, city, minPrice, maxPrice } = req.body as {
    query?: string;
    category?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
  };

  const [alert] = await db.insert(searchAlertsTable).values({
    userId: req.userId!,
    query: query ?? null,
    category: category ?? null,
    city: city ?? null,
    minPrice: minPrice != null ? String(minPrice) : null,
    maxPrice: maxPrice != null ? String(maxPrice) : null,
  }).returning();

  res.status(201).json({
    ...alert,
    minPrice: alert.minPrice !== null ? Number(alert.minPrice) : null,
    maxPrice: alert.maxPrice !== null ? Number(alert.maxPrice) : null,
    createdAt: alert.createdAt.toISOString(),
  });
});

router.delete("/search-alerts/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);

  const [alert] = await db
    .select()
    .from(searchAlertsTable)
    .where(and(eq(searchAlertsTable.id, id), eq(searchAlertsTable.userId, req.userId!)));

  if (!alert) { res.status(404).json({ error: "Alerte introuvable" }); return; }

  await db.delete(searchAlertsTable).where(eq(searchAlertsTable.id, id));
  res.json({ message: "Alerte supprimée." });
});

export async function triggerSearchAlerts(listing: typeof listingsTable.$inferSelect) {
  const alerts = await db.select().from(searchAlertsTable);

  for (const alert of alerts) {
    if (alert.userId === listing.userId) continue;

    const matchQuery = !alert.query || listing.title.toLowerCase().includes(alert.query.toLowerCase()) || listing.description.toLowerCase().includes(alert.query.toLowerCase());
    const matchCategory = !alert.category || alert.category === listing.category;
    const matchCity = !alert.city || alert.city === listing.city;
    const matchMin = !alert.minPrice || (listing.price !== null && Number(listing.price) >= Number(alert.minPrice));
    const matchMax = !alert.maxPrice || (listing.price !== null && Number(listing.price) <= Number(alert.maxPrice));

    if (matchQuery && matchCategory && matchCity && matchMin && matchMax) {
      const label = alert.query || alert.category || alert.city || "votre alerte";
      await createNotification(
        alert.userId,
        "search_alert",
        `Nouvelle annonce correspondant à « ${label} » : ${listing.title}`,
        listing.id,
      );
    }
  }
}

export default router;
