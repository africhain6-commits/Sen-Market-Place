import { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Link } from "wouter";
import { ScrollToTop } from "./scroll-to-top";
import { MobileBottomNav } from "./mobile-bottom-nav";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <ScrollToTop />
      <MobileBottomNav />
      <main className="flex-1 w-full">
        {children}
      </main>
      <footer className="border-t bg-muted/40 py-8 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div>
              <h3 className="font-semibold text-lg mb-4 text-primary">SenMarket</h3>
              <p className="text-muted-foreground mb-4 max-w-xs">
                La place de marché en ligne de référence au Sénégal. Achetez, vendez et trouvez des opportunités locales simplement et en toute confiance.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Liens rapides</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/" className="hover:text-primary transition-colors">Accueil</Link></li>
                <li><Link href="/annonces" className="hover:text-primary transition-colors">Toutes les annonces</Link></li>
                <li><Link href="/publier" className="hover:text-primary transition-colors">Publier une annonce</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Aide & Contact</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/connexion" className="hover:text-primary transition-colors">Se connecter</Link></li>
                <li><Link href="/inscription" className="hover:text-primary transition-colors">S'inscrire</Link></li>
                <li><a href="mailto:africhain6@gmail.com" className="hover:text-primary transition-colors">africhain6@gmail.com</a></li>
                <li><a href="tel:+221773579701" className="hover:text-primary transition-colors">+221 77 357 97 01</a></li>
                <li><a href="https://wa.me/221773579701" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">WhatsApp : +221 77 357 97 01</a></li>
                <li className="text-muted-foreground">Ngor Almadies, Dakar, Sénégal</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground text-xs">
            <p>&copy; {new Date().getFullYear()} Sen Market. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
