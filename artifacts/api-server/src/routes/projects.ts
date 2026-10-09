import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, usersTable, projectsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim().slice(0, max);
  return text.length > 0 ? text : null;
}

async function getUser(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return user;
}

const projectFields = {
  id: projectsTable.id,
  userId: projectsTable.userId,
  title: projectsTable.title,
  developerName: projectsTable.developerName,
  city: projectsTable.city,
  neighborhood: projectsTable.neighborhood,
  description: projectsTable.description,
  launchPrice: projectsTable.launchPrice,
  paymentPlan: projectsTable.paymentPlan,
  deliveryDate: projectsTable.deliveryDate,
  photos: projectsTable.photos,
  status: projectsTable.status,
  createdAt: projectsTable.createdAt,
  ownerName: usersTable.name,
  ownerAgency: usersTable.agencyName,
  ownerVerified: usersTable.isVerified,
  phone: usersTable.phone,
  whatsapp: usersTable.whatsapp,
};

function serialize<T extends { createdAt: Date }>(row: T) {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

// Liste publique des projets validés
router.get("/projects", async (_req, res): Promise<void> => {
  const rows = await db
    .select(projectFields)
    .from(projectsTable)
    .innerJoin(usersTable, eq(projectsTable.userId, usersTable.id))
    .where(eq(projectsTable.status, "active"))
    .orderBy(desc(projectsTable.createdAt))
    .limit(60);

  res.json(rows.map(serialize));
});

// Projets en attente (admin)
router.get("/admin/projects/pending", requireAuth, async (req, res): Promise<void> => {
  const me = await getUser(req.userId!);
  if (me?.isAdmin !== true) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  const rows = await db
    .select(projectFields)
    .from(projectsTable)
    .innerJoin(usersTable, eq(projectsTable.userId, usersTable.id))
    .where(eq(projectsTable.status, "pending"))
    .orderBy(desc(projectsTable.createdAt))
    .limit(100);

  res.json(rows.map(serialize));
});

// Un professionnel (ou l'admin) soumet un projet
router.post("/projects", requireAuth, async (req, res): Promise<void> => {
  const me = await getUser(req.userId!);
  if (!me) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }
  const isAdmin = me.isAdmin === true;
  if (!isAdmin && me.accountType === "particulier") {
    res.status(403).json({ error: "Les projets sont réservés aux professionnels" });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const title = cleanText(body.title, 120);
  const city = cleanText(body.city, 100);
  const description = cleanText(body.description, 3000);

  if (!title || title.length < 5) {
    res.status(400).json({ error: "Le titre doit contenir au moins 5 caractères" });
    return;
  }
  if (!city) {
    res.status(400).json({ error: "La ville est obligatoire" });
    return;
  }
  if (!description || description.length < 20) {
    res.status(400).json({ error: "La description doit contenir au moins 20 caractères" });
    return;
  }

  const launchPrice =
    typeof body.launchPrice === "number" && body.launchPrice > 0 ? Math.round(body.launchPrice) : null;

  const photos = Array.isArray(body.photos)
    ? body.photos
        .filter((p): p is string => typeof p === "string" && /^(https?:\/\/|\/)/.test(p))
        .slice(0, 6)
    : [];

  const [created] = await db
    .insert(projectsTable)
    .values({
      userId: me.id,
      title,
      developerName: cleanText(body.developerName, 100) ?? me.agencyName,
      city,
      neighborhood: cleanText(body.neighborhood, 100),
      description,
      launchPrice,
      paymentPlan: cleanText(body.paymentPlan, 600),
      deliveryDate: cleanText(body.deliveryDate, 60),
      photos,
      status: isAdmin ? "active" : "pending",
    })
    .returning();

  res.status(201).json({ id: created.id, status: created.status });
});

// L'admin approuve un projet
router.patch("/admin/projects/:id/approve", requireAuth, async (req, res): Promise<void> => {
  const me = await getUser(req.userId!);
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

  const [updated] = await db
    .update(projectsTable)
    .set({ status: "active" })
    .where(eq(projectsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Projet introuvable" });
    return;
  }
  res.json({ id: updated.id, status: updated.status });
});

// Le propriétaire (ou l'admin) supprime un projet
router.delete("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) {
    res.status(404).json({ error: "Projet introuvable" });
    return;
  }

  const me = await getUser(req.userId!);
  if (project.userId !== req.userId && me?.isAdmin !== true) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  await db.delete(projectsTable).where(eq(projectsTable.id, id));
  res.json({ message: "Projet supprimé" });
});

export default router;
