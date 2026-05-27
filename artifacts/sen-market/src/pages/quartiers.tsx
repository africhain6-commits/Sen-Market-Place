import { useState } from "react";
import { Link } from "wouter";
import { useGetNeighborhoods, useGetListings } from "@workspace/api-client-react";
import { MapPin, TrendingUp, Home, Search, ArrowRight, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_COLORS: Record<string, string> = {
  "Immobilier": "bg-blue-100 text-blue-700",
  "Véhicules": "bg-orange-100 text-orange-700",
  "Emplois": "bg-green-100 text-green-700",
  "Services": "bg-purple-100 text-purple-700",
  "Électronique": "bg-cyan-100 text-cyan-700",
  "Maison & Jardin": "bg-amber-100 text-amber-700",
};

const NEIGHBORHOOD_IMAGES: Record<string, string> = {
  "plateau": "https://images.unsplash.com/photo-1590736969596-c4f61a8d8697?w=400&h=200&fit=crop",
  "almadies": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=200&fit=crop",
  "sacre-coeur": "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=200&fit=crop",
  "mermoz": "https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?w=400&h=200&fit=crop",
  "liberte": "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=200&fit=crop",
  "parcelles-assainies": "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=400&h=200&fit=crop",
  "grand-yoff": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop",
  "ouakam": "https://images.unsplash.com/photo-1520637836862-4d8946af05e2?w=400&h=200&fit=crop",
};

const NEIGHBORHOOD_DESCRIPTIONS: Record<string, string> = {
  "plateau": "Centre économique et administratif de Dakar, quartier historique avec bâtiments coloniaux.",
  "almadies": "Quartier résidentiel haut de gamme en bord de mer, plages, restaurants et hôtels de luxe.",
  "sacre-coeur": "Quartier calme et résidentiel très prisé des familles, bien desservi.",
  "mermoz": "Quartier résidentiel établi, proche de l'aéroport, idéal pour les expatriés.",
  "liberte": "Quartier central animé avec commerces, restaurants et bonne accessibilité.",
  "parcelles-assainies": "Grand quartier populaire en plein développement, nombreuses opportunités.",
  "grand-yoff": "Quartier très peuplé, dynamique, avec un marché animé et de nombreux services.",
  "ouakam": "Quartier en bord de mer, calme, avec la mosquée de la Divinité comme repère.",
  "ngor": "Village de pêcheurs authentique, atmosphère paisible, proche de l'île de Ngor.",
  "yoff": "Quartier côtier avec plages et village de pêcheurs, quartier Lébou historique.",
  "pikine": "Grande banlieue de Dakar, ville indépendante, très populaire et commerçante.",
  "guediawaye": "Banlieue dynamique avec marché actif, proche de Pikine.",
  "rufisque": "Ville historique à 25km de Dakar, patrimoine colonial, zone industrielle.",
  "mbao": "Zone résidentielle calme entre Dakar et Rufisque, en pleine croissance.",
  "thiaroye": "Banlieue ouvrière avec forte tradition de commerce et artisanat.",
  "medina": "Quartier populaire historique, marché animé, centre culturel de Dakar.",
  "fann": "Quartier résidentiel huppé proche de l'université, ambassades et ministères.",
  "point-e": "Quartier résidentiel tranquille, proche du Plateau, prisé par les diplomates.",
};

const formatPrice = (price?: number | null) => {
  if (price == null) return null;
  return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(price);
};

export default function Quartiers() {
  const [search, setSearch] = useState("");

  const { data: neighborhoods, isLoading } = useGetNeighborhoods();

  const filtered = (neighborhoods ?? []).filter((n: any) =>
    n.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalListings = (neighborhoods ?? []).reduce((s: number, n: any) => s + n.count, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#0A2463] to-[#1a3a7a] rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-center gap-3 mb-3">
          <Building2 className="w-8 h-8 text-[#D4AF37]" />
          <h1 className="text-3xl font-bold">Quartiers de Dakar</h1>
        </div>
        <p className="text-white/80 text-lg max-w-xl">
          Explorez les annonces par quartier. Trouvez le logement, le service ou le bien
          idéal dans votre zone préférée.
        </p>
        <div className="flex items-center gap-4 mt-4">
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <span className="text-[#D4AF37] font-bold text-xl">{totalListings}</span>
            <span className="text-white/70 text-sm ml-1">annonces à Dakar</span>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <span className="text-[#D4AF37] font-bold text-xl">{(neighborhoods ?? []).length}</span>
            <span className="text-white/70 text-sm ml-1">quartiers</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un quartier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((neighborhood: any) => (
            <Link
              key={neighborhood.slug}
              href={`/annonces?city=Dakar&search=${encodeURIComponent(neighborhood.name)}`}
            >
              <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer border hover:border-primary/30">
                {/* Image */}
                <div className="relative h-36 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                  {NEIGHBORHOOD_IMAGES[neighborhood.slug] ? (
                    <img
                      src={NEIGHBORHOOD_IMAGES[neighborhood.slug]}
                      alt={neighborhood.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-10 h-10 text-primary/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <h3 className="text-white font-bold text-lg leading-tight">{neighborhood.name}</h3>
                    <Badge className="bg-[#D4AF37] text-[#0A2463] font-semibold shrink-0">
                      {neighborhood.count} ann.
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground leading-snug mb-3 line-clamp-2">
                    {NEIGHBORHOOD_DESCRIPTIONS[neighborhood.slug] ?? "Quartier de Dakar avec nombreuses annonces disponibles."}
                  </p>

                  {neighborhood.avgPrice && (
                    <div className="flex items-center gap-1.5 mb-3 text-sm">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                      <span className="text-muted-foreground">Prix moyen :</span>
                      <span className="font-semibold text-primary">{formatPrice(neighborhood.avgPrice)}</span>
                    </div>
                  )}

                  {Object.keys(neighborhood.categories ?? {}).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(neighborhood.categories as Record<string, number>)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([cat, count]) => (
                          <Badge
                            key={cat}
                            variant="secondary"
                            className={`text-xs ${CATEGORY_COLORS[cat] ?? "bg-gray-100 text-gray-700"}`}
                          >
                            {cat} ({count})
                          </Badge>
                        ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center text-xs font-medium text-primary group-hover:gap-2 gap-1 transition-all">
                    Voir les annonces <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-16 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun quartier trouvé pour « {search} »</p>
        </div>
      )}
    </div>
  );
}
