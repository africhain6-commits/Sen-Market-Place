import { Router, type IRouter } from "express";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { db, messagesTable, usersTable, listingsTable } from "@workspace/db";
import { SendMessageBody, GetConversationParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { createNotification } from "./notifications";

const router: IRouter = Router();

function formatUser(user: typeof usersTable.$inferSelect) {
  const { passwordHash: _ph, ...safe } = user;
  return { ...safe, createdAt: safe.createdAt.toISOString() };
}

function formatMessage(
  msg: typeof messagesTable.$inferSelect,
  sender?: typeof usersTable.$inferSelect,
) {
  return {
    ...msg,
    createdAt: msg.createdAt.toISOString(),
    sender: sender ? formatUser(sender) : undefined,
  };
}

router.get("/messages/conversations", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;

  const msgs = await db
    .select({
      msg: messagesTable,
      sender: usersTable,
    })
    .from(messagesTable)
    .innerJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
    .where(
      or(
        eq(messagesTable.senderId, userId),
        eq(messagesTable.receiverId, userId),
      ),
    )
    .orderBy(desc(messagesTable.createdAt));

  const convMap = new Map<
    string,
    {
      listingId: number;
      otherUserId: number;
      lastMsg: typeof messagesTable.$inferSelect;
      sender: typeof usersTable.$inferSelect;
    }
  >();

  for (const { msg, sender } of msgs) {
    const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    const key = `${msg.listingId}-${Math.min(msg.senderId, msg.receiverId)}-${Math.max(msg.senderId, msg.receiverId)}`;

    if (!convMap.has(key)) {
      convMap.set(key, {
        listingId: msg.listingId,
        otherUserId,
        lastMsg: msg,
        sender,
      });
    }
  }

  const conversations = await Promise.all(
    Array.from(convMap.values()).map(async ({ listingId, otherUserId, lastMsg, sender }) => {
      const [listing] = await db
        .select()
        .from(listingsTable)
        .where(eq(listingsTable.id, listingId));

      const [otherUser] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, otherUserId));

      const [listingUser] = listing
        ? await db.select().from(usersTable).where(eq(usersTable.id, listing.userId))
        : [undefined];

      const [unreadResult] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(messagesTable)
        .where(
          and(
            eq(messagesTable.receiverId, userId),
            eq(messagesTable.senderId, otherUserId),
            eq(messagesTable.listingId, listingId),
          ),
        );

      return {
        listingId,
        listing: listing
          ? {
              ...listing,
              price: listing.price !== null ? Number(listing.price) : null,
              photos: (listing.photos as string[]) ?? [],
              createdAt: listing.createdAt.toISOString(),
              updatedAt: listing.updatedAt.toISOString(),
              user: listingUser ? formatUser(listingUser) : undefined,
            }
          : null,
        otherUser: otherUser ? formatUser(otherUser) : null,
        lastMessage: formatMessage(lastMsg, sender),
        unreadCount: unreadResult?.count ?? 0,
      };
    }),
  );

  res.json(conversations);
});

router.get(
  "/messages/conversations/:listingId/:otherUserId",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = GetConversationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const userId = req.userId!;
    const { listingId, otherUserId } = params.data;

    const msgs = await db
      .select({ msg: messagesTable, sender: usersTable })
      .from(messagesTable)
      .innerJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
      .where(
        and(
          eq(messagesTable.listingId, listingId),
          or(
            and(eq(messagesTable.senderId, userId), eq(messagesTable.receiverId, otherUserId)),
            and(eq(messagesTable.senderId, otherUserId), eq(messagesTable.receiverId, userId)),
          ),
        ),
      )
      .orderBy(messagesTable.createdAt);

    res.json(msgs.map(({ msg, sender }) => formatMessage(msg, sender)));
  },
);

router.post("/messages", requireAuth, async (req, res): Promise<void> => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { content, receiverId, listingId } = parsed.data;
  const senderId = req.userId!;

  if (senderId === receiverId) {
    res.status(400).json({ error: "Vous ne pouvez pas vous envoyer un message" });
    return;
  }

  const [msg] = await db
    .insert(messagesTable)
    .values({ content, senderId, receiverId, listingId })
    .returning();

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, senderId));

  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, listingId));
  const senderName = sender?.name ?? "Quelqu'un";
  const listingTitle = listing?.title ?? "une annonce";
  await createNotification(
    receiverId,
    "message",
    `${senderName} vous a envoyé un message concernant « ${listingTitle} »`,
    listingId,
  );

  res.status(201).json(formatMessage(msg, sender));
});

export default router;
