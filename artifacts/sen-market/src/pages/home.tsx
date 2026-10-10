import { useGetFeaturedListings, useGetListingStats } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { StoriesBar } from "@/components/stories-bar";
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
  Building2,
  PawPrint,
} from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { formatFcfa } from "@/lib/format";

// Photo de couverture de l'accueil (fichier à mettre dans le dossier public/).
// Mettre "" pour revenir au fond bleu uni.
const HERO_IMAGE = "/couverture.jpg";

const SUB_LIMIT = 6;

// Section « Découvrir le Sénégal » (photos dans public/senegal/)
const DESTINATIONS = [
  { name: "Dakar", subtitle: "Monument de la Renaissance africaine", image: "/senegal/dakar.jpg", search: "Dakar" },
  { name: "Île de Gorée", subtitle: "Ruelles colorées et histoire", image: "/senegal/goree.jpg", search: "Gorée" },
  { name: "Saint-Louis", subtitle: "Ville coloniale et pirogues", image: "/senegal/saint-louis.jpg", search: "Saint-Louis" },
  { name: "Saly", subtitle: "Plages et palmiers", image: "/senegal/saly.jpg", search: "Saly" },
  { name: "Casamance", subtitle: "Mangroves et nature", image: "/senegal/casamance.jpg", search: "Casamance" },
  { name: "Réserve de Bandia", subtitle: "Safari et baobabs", image: "/senegal/bandia.jpg", search: "Bandia" },
];

const SEARCH_CATEGORIES = [
  { label: "Tout", value: "" },
  { label: "Immobilier", value: "Immobilier" },
  { label: "Véhicules", value: "Véhicules" },
  { label: "Emplois", value: "Emplois" },
  { label: "Électronique", value: "Électronique" },
  { label: "Services", value: "Services" },
  { label: "Boutiques", value: "" , href: "/boutiques" },
];

type Sub = string | { label: string; href?: string; search?: string };

const subLabel = (s: Sub) => (typeof s === "string" ? s : s.label);
const subHref = (catHref: string, s: Sub) => {
  if (typeof s !== "string" && s.href) return s.href;
  const term = typeof s === "string" ? s : s.search ?? s.label;
  return `${catHref}${catHref.includes("?") ? "&" : "?"}search=${encodeURIComponent(term)}`;
};

