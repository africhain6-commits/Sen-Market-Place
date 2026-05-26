import { useGetFeaturedListings, useGetListingStats } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
  ShoppingBag,
  TrendingUp
} from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const categories = [
  { id: "Immobilier", icon: HomeIcon, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400", href: "/annonces?category=Immobilier" },
  { id: "Véhicules", icon: Car, color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400", href: "/annonces?category=Véhicules" },
  { id: "Emplois", icon: Briefcase, color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400", href: "/annonces?category=Emplois" },
  { id: "Services", icon: Wrench, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400", href: "/annonces?category=Services" },
  { id: "Électronique", icon: Smartphone, color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400", href: "/annonces?category=Électronique" },
  { id: "Maison & Jardin", icon: Trees, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400", href: "/annonces?category=Maison%20%26%20Jardin" },
  { id: "Boutiques & Couturiers", icon: Scissors, color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400", href: "/boutiques" },
  { id: "Publicité", icon: TrendingUp, color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400", href: "/publicite" },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const { data: featuredListings, isLoading: isLoadingFeatured } = useGetFeaturedListings();
  const { data: stats } = useGetListingStats();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/annonces?search=${encodeURIComponent(searchQuery)}`);
    } else {
      setLocation('/annonces');
    }
  };

  const formatPrice = (price?: number | null) => {
    if (price == null) return "Prix sur demande";
    return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF" }).format(price);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            Trouvez ce que vous cherchez au Sénégal
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            La place de marché en ligne la plus simple et sécurisée pour acheter et vendre.
          </p>
          
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input 
                type="text" 
                placeholder="Que recherchez-vous ?" 
                className="h-14 pl-10 text-base bg-background text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-home"
              />
            </div>
            <Button type="submit" size="lg" className="h-14 px-8 text-base bg-accent text-accent-foreground hover:bg-accent/90" data-testid="button-search-home">
              Rechercher
            </Button>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Catégories Principales</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const stat = stats?.find(s => s.category === cat.id);
              
              return (
                <Link key={cat.id} href={cat.href} data-testid={`link-category-${cat.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer group h-full">
                    <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                      <div className={`p-3 rounded-full ${cat.color} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm md:text-base leading-tight">{cat.id}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stat ? `${stat.count} annonces` : ''}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-bold">Annonces Récentes</h2>
            <Link href="/annonces">
              <Button variant="ghost" className="hidden sm:flex gap-2 group" data-testid="link-view-all">
                Voir tout <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {isLoadingFeatured ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
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
          ) : featuredListings && featuredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredListings.slice(0, 8).map((listing) => (
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
                    </div>
                    <CardContent className="p-4 flex-1">
                      <div className="font-bold text-lg text-primary mb-2 line-clamp-2">
                        {formatPrice(listing.price)}
                      </div>
                      <h3 className="font-medium text-foreground mb-1 line-clamp-1">{listing.title}</h3>
                      <div className="flex items-center text-xs text-muted-foreground gap-3 mt-auto pt-4">
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
          
          <div className="mt-8 text-center sm:hidden">
            <Link href="/annonces">
              <Button variant="outline" className="w-full">
                Voir toutes les annonces
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 border-y py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Vous avez quelque chose à vendre ?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Publiez votre annonce gratuitement et touchez des milliers d'acheteurs potentiels à travers le Sénégal.
          </p>
          <Link href="/publier">
            <Button size="lg" className="px-8 text-lg h-14 bg-[#D4AF37] text-[#0A2463] hover:bg-[#c9a430] border-0" data-testid="button-cta-publish">
              Publier une annonce
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
