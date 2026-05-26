import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, listingsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function requireAdmin(
  req: Parameters<typeof requireAuth>[0],
  res: Parameters<typeof requireAuth>[1],
  next: Parameters<typeof requireAuth>[2],
): void {
  if (!req.userId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }
  next();
}

async function checkAdmin(userId: number): Promise<boolean> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return user?.isAdmin === true;
}

function formatUser(user: typeof usersTable.$inferSelect) {
  const { passwordHash: _ph, ...safe } = user;
  return { ...safe, createdAt: safe.createdAt.toISOString() };
}

function formatListing(
  listing: typeof listingsTable.$inferSelect,
  user?: typeof usersTable.$inferSelect,
) {
  return {
    ...listing,
    price: listing.price !== null ? Number(listing.price) : null,
    photos: (listing.photos as string[]) ?? [],
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    user: user ? formatUser(user) : undefined,
  };
}

router.get("/admin/listings", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  const statusFilter = req.query.status as string | undefined;

  const rows = await db
    .select({ listing: listingsTable, user: usersTable })
    .from(listingsTable)
    .innerJoin(usersTable, eq(listingsTable.userId, usersTable.id))
    .orderBy(desc(listingsTable.createdAt));

  const filtered = statusFilter
    ? rows.filter((r) => r.listing.status === statusFilter)
    : rows;

  res.json(filtered.map((r) => formatListing(r.listing, r.user)));
});

router.patch("/admin/listings/:id/approve", requireAuth, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [updated] = await db
    .update(listingsTable)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(listingsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Annonce introuvable" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
  res.json(formatListing(updated, user));
});

router.patch("/admin/listings/:id/reject", requireAuth, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [updated] = await db
    .update(listingsTable)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(listingsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Annonce introuvable" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
  res.json(formatListing(updated, user));
});

router.patch("/admin/listings/:id/boost", requireAuth, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const days = typeof req.body.days === "number" ? req.body.days : 30;

  const boostedUntil = new Date();
  boostedUntil.setDate(boostedUntil.getDate() + days);

  const [updated] = await db
    .update(listingsTable)
    .set({ isBoosted: true, boostedUntil, updatedAt: new Date() })
    .where(eq(listingsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Annonce introuvable" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
  res.json(formatListing(updated, user));
});

router.patch("/admin/listings/:id/unboost", requireAuth, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [updated] = await db
    .update(listingsTable)
    .set({ isBoosted: false, boostedUntil: null, updatedAt: new Date() })
    .where(eq(listingsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Annonce introuvable" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
  res.json(formatListing(updated, user));
});

router.get("/admin/users", requireAuth, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(users.map(formatUser));
});

router.patch("/admin/users/:id/ban", requireAuth, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }

  await db.delete(listingsTable).where(eq(listingsTable.userId, id));

  res.json({ message: `Les annonces de ${user.name} ont été supprimées.` });
});

router.patch("/admin/users/:id/make-admin", requireAuth, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [updated] = await db
    .update(usersTable)
    .set({ isAdmin: true })
    .where(eq(usersTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }
  res.json({ message: `${updated.name} est maintenant administrateur.` });
});

router.delete("/admin/listings/:id", requireAuth, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id));
  if (!listing) {
    res.status(404).json({ error: "Annonce introuvable" });
    return;
  }
  await db.delete(listingsTable).where(eq(listingsTable.id, id));
  res.json({ message: "Annonce supprimée" });
});