const categories: {
  id: string;
  short: string;
  icon: typeof HomeIcon;
  color: string;
  href: string;
  subs: Sub[];
}[] = [
  {
    id: "Immobilier", short: "Immobilier", icon: HomeIcon,
    color: "bg-blue-100 text-blue-600",
    href: "/annonces?category=Immobilier",
    subs: [
      { label: "Nouveaux projets", href: "/projets" },
      "Appartements",
      "Studios",
      { label: "1 chambre", search: "1 chambre" },
      { label: "2 chambres", search: "2 chambres" },
      { label: "3 chambres et plus", search: "3 chambres" },
      "Villas",
      "Maisons",
      "Terrains",
      { label: "Bureaux & commerces", search: "bureau" },
      "Colocation",
      "Location",
      "Vente",
    ],
  },
  {
    id: "Véhicules", short: "Véhicules", icon: Car,
    color: "bg-red-100 text-red-600",
    href: "/annonces?category=Véhicules",
    subs: [
      "Voitures",
      { label: "Voitures d'occasion", search: "occasion" },
      { label: "Voitures neuves", search: "neuve" },
      "Motos",
      "Camions",
      "Pièces détachées",
      { label: "Location de voitures", search: "location" },
    ],
  },
  {
    id: "Emplois", short: "Emplois", icon: Briefcase,
    color: "bg-green-100 text-green-600",
    href: "/annonces?category=Emplois",
    subs: [
      { label: "Offres d'emploi", search: "recrute" },
      { label: "Recherche d'emploi - CV", search: "CV" },
      "Temps plein",
      "Freelance",
      "Stage",
      "Petits boulots",
    ],
  },
  {
    id: "Électronique", short: "Électronique", icon: Smartphone,
    color: "bg-amber-100 text-amber-600",
    href: "/annonces?category=Électronique",
    subs: [
      { label: "Téléphones & tablettes", search: "téléphone" },
      "Ordinateurs",
      { label: "TV & vidéo", search: "TV" },
      { label: "Consoles & jeux vidéo", search: "console" },
      { label: "Audio & musique", search: "audio" },
      { label: "Écouteurs & casques", search: "écouteurs" },
      { label: "Caméras & appareils photo", search: "caméra" },
      { label: "Sécurité & surveillance", search: "surveillance" },
      { label: "Réseau", search: "routeur" },
      { label: "Imprimantes & scanners", search: "imprimante" },
      { label: "Écrans d'ordinateur", search: "écran" },
      { label: "Composants informatiques", search: "composant" },
      "Accessoires",
      "Logiciels",
    ],
  },
  {
    id: "Services", short: "Services", icon: Wrench,
    color: "bg-purple-100 text-purple-600",
    href: "/annonces?category=Services",
    subs: [
      { label: "Construction & métiers", search: "construction" },
      { label: "Services auto", search: "auto" },
      { label: "Services informatiques", search: "informatique" },
      { label: "Réparation", search: "réparation" },
      { label: "Nettoyage", search: "nettoyage" },
      { label: "Impression", search: "impression" },
      { label: "Logistique & livraison", search: "livraison" },
      { label: "Juridique", search: "juridique" },
      { label: "Fiscalité & finance", search: "fiscalité" },
      { label: "Recrutement", search: "recrutement" },
      { label: "Location", search: "location" },
      { label: "Chauffeur & transfert aéroport", search: "chauffeur" },
      { label: "Voyages & circuits", search: "voyage" },
      { label: "Cours & classes", search: "cours" },
      { label: "Garde d'enfants", search: "garde" },
      { label: "Santé & beauté", search: "beauté" },
    ],
  },
  {
    id: "Maison & Jardin", short: "Maison", icon: Trees,
    color: "bg-emerald-100 text-emerald-600",
    href: "/annonces?category=Maison%20%26%20Jardin",
    subs: [
      "Meubles",
      "Électroménager",
      "Décoration",
      "Jardinage",
      { label: "Réparation & construction", search: "construction" },
      { label: "Équipement & outils pro", search: "outils" },
    ],
  },
  {
    id: "Boutiques & Couturiers", short: "Boutiques", icon: Scissors,
    color: "bg-pink-100 text-pink-600",
    href: "/boutiques",
    subs: [
      "Mode femme",
      "Mode homme",
      "Couture sur mesure",
      "Tissus & Bazin",
      { label: "Beauté & soins personnels", search: "beauté" },
      { label: "Bébés & enfants", search: "bébé" },
    ],
  },
  {
    id: "Animaux & Compagnie", short: "Animaux", icon: PawPrint,
    color: "bg-orange-100 text-orange-600",
    href: "/annonces?category=Animaux%20%26%20Compagnie",
    subs: [
      { label: "Chiens & chiots", search: "chien" },
      { label: "Chats & chatons", search: "chat" },
      "Oiseaux",
      "Poissons",
      { label: "Autres animaux", search: "animal" },
      { label: "Accessoires pour animaux", search: "accessoires" },
      { label: "Services animaliers", search: "vétérinaire" },
    ],
  },
];

