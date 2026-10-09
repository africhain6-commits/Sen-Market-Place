import { Router, type IRouter } from "express";
import { and, asc, eq, gt, lt } from "drizzle-orm";
import { db, usersTable, storiesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ACTIVE_STORIES = 10;

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim().slice(0, max);
  return text.length > 0 ? text : null;
}

// Liste publique des stories de moins de 24 h, regroupées par professionnel
router.get("/stories", async (_req, res): Promise<void> => {
  const cutoff = new Date(Date.now() - DAY_MS);

  // Nettoyage des stories expirées
  try {
    await db.delete(storiesTable).where(lt(storiesTable.createdAt, cutoff));
  } catch {
    // Pas grave : le filtre ci-dessous masque de toute façon les stories expirées
  }

  const rows = await db
    .select({
      id: storiesTable.id,
      imageUrl: storiesTable.imageUrl,
      caption: storiesTable.caption,
      createdAt: storiesTable.createdAt,
      userId: usersTable.id,
      name: usersTable.name,
      avatarUrl: usersTable.avatarUrl,
      accountType: usersTable.accountType,
      agencyName: usersTable.agencyName,
      isVerified: usersTable.isVerified,
    })
    .from(storiesTable)
    .innerJoin(usersTable, eq(storiesTable.userId, usersTable.id))
    .where(gt(storiesTable.createdAt, cutoff))
    .orderBy(asc(storiesTable.createdAt));

  const groups = new Map<
    number,
    {
      user: {
        id: number;
        name: string;
        avatarUrl: string | null;
        accountType: string;
        agencyName: string | null;
        isVerified: boolean;
      };
      stories: { id: number; imageUrl: string; caption: string | null; createdAt: string }[];
      lastAt: number;
    }
  >();

  for (const r of rows) {
    let group = groups.get(r.userId);
    if (!group) {
      group = {
        user: {
          id: r.userId,
          name: r.name,
          avatarUrl: r.avatarUrl,
          accountType: r.accountType,
          agencyName: r.agencyName,
          isVerified: r.isVerified,
        },
        stories: [],
        lastAt: 0,
      };
      groups.set(r.userId, group);
    }
    group.stories.push({
      id: r.id,
      imageUrl: r.imageUrl,
      caption: r.caption,
      createdAt: r.createdAt.toISOString(),
    });
    group.lastAt = Math.max(group.lastAt, r.createdAt.getTime());
  }

  const result = Array.from(groups.values())
    .sort((a, b) => b.lastAt - a.lastAt)
    .map(({ user, stories }) => ({ user, stories }));

  res.json(result);
});

// Un professionnel publie une story
router.post("/stories", requireAuth, async (req, res): Promise<void> => {
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!me) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }
  if (me.accountType === "particulier" && me.isAdmin !== true) {
    res.status(403).json({ error: "Les stories sont réservées aux professionnels" });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const imageUrl = cleanText(body.imageUrl, 500);
  if (!imageUrl || !/^(https?:\/\/|\/)/.test(imageUrl)) {
    res.status(400).json({ error: "Une photo est obligatoire" });
    return;
  }
  const caption = cleanText(body.caption, 200);

  const cutoff = new Date(Date.now() - DAY_MS);
  const active = await db
    .select({ id: storiesTable.id })
    .from(storiesTable)
    .where(and(eq(storiesTable.userId, me.id), gt(storiesTable.createdAt, cutoff)));

  if (active.length >= MAX_ACTIVE_STORIES) {
    res.status(400).json({ error: "Vous avez atteint la limite de 10 stories par 24 h" });
    return;
  }

  const [created] = await db
    .insert(storiesTable)
    .values({ userId: me.id, imageUrl, caption, createdAt: new Date() })
    .returning();

  res.status(201).json({
    id: created.id,
    imageUrl: created.imageUrl,
    caption: created.caption,
    createdAt: created.createdAt.toISOString(),
  });
});

// Le propriétaire (ou un admin) supprime une story
router.delete("/stories/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const [story] = await db.select().from(storiesTable).where(eq(storiesTable.id, id));
  if (!story) {
    res.status(404).json({ error: "Story introuvable" });
    return;
  }

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (story.userId !== req.userId && me?.isAdmin !== true) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  await db.delete(storiesTable).where(eq(storiesTable.id, id));
  res.json({ message: "Story supprimée" });
});

export default router;
