import { db } from "@workspace/db";
import { listings } from "@workspace/db/schema";
import { lte } from "drizzle-orm";

async function main() {
  const deleted = await db
    .delete(listings)
    .where(lte(listings.id, 13))
    .returning({ id: listings.id, title: listings.title });

  if (deleted.length === 0) {
    console.log("Aucune annonce de démo trouvée (déjà supprimées).");
  } else {
    console.log(`${deleted.length} annonces de démo supprimées :`);
    deleted.forEach(r => console.log(`  #${r.id} — ${r.title}`));
  }
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
