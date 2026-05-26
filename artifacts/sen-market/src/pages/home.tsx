import { useGetFeaturedListings, useGetListingStats } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Home as HomeIcon, 
  Car, 
  Briefcase, 
  Wrench, 
  Smartphone, 
  Trees, 
  Search,
  MapPin,
  Clock,
  ArrowRight,
  Scissors,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const SEARCH_CATEGORIES = [
  { label: "Tout", value: "" },
  { label: "Immobilier", value: "Immobilier" },
  { label: "Véhicules", value: "Véhicules" },
  { label: "Emplois", value: "Emplois" },
  { label: "Électronique", value: "Électronique" },
  { label: "Services", value: "Services" },
  { label: "Boutiques", value: "" , href: "/boutiques" },
];

const categories = [
  {
    id: "Immobilier", icon: HomeIcon,
    color: "bg-blue-100 text-blue-600",
    href: "/annonces?category=Immobilier",
    subs: ["Appartements", "Maisons", "Terrains", "Bureaux"],
  },
  {
    id: "Véhicules", icon: Car,
    color: "bg-red-100 text-red-600",
    href: "/annonces?category=Véhicules",
    subs: ["Voitures", "Motos", "Camions", "Pièces détachées"],
  },
  {
    id: "Emplois", icon: Briefcase,
    color: "bg-green-100 text-green-600",
    href: "/annonces?category=Emplois",
    subs: ["Temps plein", "Freelance", "Stage", "Petits boulots"],
  },
  {
    id: "Électronique", icon: Smartphone,
    color: "bg-amber-100 text-amber-600",
    href: "/annonces?category=Électronique",
    subs: ["Téléphones", "Ordinateurs", "TV & Audio", "Accessoires"],
  },
  {
    id: "Services", icon: Wrench,
    color: "bg-purple-100 text-purple-600",
    href: "/annonces?category=Services",
    subs: ["Plomberie", "Électricité", "Ménage", "Transport"],
  },
  {
    id: "Maison & Jardin", icon: Trees,
    color: "bg-emerald-100 text-emerald-600",
    href: "/annonces?category=Maison%20%26%20Jardin",
    subs: ["Meubles", "Électroménager", "Décoration", "Jardinage"],
  },
  {
    id: "Boutiques & Couturiers", icon: Scissors,
    color: "bg-pink-100 text-pink-600",
    href: "/boutiques",
    subs: ["Mode femme", "Mode homme", "Couture sur mesure", "Tissus & Bazin"],
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [, setLocation] = useLocation();

  const { data: featuredListings, isLoading: isLoadingFeatured } = useGetFeaturedListings();
  const { data: stats } = useGetListingStats();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery);
    if (activeCategory) params.set("category", activeCategory);
    setLocation(`/annonces${params.toString() ? `?${params}` : ""}`);
  };

  const formatPrice = (price?: number | null) => {
    if (price == null) return "Prix sur demande";
    return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF" }).format(price);
  };

  const totalListings = stats?.reduce((acc, s) => acc + s.count, 0) ?? 0;

  return (
    <div className="flex flex-col min-h-screen">

      {/* Trust Banner — Dubizzle-inspired */}
      <div className="bg-[#D4AF37]/15 border-b border-[#D4AF37]/30 py-2 px-4 text-center text-sm text-[#0A2463] font-medium flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
        <span>Plateforme 100% sécurisée — Vos transactions sont protégées. <Link href="/inscription" className="underline font-bold hover:text-primary">Créez un compte gratuit</Link> pour publier vos annonces.</span>
      </div>

      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-14 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
            Trouvez ce que vous cherchez au Sénégal
          </h1>
          <p className="text-base md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            La place de marché en ligne la plus simple et sécurisée pour acheter et vendre.
          </p>

          {/* Search Box */}
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Category tabs — Dubizzle-inspired */}
            <div className="flex overflow-x-auto border-b scrollbar-none">
              {SEARCH_CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => {
                    if (cat.href) { setLocation(cat.href); return; }
                    setActiveCategory(cat.value);
                  }}
                  className={`shrink-0 px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
                    activeCategory === cat.value && !cat.href
                      ? "border-[#D4AF37] text-[#0A2463]"
                      : "border-transparent text-gray-500 hover:text-[#0A2463]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search input */}
            <form onSubmit={handleSearch} className="flex gap-0">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder={activeCategory ? `Rechercher dans ${activeCategory}...` : "Que recherchez-vous ?"}
                  className="h-14 pl-12 text-base border-0 rounded-none focus-visible:ring-0 text-gray-800 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-home"
                />
              </div>
              <Button
                type="submit"
                className="h-14 px-8 rounded-none rounded-br-2xl text-base font-bold bg-[#D4AF37] text-[#0A2463] hover:bg-[#c9a430] border-0 shrink-0"
                data-testid="button-search-home"
              >
                Rechercher
              </Button>
            </form>
          </div>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-6 mt-6 text-primary-foreground/70 text-sm">
            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-[#D4AF37]" /> {totalListings}+ annonces actives</span>
            <span className="flex items-center gap-1"><Users className="w-4 h-4 text-[#D4AF37]" /> Gratuit pour tous</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-[#D4AF37]" /> 100% sécurisé</span>
          </div>
        </div>
      </section>

      {/* Categories — Dubizzle-style with subcategories */}
      <section className="py-10 border-b bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold mb-6 text-foreground">Catégories populaires</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const stat = stats?.find(s => s.category === cat.id);
              return (
                <div key={cat.id} className="border rounded-lg p-4 hover:border-primary/40 hover:shadow-sm transition-all bg-card group">
                  <Link href={cat.href}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${cat.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm group-hover:text-primary transition-colors">{cat.id}</h3>
                        {stat && <p className="text-xs text-muted-foreground">{stat.count} annonces</p>}
                      </div>
                    </div>
                  </Link>
                  <ul className="space-y-1">
                    {cat.subs.map((sub) => (
                      <li key={sub}>
                        <Link
                          href={`${cat.href}&search=${encodeURIComponent(sub)}`}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <ArrowRight className="w-3 h-3" /> {sub}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link href={cat.href} className="text-xs font-semibold text-primary hover:underline mt-3 inline-block">
                    Tout voir →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-12 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Annonces récentes</h2>
            <Link href="/annonces">
              <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 group" data-testid="link-view-all">
                Voir tout <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {isLoadingFeatured ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-44 w-full" />
                  <CardContent className="p-3">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredListings && featuredListings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredListings.slice(0, 8).map((listing) => (
                <Link key={listing.id} href={`/annonces/${listing.id}`} data-testid={`link-listing-${listing.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col group border">
                    <div className="relative h-44 bg-muted overflow-hidden">
                      {listing.photos && listing.photos.length > 0 ? (
                        <img
                          src={listing.photos[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground">
                          <HomeIcon className="w-10 h-10 opacity-20" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-medium border">
                        {listing.category}
                      </div>
                    </div>
                    <CardContent className="p-3 flex-1">
                      <div className="font-bold text-base text-primary mb-1">{formatPrice(listing.price)}</div>
                      <h3 className="text-sm font-medium text-foreground line-clamp-1">{listing.title}</h3>
                      <div className="flex items-center text-xs text-muted-foreground gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{listing.city}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>{formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true, locale: fr })}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              <p className="text-muted-foreground">Aucune annonce récente pour le moment.</p>
            </div>
          )}

          <div className="mt-6 text-center sm:hidden">
            <Link href="/annonces">
              <Button variant="outline" className="w-full">Voir toutes les annonces</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-14">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Vous avez quelque chose à vendre ?</h2>
          <p className="text-white/75 mb-8 max-w-2xl mx-auto">
            Publiez votre annonce gratuitement et touchez des milliers d'acheteurs potentiels à travers le Sénégal.
          </p>
          <Link href="/publier">
            <Button size="lg" className="px-8 text-lg h-14 bg-[#D4AF37] text-[#0A2463] hover:bg-[#c9a430] border-0 font-bold" data-testid="button-cta-publish">
              Publier une annonce gratuitement
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
