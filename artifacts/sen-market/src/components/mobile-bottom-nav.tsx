import { Link, useLocation } from "wouter";
import { Home, Search, PlusCircle, LayoutDashboard, Menu, Download, MapPin, GitCompare, Building2, Smartphone, X, Bell } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function MobileBottomNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const { canInstall, isInstalled, install } = usePwaInstall();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/" ? location === "/" : location.startsWith(path);

  return (
    <>
      {/* Bottom nav bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg safe-area-bottom">
        <div className="grid grid-cols-5 h-16">
          <Link href="/" onClick={() => setMenuOpen(false)}>
            <button className={`flex flex-col items-center justify-center h-full w-full gap-0.5 transition-colors ${isActive("/") ? "text-primary" : "text-gray-500"}`}>
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-medium">Accueil</span>
            </button>
          </Link>

          <Link href="/annonces" onClick={() => setMenuOpen(false)}>
            <button className={`flex flex-col items-center justify-center h-full w-full gap-0.5 transition-colors ${isActive("/annonces") ? "text-primary" : "text-gray-500"}`}>
              <Search className="w-5 h-5" />
              <span className="text-[10px] font-medium">Annonces</span>
            </button>
          </Link>

          {/* Center publish button */}
          <Link href="/publier" onClick={() => setMenuOpen(false)}>
            <button className="flex flex-col items-center justify-center h-full w-full gap-0.5">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37] flex items-center justify-center -mt-4 shadow-lg border-4 border-white">
                <PlusCircle className="w-6 h-6 text-[#0A2463]" />
              </div>
              <span className="text-[10px] font-medium text-[#D4AF37]">Publier</span>
            </button>
          </Link>

          <Link href={isAuthenticated ? "/tableau-de-bord" : "/connexion"} onClick={() => setMenuOpen(false)}>
            <button className={`flex flex-col items-center justify-center h-full w-full gap-0.5 transition-colors ${isActive("/tableau-de-bord") ? "text-primary" : "text-gray-500"}`}>
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] font-medium">Mon espace</span>
            </button>
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex flex-col items-center justify-center h-full w-full gap-0.5 transition-colors ${menuOpen ? "text-primary" : "text-gray-500"}`}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </nav>

      {/* Slide-up menu */}
      {menuOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-white rounded-t-2xl shadow-2xl border-t border-gray-100 p-4 pb-2 animate-in slide-in-from-bottom">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

            {/* Install button — always shown if not already installed */}
            {!isInstalled && (
              <button
                onClick={async () => { await install(); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 mb-3 rounded-xl bg-[#0A2463] text-white font-semibold"
              >
                <div className="w-9 h-9 rounded-lg bg-[#D4AF37] flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-[#0A2463]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Installer SenMarket</p>
                  <p className="text-xs text-white/70">Accès rapide depuis votre écran d'accueil</p>
                </div>
                <Download className="w-4 h-4 ml-auto shrink-0" />
              </button>
            )}

            <div className="grid grid-cols-3 gap-2 mb-3">
              <Link href="/carte" onClick={() => setMenuOpen(false)}>
                <button className={`flex flex-col items-center gap-2 p-3 rounded-xl w-full border transition-colors ${isActive("/carte") ? "bg-primary/10 border-primary/20 text-primary" : "bg-gray-50 border-gray-100 text-gray-700"}`}>
                  <MapPin className="w-5 h-5" />
                  <span className="text-xs font-medium">Carte</span>
                </button>
              </Link>
              <Link href="/quartiers" onClick={() => setMenuOpen(false)}>
                <button className={`flex flex-col items-center gap-2 p-3 rounded-xl w-full border transition-colors ${isActive("/quartiers") ? "bg-primary/10 border-primary/20 text-primary" : "bg-gray-50 border-gray-100 text-gray-700"}`}>
                  <Building2 className="w-5 h-5" />
                  <span className="text-xs font-medium">Quartiers</span>
                </button>
              </Link>
              <Link href="/comparer" onClick={() => setMenuOpen(false)}>
                <button className={`flex flex-col items-center gap-2 p-3 rounded-xl w-full border transition-colors ${isActive("/comparer") ? "bg-primary/10 border-primary/20 text-primary" : "bg-gray-50 border-gray-100 text-gray-700"}`}>
                  <GitCompare className="w-5 h-5" />
                  <span className="text-xs font-medium">Comparer</span>
                </button>
              </Link>
            </div>

            <div className="space-y-1">
              <Link href="/boutiques" onClick={() => setMenuOpen(false)}>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors">
                  Boutiques & Couturiers
                </button>
              </Link>
              <Link href="/publicite" onClick={() => setMenuOpen(false)}>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors">
                  Publicité
                </button>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Spacer so content doesn't hide behind bottom nav */}
      <div className="md:hidden h-16" />
    </>
  );
}
