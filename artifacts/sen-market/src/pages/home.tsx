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
