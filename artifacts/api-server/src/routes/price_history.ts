import { Router, type IRouter } from "express";
import { eq, asc, desc, sql, and, gte, lte } from "drizzle-orm";
import { db, listingsTable, priceHistoryTable } from "@workspace/db";

const router: IRouter = Router();

const DAKAR_NEIGHBORHOODS = [
  { name: "Plateau", slug: "plateau" },
  { name: "Almadies", slug: "almadies" },
  { name: "Sacré-Cœur", slug: "sacre-coeur" },
  { name: "Mermoz", slug: "mermoz" },
  { name: "Liberté", slug: "liberte" },
  { name: "Parcelles Assainies", slug: "parcelles-assainies" },
  { name: "Grand Yoff", slug: "grand-yoff" },
  { name: "Ouakam", slug: "ouakam" },
  { name: "Ngor", slug: "ngor" },
  { name: "Yoff", slug: "yoff" },
  { name: "Pikine", slug: "pikine" },
  { name: "Guédiawaye", slug: "guediawaye" },
  { name: "Rufisque", slug: "rufisque" },
  { name: "Mbao", slug: "mbao" },
  { name: "Thiaroye", slug: "thiaroye" },
  { name: "Médina", slug: "medina" },
  { name: "Fann", slug: "fann" },
  { name: "Point E", slug: "point-e" },
];

router.get("/listings/:id/price-history", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id));
  if (!listing) { res.status(404).json({ error: "Annonce introuvable" }); return; }

  const history = await db
    .select()
    .from(priceHistoryTable)
    .where(eq(priceHistoryTable.listingId, id))
    .orderBy(asc(priceHistoryTable.recordedAt));

  res.json(history.map((h) => ({
    ...h,
    price: Number(h.price),
    recordedAt: h.recordedAt.toISOString(),
  })));
});

router.get("/listings/price-estimate", async (req, res): Promise<void> => {
  const { category, city } = req.query as { category?: string; city?: string };
  if (!category) { res.status(400).json({ error: "Catégorie requise" }); return; }

  const conditions = [
    eq(listingsTable.status, "active"),
    eq(listingsTable.category, category),
    sql`${listingsTable.price} IS NOT NULL`,
  ];
  if (city) conditions.push(eq(listingsTable.city, city));

  const rows = await db
    .select({ price: listingsTable.price })
    .from(listingsTable)
    .where(and(...conditions));

  const prices = rows
    .map((r) => Number(r.price))
    .filter((p) => p > 0)
    .sort((a, b) => a - b);

  if (prices.length === 0) {
    res.json({ category, city: city ?? null, min: null, max: null, median: null, count: 0 });
    return;
  }

  const min = prices[0];
  const max = prices[prices.length - 1];
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 !== 0
    ? prices[mid]
    : (prices[mid - 1] + prices[mid]) / 2;

  res.json({ category, city: city ?? null, min, max, median, count: prices.length });
});

router.get("/listings/neighborhoods", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      title: listingsTable.title,
      category: listingsTable.category,
      price: listingsTable.price,
      city: listingsTable.city,
    })
    .from(listingsTable)
    .where(and(eq(listingsTable.status, "active"), eq(listingsTable.city, "Dakar")));

  const neighborhoodMap: Record<string, { count: number; prices: number[]; categories: Record<string, number> }> = {};

  for (const n of DAKAR_NEIGHBORHOODS) {
    neighborhoodMap[n.slug] = { count: 0, prices: [], categories: {} };
  }

  for (const row of rows) {
    const text = (row.title || "").toLowerCase();
    for (const n of DAKAR_NEIGHBORHOODS) {
      const slugWords = n.slug.replace(/-/g, " ");
      const nameWords = n.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (text.includes(n.name.toLowerCase()) || text.includes(slugWords) || text.includes(nameWords)) {
        neighborhoodMap[n.slug].count++;
        if (row.price) neighborhoodMap[n.slug].prices.push(Number(row.price));
        neighborhoodMap[n.slug].categories[row.category] = (neighborhoodMap[n.slug].categories[row.category] ?? 0) + 1;
        break;
      }
    }
    neighborhoodMap[DAKAR_NEIGHBORHOODS[0].slug].count++;
  }

  const result = DAKAR_NEIGHBORHOODS.map((n) => {
    const data = neighborhoodMap[n.slug];
    const prices = data.prices;
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
    return {
      name: n.name,
      slug: n.slug,
      count: data.count,
      avgPrice: avgPrice ? Math.round(avgPrice) : null,
      categories: data.categories,
    };
  });

  res.json(result.sort((a, b) => b.count - a.count));
});

export default router;
