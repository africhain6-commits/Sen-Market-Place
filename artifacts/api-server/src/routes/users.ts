import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { GetUserParams, UpdateUserParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function formatUser(user: typeof usersTable.$inferSelect) {
  const { passwordHash: _ph, ...safe } = user;
  return { ...safe, createdAt: safe.createdAt.toISOString() };
}

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.data.id));

  if (!user) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }

  res.json(formatUser(user));
});

router.patch("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (params.data.id !== req.userId) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  // Seuls ces champs peuvent être modifiés par l'utilisateur lui-même
  const body = (req.body ?? {}) as Record<string, unknown>;
  const updates: Partial<typeof usersTable.$inferInsert> = {};

  const readText = (value: unknown, max: number): string | null | undefined => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim().slice(0, max);
    return trimmed === "" ? null : trimmed;
  };

  if (body.name !== undefined) {
    const name = readText(body.name, 100);
    if (!name) {
      res.status(400).json({ error: "Le nom est obligatoire" });
      return;
    }
    updates.name = name;
  }

  const phone = readText(body.phone, 30);
  if (phone !== undefined) updates.phone = phone;

  const whatsapp = readText(body.whatsapp, 30);
  if (whatsapp !== undefined) updates.whatsapp = whatsapp;

  const city = readText(body.city, 100);
  if (city !== undefined) updates.city = city;

  const avatarUrl = readText(body.avatarUrl, 500);
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Aucune modification à enregistrer" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }

  res.json(formatUser(updated));
});

export default router;
