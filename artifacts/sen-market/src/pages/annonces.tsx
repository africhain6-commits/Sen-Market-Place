import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetListings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Clock, Home as HomeIcon, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const CATEGORIES = ["Immobilier", "Véhicules", "Emplois", "Services", "Électronique", "Maison & Jardin"];
const CITIES = ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Kaolack", "Mbour", "Touba", "Diourbel", "Louga", "Tambacounda"];

export default function Annonces() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");

  const [activeFilters, setActiveFilters] = useState({
    search, category, city, minPrice, maxPrice
  });

  const { data: listingsPage, isLoading } = useGetListings({
    search: activeFilters.search || undefined,
    category: activeFilters.category || undefined,
    city: activeFilters.city || undefined,
    minPrice: activeFilters.minPrice ? Number(activeFilters.minPrice) : undefined,
    maxPrice: activeFilters.maxPrice ? Number(activeFilters.maxPrice) : undefined,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFilters({
      search, category, city, minPrice, maxPrice
    });
  };

  const formatPrice = (price?: number | null) => {
    if (price == null) return "Prix sur demande";
    return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF" }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          <div className="bg-card border rounded-lg p-4 sticky top-24">
            <h2 className="font-semibold text-lg mb-4">Filtres</h2>
            
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Ex: iPhone 13..." 
                    className="pl-8" 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    data-testid="filter-search"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Catégorie</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger data-testid="filter-category">
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ville</label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger data-testid="filter-city">
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les villes</SelectItem>
                    {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Prix (XOF)</label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    placeholder="Min" 
                    value={minPrice} 
                    onChange={e => setMinPrice(e.target.value)}
                    data-testid="filter-min-price"
                  />
                  <span>-</span>
                  <Input 
                    type="number" 
                    placeholder="Max" 
                    value={maxPrice} 
                    onChange={e => setMaxPrice(e.target.value)}
                    data-testid="filter-max-price"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" data-testid="button-apply-filters">Appliquer les filtres</Button>
              
              {(activeFilters.search || activeFilters.category !== "all" && activeFilters.category || activeFilters.city !== "all" && activeFilters.city || activeFilters.minPrice || activeFilters.maxPrice) && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full text-muted-foreground"
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                    setCity("all");
                    setMinPrice("");
                    setMaxPrice("");
                    setActiveFilters({ search: "", category: "", city: "", minPrice: "", maxPrice: "" });
                  }}
                  data-testid="button-clear-filters"
                >
                  Effacer
                </Button>
              )}
            </form>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold">
              {listingsPage?.total != null ? `${listingsPage.total} annonce${listingsPage.total !== 1 ? 's' : ''}` : "Annonces"}
            </h1>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-5 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : listingsPage?.listings.length === 0 ? (
            <div className="text-center py-20 border rounded-lg bg-card">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Aucune annonce trouvée</h3>
              <p className="text-muted-foreground mb-6">Essayez de modifier vos filtres de recherche.</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setCity("all");
                  setMinPrice("");
                  setMaxPrice("");
                  setActiveFilters({ search: "", category: "", city: "", minPrice: "", maxPrice: "" });
                }}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listingsPage?.listings.map(listing => (
                <Link key={listing.id} href={`/annonces/${listing.id}`} data-testid={`link-listing-${listing.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col group">
                    <div className="relative h-48 bg-muted overflow-hidden">
                      {listing.photos && listing.photos.length > 0 ? (
                        <img 
                          src={listing.photos[0]} 
                          alt={listing.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground">
                          <HomeIcon className="w-12 h-12 opacity-20" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium border">
                        {listing.category}
                      </div>
                      {(listing as any).isBoosted && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#D4AF37] text-[#0A2463] px-2 py-1 rounded text-xs font-bold shadow">
                          <Zap className="w-3 h-3" />
                          VEDETTE
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <div className="font-bold text-lg text-primary mb-2">
                        {formatPrice(listing.price)}
                      </div>
                      <h3 className="font-medium text-foreground mb-1 line-clamp-2">{listing.title}</h3>
                      <div className="flex flex-col gap-2 mt-auto pt-4 text-xs text-muted-foreground">
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
          )}
        </div>
      </div>
    </div>
  );
}