router.post("/admin/seed-listings", requireAuth, async (req, res): Promise<void> => {
  if (!(await checkAdmin(req.userId!))) {
    res.status(403).json({ error: "Accès interdit" });
    return;
  }

  const seedData = [
    { title: "Appartement F3 meublé - Mermoz Dakar", description: "Bel appartement F3 entièrement meublé au cœur de Mermoz. Salon, 2 chambres, cuisine équipée, balcon avec vue dégagée. Gardiennage 24h, parking. Idéal pour famille ou expatrié. Disponible immédiatement.", price: 350000, category: "Immobilier", city: "Dakar", photos: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"], userId: 1 },
    { title: "Villa 4 chambres à vendre - Almadies", description: "Magnifique villa de standing à vendre aux Almadies. 4 chambres, 3 salles de bain, grande terrasse, piscine privée, jardin paysager. Quartier résidentiel calme, proche de la mer. Titre foncier disponible.", price: 95000000, category: "Immobilier", city: "Dakar", photos: ["https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800"], userId: 2 },
    { title: "Studio à louer - Plateau Centre-Ville", description: "Studio moderne entièrement rénové au Plateau. Idéal pour étudiant ou jeune professionnel. Cuisine américaine, douche, climatisé. Eau et électricité inclus. Proche des transports et commerces.", price: 80000, category: "Immobilier", city: "Dakar", photos: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"], userId: 3 },
    { title: "Terrain 500m² viabilisé - Thiès", description: "Grand terrain de 500m² entièrement viabilisé (eau, électricité, voirie) à Thiès Château. Documents en règle, titre foncier propre. Zone résidentielle en plein développement.", price: 12000000, category: "Immobilier", city: "Thiès", photos: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"], userId: 4 },
    { title: "Toyota Hilux 2020 - Excellent état", description: "Toyota Hilux double cabine 2020, diesel 2.4L, 85 000 km, très bon état. Clim, GPS, 4x4, radio Bluetooth. Carnet d'entretien complet chez concessionnaire Toyota. Voiture de société bien entretenue.", price: 18500000, category: "Véhicules", city: "Dakar", photos: ["https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800"], userId: 1 },
    { title: "Peugeot 208 2019 - Première main", description: "Peugeot 208 essence 2019, 60 000 km, première main. Gris métallisé, écran tactile, caméra de recul, parktronic. Toujours entretenue chez Sénégal Peugeot. Très économique en carburant.", price: 8200000, category: "Véhicules", city: "Dakar", photos: ["https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800"], userId: 2 },
    { title: "Moto Bajaj Boxer 150cc - 2022", description: "Moto Bajaj Boxer 150cc, année 2022, 15 000 km seulement. Parfaite pour la livraison ou les déplacements en ville. Consommation très faible. Documents à jour, visite technique OK.", price: 650000, category: "Véhicules", city: "Dakar", photos: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"], userId: 3 },
    { title: "iPhone 15 Pro 256Go - Neuf sous blister", description: "iPhone 15 Pro 256Go Titane Naturel, neuf jamais ouvert sous blister original. Acheté à Dubai il y a 2 semaines. Facture disponible. Garantie Apple 1 an.", price: 950000, category: "Électronique", city: "Dakar", photos: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800"], userId: 4 },
    { title: "Samsung Galaxy A54 5G - Comme neuf", description: "Samsung Galaxy A54 5G, 128Go, comme neuf, 3 mois d'utilisation. Écran Super AMOLED 6.4 pouces, triple caméra 50MP, batterie 5000mAh. Vendu avec boite, chargeur et coque.", price: 280000, category: "Électronique", city: "Saint-Louis", photos: ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800"], userId: 2 },
    { title: "Laptop HP ProBook Core i5 - 8Go RAM", description: "PC portable HP ProBook 450 G8, Intel Core i5 11ème génération, 8Go RAM, SSD 256Go, écran 15.6 Full HD. Windows 11 Pro installé. Idéal pour le bureau ou les études.", price: 450000, category: "Électronique", city: "Dakar", photos: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800"], userId: 3 },
    { title: "Recherche poste Comptable - Expérience 5 ans", description: "Comptable diplômé BTS Comptabilité avec 5 ans d'expérience en entreprise. Maîtrise Sage 100, Excel, TVA, paie, bilan. Cherche poste stable CDI à Dakar. Disponible immédiatement.", price: null, category: "Emplois", city: "Dakar", photos: [], userId: 4 },
    { title: "Chauffeur expérimenté disponible - Permis ABC", description: "Chauffeur professionnel avec permis ABC, 10 ans d'expérience. Connaissance parfaite de Dakar et du Sénégal. Discret, ponctuel, non-fumeur. Disponible pour particulier ou entreprise.", price: null, category: "Emplois", city: "Dakar", photos: [], userId: 1 },
    { title: "Électricien diplômé - Devis gratuit", description: "Électricien diplômé CAP Électricité avec 8 ans d'expérience. Installation électrique, tableau, climatisation, groupe électrogène, dépannage urgent. Intervention rapide à Dakar et banlieue.", price: null, category: "Services", city: "Dakar", photos: ["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800"], userId: 2 },
    { title: "Couturière professionnelle - Boubous et robes", description: "Couturière professionnelle spécialisée dans les tenues africaines et modernes. Boubous, robes de cérémonie, tenues de mariée, uniformes. Travail rapide et soigné. Livraison possible à Dakar.", price: null, category: "Services", city: "Dakar", photos: [], userId: 3 },
    { title: "Canapé angle en cuir marron - 6 places", description: "Canapé angle en cuir véritable marron, 6 places, très bon état. Acheté il y a 2 ans, peu utilisé. Dimensions 280x180cm. Déménagement oblige. Livraison possible dans Dakar.", price: 180000, category: "Maison & Jardin", city: "Dakar", photos: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800"], userId: 4 },
    { title: "Réfrigérateur Samsung 400L - Double porte inox", description: "Réfrigérateur Samsung No Frost 400L double porte, couleur inox, très bon état. 3 ans d'utilisation, entretenu régulièrement. Fonctionne parfaitement. Vente cause déménagement.", price: 220000, category: "Maison & Jardin", city: "Dakar", photos: ["https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800"], userId: 1 },
  ];

  const inserted = [];
  for (const item of seedData) {
    const [listing] = await db.insert(listingsTable).values({
      title: item.title,
      description: item.description,
      price: item.price,
      category: item.category,
      city: item.city,
      photos: item.photos,
      status: "active",
      userId: item.userId,
    }).returning({ id: listingsTable.id, title: listingsTable.title });
    inserted.push(listing);
  }

  res.json({ message: `${inserted.length} annonces créées avec succès.`, ids: inserted.map(l => l.id) });
});

export default router;
