import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, listingsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

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
