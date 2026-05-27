import { Router, type IRouter } from "express";
import { eq, and, gte, lte, ilike, or, desc, asc, sql, SQL, ne } from "drizzle-orm";
import { db, listingsTable, usersTable, listingEventsTable, messagesTable } from "@workspace/db";
import {
  GetListingsQueryParams,
  CreateListingBody,
  UpdateListingBody,
  GetListingParams,
  UpdateListingParams,
  DeleteListingParams,
} from "@workspace/api-zod";
import { requireAuth, optionalAuth } from "../middlewares/auth";
import { triggerSearchAlerts } from "./search_alerts";

const router: IRouter = Router();

function formatUser(user: typeof usersTable.$inferSelect) {
  const { passwordHash: _ph, ...safe } = user;
  return { ...safe, createdAt: safe.createdAt.toISOString() };
}

function formatListing(
  listing: typeof listingsTable.$inferSelect,
  user?: typeof usersTable.$inferSelect,
) {
  return {
    ...listing,
    price: listing.price !== null ? Number(listing.price) : null,
    photos: (listing.photos as string[]) ?? [],
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    user: user ? formatUser(user) : undefined,
  };
}

router.get("/listings/user/mine", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select({ listing: listingsTable, user: usersTable })
    .from(listingsTable)
    .innerJoin(usersTable, eq(listingsTable.userId, usersTable.id))
    .where(eq(listingsTable.userId, req.userId!))
    .orderBy(desc(listingsTable.createdAt));

  res.json(rows.map((r) => formatListing(r.listing, r.user)));
});

router.get("/listings/stats", async (_req, res): Promise<void> => {
  const stats = await db
    .select({
      category: listingsTable.category,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(listingsTable)
    .where(eq(listingsTable.status, "active"))
    .groupBy(listingsTable.category);

  res.json(stats);
});

router.get("/listings/featured", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ listing: listingsTable, user: usersTable })
    .from(listingsTable)
    .innerJoin(usersTable, eq(listingsTable.userId, usersTable.id))
    .where(eq(listingsTable.status, "active"))
    .orderBy(desc(listingsTable.isBoosted), desc(listingsTable.createdAt))
    .limit(12);

  res.json(rows.map((r) => formatListing(r.listing, r.user)));
});

router.get("/listings", optionalAuth, async (req, res): Promise<void> => {
  const parsed = GetListingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { category, city, minPrice, maxPrice, search, page = 1, limit = 20, sortBy = "date", sortOrder = "desc" } = parsed.data;

  const conditions = [eq(listingsTable.status, "active")];

  if (category) conditions.push(eq(listingsTable.category, category));
  if (city) conditions.push(eq(listingsTable.city, city));
  if (minPrice !== undefined) conditions.push(gte(listingsTable.price, String(minPrice)));
  if (maxPrice !== undefined) conditions.push(lte(listingsTable.price, String(maxPrice)));
  if (search) {
    conditions.push(
      or(
        ilike(listingsTable.title, `%${search}%`),
        ilike(listingsTable.description, `%${search}%`),
      )!,
    );
  }

  const where = and(...conditions);

  const [totalResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(listingsTable)
    .where(where);

  const total = totalResult?.count ?? 0;
  const offset = (page - 1) * limit;

  const rows = await db
    .select({ listing: listingsTable, user: usersTable })
    .from(listingsTable)
    .innerJoin(usersTable, eq(listingsTable.userId, usersTable.id))
    .where(where)
    .orderBy(
      desc(listingsTable.isBoosted),
      sortBy === "price"
        ? sortOrder === "asc" ? asc(listingsTable.price) : desc(listingsTable.price)
        : sortOrder === "asc" ? asc(listingsTable.createdAt) : desc(listingsTable.createdAt)
    )
    .limit(limit)
    .offset(offset);

  res.json({
    listings: rows.map((r) => formatListing(r.listing, r.user)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

router.get("/listings/:id", optionalAuth, async (req, res): Promise<void> => {
  const params = GetListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({ listing: listingsTable, user: usersTable })
    .from(listingsTable)
    .innerJoin(usersTable, eq(listingsTable.userId, usersTable.id))
    .where(eq(listingsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Annonce introuvable" });
    return;
  }

  res.json(formatListing(row.listing, row.user));
});

router.post("/listings", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, price, category, city, photos } = parsed.data;

  const [listing] = await db
    .insert(listingsTable)
    .values({
      title,
      description,
      price: price !== undefined ? String(price) : null,
      category,
      city,
      photos: photos ?? [],
      status: "pending",
      userId: req.userId!,
    })
    .returning();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!));

  res.status(201).json(formatListing(listing, user));
});

router.patch("/listings/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Annonce introuvable" });
    return;
  }

  if (existing.userId !== req.userId) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  const parsed = UpdateListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.price !== undefined) {
    updateData.price = String(parsed.data.price);
  }

  const [updated] = await db
    .update(listingsTable)
    .set(updateData)
    .where(eq(listingsTable.id, params.data.id))
    .returning();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, updated.userId));

  res.json(formatListing(updated, user));
});

router.post("/listings/:id/renew", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

  const [existing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Annonce introuvable" }); return; }
  if (existing.userId !== req.userId) { res.status(403).json({ error: "Accès interdit" }); return; }

  const [updated] = await db
    .update(listingsTable)
    .set({ createdAt: new Date(), updatedAt: new Date() })
    .where(eq(listingsTable.id, id))
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
  res.json(formatListing(updated, user));
});

router.delete("/listings/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Annonce introuvable" });
    return;
  }

  if (existing.userId !== req.userId) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  await db.delete(listingsTable).where(eq(listingsTable.id, params.data.id));

  res.json({ message: "Annonce supprimée" });
});

router.get("/listings/:id/similar", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id));
  if (!listing) { res.status(404).json({ error: "Annonce introuvable" }); return; }

  const rows = await db
    .select({ listing: listingsTable, user: usersTable })
    .from(listingsTable)
    .leftJoin(usersTable, eq(listingsTable.userId, usersTable.id))
    .where(
      and(
        eq(listingsTable.category, listing.category),
        eq(listingsTable.status, "active"),
        ne(listingsTable.id, id),
      ),
    )
    .orderBy(desc(listingsTable.createdAt))
    .limit(6);

  res.json(rows.map(({ listing: l, user }) => formatListing(l, user ?? undefined)));
});

router.post("/listings/:id/track", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(204).end(); return; }
  const { eventType } = req.body as { eventType?: string };
  if (!eventType) { res.status(204).end(); return; }

  await db.insert(listingEventsTable).values({ listingId: id, eventType }).catch(() => {});
  res.status(204).end();
});

router.get("/listings/:id/stats", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id));
  if (!listing) { res.status(404).json({ error: "Annonce introuvable" }); return; }
  if (listing.userId !== req.userId!) { res.status(403).json({ error: "Accès interdit" }); return; }

  const events = await db.select().from(listingEventsTable).where(eq(listingEventsTable.listingId, id));
  const views = events.filter((e) => e.eventType === "view").length;
  const phoneClicks = events.filter((e) => e.eventType === "phone_click").length;
  const whatsappClicks = events.filter((e) => e.eventType === "whatsapp_click").length;

  const [msgResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(messagesTable)
    .where(eq(messagesTable.listingId, id));

  res.json({
    views,
    phoneClicks,
    whatsappClicks,
    messageCount: msgResult?.count ?? 0,
  });
});

export default router;
