import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { db, usersTable, listingsTable, messagesTable, passwordResetTokensTable } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password, name, phone, whatsapp, city } = parsed.data;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existing.length > 0) {
    res.status(400).json({ error: "Cet email est déjà utilisé" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(usersTable)
    .values({ email, passwordHash, name, phone, whatsapp, city })
    .returning();

  req.session.userId = user.id;

  const token = await new Promise<string>((resolve, reject) => {
    req.session.save((err) => {
      if (err) return reject(err);
      resolve(req.sessionID);
    });
  });

  const { passwordHash: _ph, ...safeUser } = user;

  res.status(201).json({
    user: { ...safeUser, createdAt: safeUser.createdAt.toISOString() },
    token,
    message: "Compte créé avec succès",
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!user) {
    res.status(401).json({ error: "Email ou mot de passe incorrect" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Email ou mot de passe incorrect" });
    return;
  }

  req.session.userId = user.id;

  const token = await new Promise<string>((resolve, reject) => {
    req.session.save((err) => {
      if (err) return reject(err);
      resolve(req.sessionID);
    });
  });

  const { passwordHash: _ph, ...safeUser } = user;

  res.json({
    user: { ...safeUser, createdAt: safeUser.createdAt.toISOString() },
    token,
    message: "Connexion réussie",
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ message: "Déconnexion réussie" });
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!));

  if (!user) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  const { passwordHash: _ph, ...safeUser } = user;

  res.json({ ...safeUser, createdAt: safeUser.createdAt.toISOString() });
});

router.delete("/auth/account", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;

  await db.delete(messagesTable).where(eq(messagesTable.senderId, userId));
  await db.delete(listingsTable).where(eq(listingsTable.userId, userId));
  await db.delete(usersTable).where(eq(usersTable.id, userId));

  req.session.destroy(() => {
    res.json({ message: "Compte supprimé avec succès" });
  });
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email requis" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.trim().toLowerCase()));

  if (!user) {
    res.json({ message: "Si cet email existe, un code de réinitialisation a été généré." });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await db.insert(passwordResetTokensTable).values({
    userId: user.id,
    token,
    expiresAt,
  });

  res.json({
    message: "Si cet email existe, un code de réinitialisation a été généré.",
    token,
  });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || typeof token !== "string" || typeof newPassword !== "string") {
    res.status(400).json({ error: "Token et nouveau mot de passe requis" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères" });
    return;
  }

  const now = new Date();
  const [resetToken] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.token, token),
        gt(passwordResetTokensTable.expiresAt, now),
      ),
    );

  if (!resetToken || resetToken.usedAt) {
    res.status(400).json({ error: "Code invalide ou expiré" });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db
    .update(usersTable)
    .set({ passwordHash })
    .where(eq(usersTable.id, resetToken.userId));

  await db
    .update(passwordResetTokensTable)
    .set({ usedAt: now })
    .where(eq(passwordResetTokensTable.id, resetToken.id));

  res.json({ message: "Mot de passe réinitialisé avec succès" });
});

export default router;
