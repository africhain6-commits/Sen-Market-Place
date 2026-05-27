import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, favoritesTable, listingsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function formatListing(listing: typeof listingsTable.$inferSelect, user?: typeof usersTable.$inferSelect) {
  return {
    ...listing,
    price: listing.price !== null ? Number(listing.price) : null,
    photos: (listing.photos as string[]) ?? [],
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    user: user ? { ...user, createdAt: user.createdAt.toISOString() } : undefined,
  };
}

router.get("/favorites", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select({ listing: listingsTable, user: usersTable })
    .from(favoritesTable)
    .innerJoin(listingsTable, eq(favoritesTable.listingId, listingsTable.id))
    .innerJoin(usersTable, eq(listingsTable.userId, usersTable.id))
    .where(eq(favoritesTable.userId, req.userId!));

  res.json(rows.map((r) => formatListing(r.listing, r.user)));
});

router.post("/favorites/:listingId", requireAuth, async (req, res): Promise<void> => {
  const listingId = parseInt(String(req.params.listingId), 10);
  if (isNaN(listingId)) { res.status(400).json({ error: "ID invalide" }); return; }

  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, listingId));
  if (!listing) { res.status(404).json({ error: "Annonce introuvable" }); return; }

  await db.insert(favoritesTable).values({ userId: req.userId!, listingId }).onConflictDoNothing();
  res.json({ message: "Ajouté aux favoris" });
});

router.delete("/favorites/:listingId", requireAuth, async (req, res): Promise<void> => {
  const listingId = parseInt(String(req.params.listingId), 10);
  if (isNaN(listingId)) { res.status(400).json({ error: "ID invalide" }); return; }

  await db.delete(favoritesTable).where(
    and(eq(favoritesTable.userId, req.userId!), eq(favoritesTable.listingId, listingId))
  );
  res.json({ message: "Retiré des favoris" });
});

export default router;