// Rangée du téléphone : « Projets » juste après Immobilier
const PROJECT_CHIP = {
  id: "Projets",
  short: "Projets",
  icon: Building2,
  color: "bg-sky-100 text-sky-600",
  href: "/projets",
};
const chips = [categories[0], PROJECT_CHIP, ...categories.slice(1)];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

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
    return formatFcfa(price);
  };

  const totalListings = stats?.reduce((acc, s) => acc + s.count, 0) ?? 0;

  return (
    <div className="flex flex-col min-h-screen">

      {/* Bandeau de confiance */}
      <div className="bg-[#D4AF37]/15 border-b border-[#D4AF37]/30 py-2 px-4 text-center text-sm text-[#0A2463] font-medium flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
        <span>
          Plateforme 100% sécurisée — Vos transactions sont protégées.
          {!isAuthenticated && (
            <>
              {" "}
              <Link href="/inscription" className="underline font-bold hover:text-primary">Créez un compte gratuit</Link>
              <span className="hidden sm:inline"> pour publier vos annonces.</span>
            </>
          )}
        </span>
      </div>

      {/* Recherche */}
      <section
        className="bg-primary text-primary-foreground py-8 md:py-20 bg-cover bg-center"
        style={
          HERO_IMAGE
            ? {
                backgroundImage: `linear-gradient(rgba(10,36,99,0.78), rgba(10,36,99,0.62)), url('${HERO_IMAGE}')`,
              }
            : undefined
        }
      >
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold mb-2 md:mb-4 tracking-tight">
            Trouvez ce que vous cherchez au Sénégal
          </h1>
          <p className="text-sm md:text-xl text-primary-foreground/80 mb-5 md:mb-8 max-w-2xl mx-auto">
            La place de marché en ligne la plus simple et sécurisée pour acheter et vendre.
          </p>

          {/* Search Box */}
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Onglets de catégories */}
            <div className="flex overflow-x-auto border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              <div className="relative flex-1 min-w-0">
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
                className="h-14 px-5 sm:px-8 rounded-none rounded-br-2xl text-base font-bold bg-[#D4AF37] text-[#0A2463] hover:bg-[#c9a430] border-0 shrink-0"
                data-testid="button-search-home"
              >
                Rechercher
              </Button>
            </form>
          </div>

          {/* Chiffres clés (ordinateur seulement) */}
          <div className="hidden md:flex items-center justify-center gap-6 mt-6 text-primary-foreground/70 text-sm">
            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-[#D4AF37]" /> {totalListings}+ annonces actives</span>
            <span className="flex items-center gap-1"><Users className="w-4 h-4 text-[#D4AF37]" /> Gratuit pour tous</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-[#D4AF37]" /> 100% sécurisé</span>
          </div>
        </div>
      </section>

      {/* Stories des professionnels */}
      <div className="container mx-auto px-4 pt-4 empty:hidden">
        <StoriesBar />
      </div>

      {/* Catégories en une ligne (téléphone seulement) */}
      <section className="md:hidden border-b bg-background py-3">
        <div className="flex gap-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-testid="category-chips">
          {chips.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.id} href={cat.href} className="flex flex-col items-center gap-1.5 w-[68px] shrink-0">
                <span className={`p-3 rounded-full ${cat.color}`}>
                  <Icon className="w-6 h-6" />
                </span>
                <span className="text-[11px] font-medium text-foreground text-center leading-tight">{cat.short}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Annonces récentes */}
      <section className="pt-5 pb-8 md:pt-8 md:pb-12 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-4 md:mb-6">
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
                      <div className="font-bold text-sm sm:text-base text-primary mb-1 break-words">{formatPrice(listing.price)}</div>
                      <h3 className="text-sm font-medium text-foreground line-clamp-1">{listing.title}</h3>
                      <div className="flex flex-wrap items-center text-xs text-muted-foreground gap-x-2 gap-y-1 mt-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{listing.city}</span>
                        </div>
                        <div className="flex items-center gap-1">
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

      {/* Découvrir le Sénégal */}
      <section className="py-10 border-t bg-background" data-testid="home-destinations">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold text-foreground">Découvrir le Sénégal</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            Explorez les annonces près des plus beaux endroits du pays.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {DESTINATIONS.map((d) => (
              <Link
                key={d.name}
                href={`/annonces?search=${encodeURIComponent(d.search)}`}
                className="group relative block aspect-[3/2] overflow-hidden rounded-xl bg-muted"
              >
                <img
                  src={d.image}
                  alt={d.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-white">
                  <h3 className="font-bold text-sm md:text-lg leading-tight">{d.name}</h3>
                  <p className="text-[11px] md:text-sm text-white/80 line-clamp-1">{d.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Catégories détaillées avec sous-catégories */}
      <section className="py-10 border-t bg-background" data-testid="home-categories">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold mb-6 text-foreground">Catégories populaires</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const stat = stats?.find((s) => s.category === cat.id);
              const open = expanded.includes(cat.id);
              const visible = open ? cat.subs : cat.subs.slice(0, SUB_LIMIT);
              return (
                <div key={cat.id} className="border rounded-lg p-4 hover:border-primary/40 hover:shadow-sm transition-all bg-card group">
                  <Link href={cat.href}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${cat.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm group-hover:text-primary transition-colors">{cat.id}</h3>
                        {stat && <p className="text-xs text-muted-foreground">{stat.count} {stat.count > 1 ? "annonces" : "annonce"}</p>}
                      </div>
                    </div>
                  </Link>
                  <ul className="space-y-1">
                    {visible.map((sub) => (
                      <li key={subLabel(sub)}>
                        <Link
                          href={subHref(cat.href, sub)}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <ArrowRight className="w-3 h-3" /> {subLabel(sub)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {cat.subs.length > SUB_LIMIT && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((prev) => (open ? prev.filter((x) => x !== cat.id) : [...prev, cat.id]))
                      }
                      className="text-xs text-muted-foreground hover:text-primary mt-2 block"
                    >
                      {open ? "Voir moins" : `Voir plus (+${cat.subs.length - SUB_LIMIT})`}
                    </button>
                  )}
                  <Link href={cat.href} className="text-xs font-semibold text-primary hover:underline mt-3 inline-block">
                    Tout voir →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Appel à publier */}
      <section className="bg-primary py-14">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Vous avez quelque chose à vendre ?</h2>
          <p className="text-white/75 mb-8 max-w-2xl mx-auto">
            Publiez votre annonce gratuitement et touchez des milliers d'acheteurs potentiels à travers le Sénégal.
          </p>
          <Link href="/publier">
            <Button size="lg" className="max-w-full h-auto min-h-14 py-3 px-6 sm:px-8 text-base sm:text-lg whitespace-normal text-center bg-[#D4AF37] text-[#0A2463] hover:bg-[#c9a430] border-0 font-bold" data-testid="button-cta-publish">
              Publier une annonce gratuitement
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
