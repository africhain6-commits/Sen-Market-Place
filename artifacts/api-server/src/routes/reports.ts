import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, reportsTable, listingsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function formatUser(user: typeof usersTable.$inferSelect) {
  const { passwordHash: _ph, ...safe } = user;
  return { ...safe, createdAt: safe.createdAt.toISOString() };
}

function formatListing(listing: typeof listingsTable.$inferSelect, user?: typeof usersTable.$inferSelect) {
  return {
    ...listing,
    price: listing.price !== null ? Number(listing.price) : null,
    photos: (listing.photos as string[]) ?? [],
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    user: user ? formatUser(user) : undefined,
  };
}

router.post("/listings/:id/report", requireAuth, async (req, res): Promise<void> => {
  const listingId = parseInt(String(req.params.id), 10);
  if (isNaN(listingId)) { res.status(400).json({ error: "ID invalide" }); return; }

  const { reason, details } = req.body as { reason?: string; details?: string };
  if (!reason?.trim()) { res.status(400).json({ error: "La raison est requise" }); return; }

  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, listingId));
  if (!listing) { res.status(404).json({ error: "Annonce introuvable" }); return; }

  if (listing.userId === req.userId!) {
    res.status(400).json({ error: "Vous ne pouvez pas signaler votre propre annonce" });
    return;
  }

  await db.insert(reportsTable).values({
    listingId,
    reporterId: req.userId!,
    reason,
    details: details ?? null,
  });

  res.status(201).json({ message: "Annonce signalée. Merci pour votre vigilance." });
});

router.get("/admin/reports", requireAuth, async (req, res): Promise<void> => {
  const [me] = await db.select({ isAdmin: usersTable.isAdmin }).from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!me?.isAdmin) { res.status(403).json({ error: "Accès interdit" }); return; }

  const rows = await db
    .select({ report: reportsTable, listing: listingsTable, reporter: usersTable })
    .from(reportsTable)
    .leftJoin(listingsTable, eq(reportsTable.listingId, listingsTable.id))
    .leftJoin(usersTable, eq(reportsTable.reporterId, usersTable.id))
    .orderBy(desc(reportsTable.createdAt));

  res.json(rows.map(({ report, listing, reporter }) => ({
    ...report,
    createdAt: report.createdAt.toISOString(),
    resolvedAt: report.resolvedAt?.toISOString() ?? null,
    listing: listing ? formatListing(listing) : null,
    reporter: reporter ? formatUser(reporter) : null,
  })));
});

router.patch("/admin/reports/:id/resolve", requireAuth, async (req, res): Promise<void> => {
  const [me] = await db.select({ isAdmin: usersTable.isAdmin }).from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!me?.isAdmin) { res.status(403).json({ error: "Accès interdit" }); return; }

  const id = parseInt(String(req.params.id), 10);
  const { action } = req.body as { action: "resolved" | "dismissed" };

  await db.update(reportsTable)
    .set({ status: action, resolvedAt: new Date() })
    .where(eq(reportsTable.id, id));

  res.json({ message: `Signalement ${action === "resolved" ? "résolu" : "ignoré"}.` });
});

export default router;
