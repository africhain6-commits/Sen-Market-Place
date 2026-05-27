import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetListings } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Scissors, ShoppingBag, Star, ArrowRight, PlusCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const BOUTIQUE_TYPES = [
  {
    title: "Boutiques de Mode",
    description: "Vêtements, chaussures, accessoires et prêt-à-porter",
    icon: ShoppingBag,
    color: "bg-pink-100 text-pink-600",
    query: "boutique mode",
  },
  {
    title: "Couturiers & Tailleurs",
    description: "Création sur mesure, retouches, tenues traditionnelles",
    icon: Scissors,
    color: "bg-purple-100 text-purple-600",
    query: "couturier tailleur",
  },
  {
    title: "Tissus & Bazin",
    description: "Wax, bazin riche, soie, tissu Pagne et traditionnel",
    icon: Star,
    color: "bg-amber-100 text-amber-600",
    query: "tissu bazin wax",
  },
];

export default function Boutiques() {
  const [, setLocation] = useLocation();

  const { data: listings, isLoading } = useGetListings({
    category: "Services",
    limit: 8,
  });

  const formatPrice = (price?: number | null) => {
    if (price == null) return "Prix sur demande";
    return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF" }).format(price);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section
        className="relative py-20 md:py-32 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0A2463 0%, #1a3a80 60%, #2a4a90 100%)" }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-[#D4AF37]" />
          <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-[#D4AF37]" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="flex justify-center gap-1 mb-6">
            <div className="w-3 h-12 rounded bg-[#00853F]" />
            <div className="w-3 h-12 rounded bg-[#FDEF42]" />
            <div className="w-3 h-12 rounded bg-[#E31B23]" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            Boutiques &amp; Couturiers
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Découvrez les meilleurs artisans et boutiques de mode du Sénégal. Tenues traditionnelles, prêt-à-porter, créations sur mesure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="h-14 px-8 text-base bg-[#D4AF37] text-[#0A2463] hover:bg-[#c9a430] border-0 font-bold"
              onClick={() => setLocation("/publier")}
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Référencer ma boutique
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base text-white border-white/50 hover:bg-white/10 hover:text-white"
              onClick={() => setLocation("/annonces?category=Services")}
            >
              Voir tous les services
            </Button>
          </div>
        </div>
      </section>

      {/* Types de services */}
      <section className="py-14 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Nos catégories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BOUTIQUE_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <Card
                  key={type.title}
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setLocation(`/annonces?category=Services&search=${encodeURIComponent(type.query)}`)}
                >
                  <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                    <div className={`p-4 rounded-full ${type.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{type.title}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1 text-primary">
                      Parcourir <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Annonces récentes */}
      <section className="py-14">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Annonces récentes — Services</h2>
            <Link href="/annonces?category=Services">
              <Button variant="ghost" className="gap-2 group hidden sm:flex">
                Voir tout <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : listings && listings.listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {listings.listings.slice(0, 8).map((listing) => (
                <Link key={listing.id} href={`/annonces/${listing.id}`}>
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
                          <ShoppingBag className="w-12 h-12 opacity-20" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 flex-1">
                      <div className="font-bold text-lg text-primary mb-1">{formatPrice(listing.price)}</div>
                      <h3 className="font-medium text-foreground line-clamp-1">{listing.title}</h3>
                      <div className="flex items-center text-xs text-muted-foreground gap-3 mt-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{listing.city}</span>
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
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground mb-4">Aucune annonce pour le moment dans cette section.</p>
              <Button onClick={() => setLocation("/publier")} className="bg-[#D4AF37] text-[#0A2463] hover:bg-[#c9a430] border-0">
                Publier la première annonce
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA rejoindre */}
      <section className="bg-primary/5 border-y py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Vous êtes couturier ou commerçant ?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Référencez votre boutique ou vos services gratuitement sur SenMarket et touchez des milliers de clients à travers le Sénégal.
          </p>
          <Link href="/publier">
            <Button size="lg" className="px-8 text-lg h-14 bg-[#D4AF37] text-[#0A2463] hover:bg-[#c9a430] border-0">
              <PlusCircle className="w-5 h-5 mr-2" />
              Référencer ma boutique gratuitement
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
