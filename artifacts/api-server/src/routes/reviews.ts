import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, reviewsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { CreateReviewBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatUser(user: typeof usersTable.$inferSelect) {
  const { passwordHash: _ph, ...safe } = user;
  return { ...safe, createdAt: safe.createdAt.toISOString() };
}

function formatReview(review: typeof reviewsTable.$inferSelect, fromUser?: typeof usersTable.$inferSelect) {
  return {
    ...review,
    createdAt: review.createdAt.toISOString(),
    fromUser: fromUser ? formatUser(fromUser) : undefined,
  };
}

router.get("/reviews/user/:id", async (req, res): Promise<void> => {
  const toUserId = parseInt(req.params.id, 10);
  if (isNaN(toUserId)) { res.status(400).json({ error: "ID invalide" }); return; }

  const rows = await db
    .select({ review: reviewsTable, fromUser: usersTable })
    .from(reviewsTable)
    .innerJoin(usersTable, eq(reviewsTable.fromUserId, usersTable.id))
    .where(eq(reviewsTable.toUserId, toUserId));

  res.json(rows.map((r) => formatReview(r.review, r.fromUser)));
});

router.post("/reviews", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { toUserId, rating, comment } = parsed.data;

  if (toUserId === req.userId) {
    res.status(400).json({ error: "Vous ne pouvez pas vous noter vous-même." });
    return;
  }

  const [toUser] = await db.select().from(usersTable).where(eq(usersTable.id, toUserId));
  if (!toUser) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }

  const [review] = await db
    .insert(reviewsTable)
    .values({ fromUserId: req.userId!, toUserId, rating, comment })
    .returning();

  const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  res.status(201).json(formatReview(review, fromUser));
});

export default router;
