import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, ne, or, sql, type SQL } from "drizzle-orm";
import { db, usersTable, listingsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const ACCOUNT_TYPES = ["particulier", "courtier", "boutique", "prestataire"] as const;

function isAccountType(value: unknown): value is (typeof ACCOUNT_TYPES)[number] {
  return typeof value === "string" && (ACCOUNT_TYPES as readonly string[]).includes(value);
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim().slice(0, max);
  return text.length > 0 ? text : null;
}

// Liste publique des professionnels (courtiers, boutiques, prestataires)
router.get("/courtiers", async (req, res): Promise<void> => {
  const type = typeof req.query.type === "string" ? req.query.type : "";
  const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";

  const conditions: SQL[] = [];
  if (isAccountType(type) && type !== "particulier") {
    conditions.push(eq(usersTable.accountType, type));
  } else {
    conditions.push(ne(usersTable.accountType, "particulier"));
  }
  if (q) {
    const pattern = `%${q}%`;
    const search = or(
      ilike(usersTable.name, pattern),
      ilike(usersTable.agencyName, pattern),
      ilike(usersTable.city, pattern),
    );
    if (search) conditions.push(search);
  }

  const activeCount = sql<number>`cast(count(${listingsTable.id}) as int)`;

  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      avatarUrl: usersTable.avatarUrl,
      city: usersTable.city,
      accountType: usersTable.accountType,
      agencyName: usersTable.agencyName,
      languages: usersTable.languages,
      isVerified: usersTable.isVerified,
      phone: usersTable.phone,
      whatsapp: usersTable.whatsapp,
      createdAt: usersTable.createdAt,
      activeListings: activeCount,
    })
    .from(usersTable)
    .leftJoin(
      listingsTable,
      and(eq(listingsTable.userId, usersTable.id), eq(listingsTable.status, "active")),
    )
    .where(and(...conditions))
    .groupBy(usersTable.id)
    .orderBy(desc(usersTable.isVerified), desc(activeCount), desc(usersTable.createdAt))
    .limit(60);

  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

// L'utilisateur choisit son type de compte (la vérification reste réservée aux admins)
router.patch("/me/pro-profile", requireAuth, async (req, res): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;

  if (!isAccountType(body.accountType)) {
    res.status(400).json({ error: "Type de compte invalide" });
    return;
  }
  const accountType = body.accountType;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!existing) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }

  const changedType = existing.accountType !== accountType;

  const [updated] = await db
    .update(usersTable)
    .set({
      accountType,
      agencyName: accountType === "particulier" ? null : cleanText(body.agencyName, 100),
      languages: accountType === "particulier" ? null : cleanText(body.languages, 100),
      ...(changedType ? { isVerified: false } : {}),
    })
    .where(eq(usersTable.id, req.userId!))
    .returning();

  res.json({
    id: updated.id,
    accountType: updated.accountType,
    agencyName: updated.agencyName,
    languages: updated.languages,
    isVerified: updated.isVerified,
  });
});

// Un admin marque un professionnel comme « Vérifié »
router.patch("/admin/users/:id/verify", requireAuth, async (req, res): Promise<void> => {
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (me?.isAdmin !== true) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const verified = (req.body as { verified?: unknown } | undefined)?.verified === true;

  const [updated] = await db
    .update(usersTable)
    .set({ isVerified: verified })
    .where(eq(usersTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }

  res.json({ id: updated.id, isVerified: updated.isVerified });
});

export default router;
