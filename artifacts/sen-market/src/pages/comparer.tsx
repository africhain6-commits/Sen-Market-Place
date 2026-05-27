import { useState } from "react";
import { useGetListings, useGetListing } from "@workspace/api-client-react";
import { X, Plus, ArrowRight, Star, MapPin, Clock, Check, Minus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const MAX_COMPARE = 3;

const formatPrice = (price?: number | null) => {
  if (price == null) return "Sur demande";
  return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(price);
};

function ListingSearchPanel({ onSelect, alreadySelected }: { onSelect: (id: number) => void; alreadySelected: number[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const { data: listingsData, isLoading } = useGetListings({
    search: search || undefined,
    category: category || undefined,
    limit: 12,
    page: 1,
  } as any);

  const listings = (listingsData as any)?.listings ?? [];

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une annonce à comparer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {listings.map((l: any) => {
            const isSelected = alreadySelected.includes(l.id);
            return (
              <button
                key={l.id}
                onClick={() => !isSelected && onSelect(l.id)}
                disabled={isSelected}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "border-primary/30 bg-primary/5 opacity-60 cursor-not-allowed"
                    : "border-border hover:border-primary/40 hover:bg-muted/50 cursor-pointer"
                }`}
              >
                {l.photos?.[0] ? (
                  <img src={l.photos[0]} alt={l.title} className="w-12 h-10 object-cover rounded shrink-0" />
                ) : (
                  <div className="w-12 h-10 bg-muted rounded shrink-0 flex items-center justify-center">
                    <Star className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{l.title}</p>
                  <p className="text-xs text-muted-foreground">{formatPrice(l.price)} · {l.city}</p>
                </div>
                {isSelected ? (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </button>
            );
          })}
          {listings.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">Aucune annonce trouvée</p>
          )}
        </div>
      )}
    </div>
  );
}

function CompareCard({ listingId, onRemove, isCheapest }: { listingId: number; onRemove: () => void; isCheapest: boolean }) {
  const { data: listing, isLoading } = useGetListing(listingId);

  if (isLoading) {
    return (
      <Card className="flex-1 min-w-0">
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!listing) return null;
  const l = listing as any;

  return (
    <Card className={`flex-1 min-w-0 relative ${isCheapest && l.price ? "ring-2 ring-green-400" : ""}`}>
      {isCheapest && l.price && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap z-10">
          Meilleur prix
        </div>
      )}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 z-10 bg-white/90 rounded-full p-1 shadow hover:bg-red-50 transition-colors"
      >
        <X className="w-3.5 h-3.5 text-gray-500" />
      </button>
      <CardContent className="p-0">
        {/* Photo */}
        <div className="h-36 bg-muted rounded-t-lg overflow-hidden">
          {l.photos?.[0] ? (
            <img src={l.photos[0]} alt={l.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Star className="w-8 h-8 opacity-30" />
            </div>
          )}
        </div>
        <div className="p-4 space-y-3">
          <div>
            <Link href={`/annonces/${l.id}`} className="font-semibold text-sm hover:text-primary leading-tight block line-clamp-2">
              {l.title}
            </Link>
          </div>

          {/* Price */}
          <div className={`text-xl font-bold ${isCheapest && l.price ? "text-green-600" : "text-primary"}`}>
            {formatPrice(l.price)}
          </div>

          {/* Details */}
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{l.city}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{formatDistanceToNow(new Date(l.createdAt), { locale: fr, addSuffix: true })}</span>
            </div>
          </div>

          <Badge variant="secondary" className="text-xs">{l.category}</Badge>

          {/* Description excerpt */}
          <p className="text-xs text-muted-foreground line-clamp-3 border-t pt-2">
            {l.description}
          </p>

          <Link href={`/annonces/${l.id}`}>
            <Button size="sm" className="w-full mt-1 gap-1 bg-[#0A2463] hover:bg-[#0A2463]/90">
              Voir l'annonce <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Comparer() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showSearch, setShowSearch] = useState(true);

  const addListing = (id: number) => {
    if (selectedIds.length >= MAX_COMPARE) return;
    if (selectedIds.includes(id)) return;
    setSelectedIds((prev) => [...prev, id]);
  };

  const removeListing = (id: number) => {
    setSelectedIds((prev) => prev.filter((i) => i !== id));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Comparer des annonces</h1>
        <p className="text-muted-foreground">
          Sélectionnez jusqu'à {MAX_COMPARE} annonces pour les comparer côte à côte.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Search panel */}
        {(showSearch || selectedIds.length < MAX_COMPARE) && (
          <div className="lg:w-80 shrink-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Ajouter une annonce</span>
                  <Badge variant="secondary">{selectedIds.length}/{MAX_COMPARE}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedIds.length >= MAX_COMPARE ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <Check className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    Maximum atteint. Supprimez une annonce pour en ajouter une autre.
                  </div>
                ) : (
                  <ListingSearchPanel onSelect={addListing} alreadySelected={selectedIds} />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Compare area */}
        <div className="flex-1 min-w-0">
          {selectedIds.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl">
              <Plus className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">Aucune annonce sélectionnée</p>
              <p className="text-sm mt-1">Utilisez la recherche à gauche pour ajouter des annonces à comparer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary row */}
              {selectedIds.length >= 2 && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#D4AF37]" />
                  Comparez les prix, localisations et descriptions pour faire le meilleur choix.
                </div>
              )}

              {/* Cards */}
              <div className="flex flex-col sm:flex-row gap-4 pt-3">
                <CompareCards selectedIds={selectedIds} onRemove={removeListing} />
              </div>

              {selectedIds.length < MAX_COMPARE && (
                <button
                  className="border-2 border-dashed border-primary/20 rounded-xl p-6 flex flex-col items-center justify-center w-full sm:w-auto sm:min-w-[200px] text-muted-foreground hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer"
                  onClick={() => setShowSearch(true)}
                >
                  <Plus className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-sm">Ajouter une annonce</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CompareCards({ selectedIds, onRemove }: { selectedIds: number[]; onRemove: (id: number) => void }) {
  const { data: l1 } = useGetListing(selectedIds[0] ?? 0, { query: { enabled: !!selectedIds[0], queryKey: ["listing", selectedIds[0]] } });
  const { data: l2 } = useGetListing(selectedIds[1] ?? 0, { query: { enabled: !!selectedIds[1], queryKey: ["listing", selectedIds[1]] } });
  const { data: l3 } = useGetListing(selectedIds[2] ?? 0, { query: { enabled: !!selectedIds[2], queryKey: ["listing", selectedIds[2]] } });

  const prices = [l1, l2, l3]
    .filter(Boolean)
    .map((l: any) => l?.price)
    .filter((p) => p != null) as number[];

  const minPrice = prices.length > 0 ? Math.min(...prices) : null;

  return (
    <>
      {selectedIds.map((id, idx) => {
        const listing = [l1, l2, l3][idx] as any;
        const isCheapest = minPrice != null && listing?.price === minPrice && prices.length > 1;
        return (
          <CompareCard
            key={id}
            listingId={id}
            onRemove={() => onRemove(id)}
            isCheapest={isCheapest}
          />
        );
      })}
    </>
  );
}
