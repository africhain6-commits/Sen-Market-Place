import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function formatNotification(n: typeof notificationsTable.$inferSelect) {
  return { ...n, createdAt: n.createdAt.toISOString() };
}

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.userId!))
    .orderBy(notificationsTable.createdAt);

  res.json(notifications.map(formatNotification).reverse());
});

router.patch("/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.userId, req.userId!));

  res.json({ message: "Toutes les notifications marquées comme lues." });
});

export default router;

export async function createNotification(
  userId: number,
  type: string,
  message: string,
  relatedId?: number
) {
  await db.insert(notificationsTable).values({ userId, type, message, relatedId });
}
