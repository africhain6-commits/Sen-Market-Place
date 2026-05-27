import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, listingsTable, usersTable, favoritesTable, reviewsTable } from "@workspace/db";
import { sql as sqlExpr } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { createNotification } from "./notifications";

const router: IRouter = Router();

function requireAdmin(
  req: Parameters<typeof requireAuth>[0],
  res: Parameters<typeof requireAuth>[1],
  next: Parameters<typeof requireAuth>[2],
): void {
  if (!req.userId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }
  next();
}

async function checkAdmin(userId: number): Promise<boolean> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return user?.isAdmin === true;
}

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

router.get("/admin/listings", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  const statusFilter = req.query.status as string | undefined;

  const rows = await db
    .select({ listing: listingsTable, user: usersTable })
    .from(listingsTable)
    .innerJoin(usersTable, eq(listingsTable.userId, usersTable.id))
    .orderBy(desc(listingsTable.createdAt));

  const filtered = statusFilter
    ? rows.filter((r) => r.listing.status === statusFilter)
    : rows;

  res.json(filtered.map((r) => formatListing(r.listing, r.user)));
});

router.patch("/admin/listings/:id/approve", requireAuth, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [updated] = await db
    .update(listingsTable)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(listingsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Annonce introuvable" });
    return;
  }

  await createNotification(
    updated.userId,
    "listing_approved",
    `Votre annonce « ${updated.title} » a été approuvée et est maintenant en ligne.`,
    updated.id,
  );

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
  res.json(formatListing(updated, user));
});

router.patch("/admin/listings/:id/reject", requireAuth, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [updated] = await db
    .update(listingsTable)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(listingsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Annonce introuvable" });
    return;
  }

  await createNotification(
    updated.userId,
    "listing_rejected",
    `Votre annonce « ${updated.title} » a été refusée. Vous pouvez la modifier et la resoumettre.`,
    updated.id,
  );

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
  res.json(formatListing(updated, user));
});

router.patch("/admin/listings/:id/boost", requireAuth, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const days = typeof req.body.days === "number" ? req.body.days : 30;

  const boostedUntil = new Date();
  boostedUntil.setDate(boostedUntil.getDate() + days);

  const [updated] = await db
    .update(listingsTable)
    .set({ isBoosted: true, boostedUntil, updatedAt: new Date() })
    .where(eq(listingsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Annonce introuvable" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
  res.json(formatListing(updated, user));
});

router.patch("/admin/listings/:id/unboost", requireAuth, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [updated] = await db
    .update(listingsTable)
    .set({ isBoosted: false, boostedUntil: null, updatedAt: new Date() })
    .where(eq(listingsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Annonce introuvable" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
  res.json(formatListing(updated, user));
});

router.get("/admin/users", requireAuth, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(users.map(formatUser));
});

router.patch("/admin/users/:id/ban", requireAuth, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }

  await db.delete(listingsTable).where(eq(listingsTable.userId, id));

  res.json({ message: `Les annonces de ${user.name} ont été supprimées.` });
});

router.patch("/admin/users/:id/make-admin", requireAuth, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [updated] = await db
    .update(usersTable)
    .set({ isAdmin: true })
    .where(eq(usersTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }
  res.json({ message: `${updated.name} est maintenant administrateur.` });
});

router.patch("/admin/users/:id/revoke-admin", requireAuth, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (id === req.userId) {
    res.status(400).json({ error: "Vous ne pouvez pas retirer vos propres droits admin." });
    return;
  }
  const [updated] = await db
    .update(usersTable)
    .set({ isAdmin: false })
    .where(eq(usersTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }
  res.json({ message: `Les droits admin de ${updated.name} ont été retirés.` });
});

router.get("/admin/stats", requireAuth, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) { res.status(403).json({ error: "Accès interdit" }); return; }

  const [usersCount] = await db.select({ count: sqlExpr<number>`cast(count(*) as int)` }).from(usersTable);
  const [totalListings] = await db.select({ count: sqlExpr<number>`cast(count(*) as int)` }).from(listingsTable);
  const [activeListings] = await db.select({ count: sqlExpr<number>`cast(count(*) as int)` }).from(listingsTable).where(eq(listingsTable.status, "active"));
  const [pendingListings] = await db.select({ count: sqlExpr<number>`cast(count(*) as int)` }).from(listingsTable).where(eq(listingsTable.status, "pending"));
  const [rejectedListings] = await db.select({ count: sqlExpr<number>`cast(count(*) as int)` }).from(listingsTable).where(eq(listingsTable.status, "rejected"));
  const [boostedListings] = await db.select({ count: sqlExpr<number>`cast(count(*) as int)` }).from(listingsTable).where(eq(listingsTable.isBoosted, true));
  const [totalFavorites] = await db.select({ count: sqlExpr<number>`cast(count(*) as int)` }).from(favoritesTable);
  const [totalReviews] = await db.select({ count: sqlExpr<number>`cast(count(*) as int)` }).from(reviewsTable);
  const listingsByCategory = await db
    .select({ category: listingsTable.category, count: sqlExpr<number>`cast(count(*) as int)` })
    .from(listingsTable)
    .where(eq(listingsTable.status, "active"))
    .groupBy(listingsTable.category)
    .orderBy(sqlExpr`count(*) desc`);

  res.json({
    totalUsers: usersCount?.count ?? 0,
    totalListings: totalListings?.count ?? 0,
    activeListings: activeListings?.count ?? 0,
    pendingListings: pendingListings?.count ?? 0,
    rejectedListings: rejectedListings?.count ?? 0,
    boostedListings: boostedListings?.count ?? 0,
    totalFavorites: totalFavorites?.count ?? 0,
    totalReviews: totalReviews?.count ?? 0,
    listingsByCategory,
  });
});

router.delete("/admin/listings/:id", requireAuth, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id));
  if (!listing) {
    res.status(404).json({ error: "Annonce introuvable" });
    return;
  }
  await db.delete(listingsTable).where(eq(listingsTable.id, id));
  res.json({ message: "Annonce supprimée" });
});

export default router;
