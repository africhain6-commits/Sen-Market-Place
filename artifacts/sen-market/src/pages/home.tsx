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
// Chaque carte ouvre la page /region/<slug>
const DESTINATIONS = [
  { slug: "dakar", name: "Dakar", subtitle: "Monument de la Renaissance africaine", image: "/senegal/dakar.jpg" },
  { slug: "goree", name: "Île de Gorée", subtitle: "Ruelles colorées et histoire", image: "/senegal/goree.jpg" },
  { slug: "saint-louis", name: "Saint-Louis", subtitle: "Ville coloniale et pirogues", image: "/senegal/saint-louis.jpg" },
  { slug: "saly", name: "Saly", subtitle: "Plages et palmiers", image: "/senegal/saly.jpg" },
  { slug: "casamance", name: "Casamance", subtitle: "Mangroves et nature", image: "/senegal/casamance.jpg" },
  { slug: "bandia", name: "Réserve de Bandia", subtitle: "Safari et baobabs", image: "/senegal/bandia.jpg" },
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
