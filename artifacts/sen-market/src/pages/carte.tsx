import { useState, useEffect } from "react";
import { useGetListings } from "@workspace/api-client-react";
import { MapPin, Search, X } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = ["Immobilier", "Véhicules", "Électronique", "Mode & Beauté", "Maison & Jardin", "Services", "Emploi", "Animaux"];

const CITY_COORDS: Record<string, [number, number]> = {
  "Dakar": [14.6928, -17.4467],
  "Thiès": [14.7910, -16.9359],
  "Kaolack": [14.1517, -16.0726],
  "Saint-Louis": [16.0179, -16.4896],
  "Ziguinchor": [12.5607, -16.2719],
  "Rufisque": [14.7156, -17.2747],
  "Touba": [14.8592, -15.8828],
  "Mbour": [14.3683, -16.9553],
  "Diourbel": [14.6556, -16.2328],
  "Tambacounda": [13.7709, -13.6673],
  "Kolda": [12.9000, -14.9500],
  "Louga": [15.6142, -16.2242],
  "Fatick": [14.3347, -16.4100],
  "Matam": [15.6559, -13.2554],
  "Kaffrine": [14.1058, -15.5496],
  "Kédougou": [12.5550, -12.1745],
  "Sédhiou": [12.7080, -15.5569],
};

const formatPrice = (price?: number | null) => {
  if (price == null) return "Sur demande";
  return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(price);
};

function jitter(val: number): number {
  return val + (Math.random() - 0.5) * 0.04;
}

export default function Carte() {
  const [category, setCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [MapComponents, setMapComponents] = useState<any>(null);

  const { data: listingsData } = useGetListings({ status: "active", limit: 200, page: 1 } as any, {
    query: { queryKey: ["carte-listings"] },
  });
  const listings = (listingsData as any)?.listings ?? [];

  useEffect(() => {
    Promise.all([
      import("leaflet"),
      import("react-leaflet"),
    ]).then(([L, RL]) => {
      (L.default as any).Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setMapComponents(RL);
    });
  }, []);

  const filteredListings = (listings as any[]).filter((l) => {
    const hasCoords = !!CITY_COORDS[l.city];
    const matchCat = !category || l.category === category;
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase());
    return hasCoords && matchCat && matchSearch;
  });

  const selectedListing = filteredListings.find((l: any) => l.id === selected);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="text-2xl font-bold">Carte des annonces</h1>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une annonce..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={category || "_all"} onValueChange={(v) => setCategory(v === "_all" ? "" : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Toutes catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Toutes catégories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">{filteredListings.length} annonce{filteredListings.length !== 1 ? "s" : ""} sur la carte</p>
      </div>

      <div className="relative border rounded-xl overflow-hidden" style={{ height: "500px" }}>
        {MapComponents ? (
          <MapComponents.MapContainer
            center={[14.4974, -14.4524]}
            zoom={7}
            style={{ height: "100%", width: "100%" }}
          >
            <MapComponents.TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredListings.map((listing: any) => {
              const coords = CITY_COORDS[listing.city];
              if (!coords) return null;
              return (
                <MapComponents.Marker
                  key={listing.id}
                  position={[jitter(coords[0]), jitter(coords[1])]}
                  eventHandlers={{ click: () => setSelected(listing.id === selected ? null : listing.id) }}
                >
                  <MapComponents.Popup>
                    <div className="min-w-[200px]">
                      {listing.photos?.[0] && (
                        <img src={listing.photos[0]} alt={listing.title} className="w-full h-24 object-cover rounded mb-2" />
                      )}
                      <p className="font-semibold text-sm leading-tight">{listing.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {listing.city}
                      </p>
                      <p className="font-bold text-primary text-sm mt-1">{formatPrice(listing.price)}</p>
                      <a
                        href={`${import.meta.env.BASE_URL}annonces/${listing.id}`.replace(/\/+/g, "/")}
                        className="mt-2 block text-center text-xs bg-primary text-white rounded px-2 py-1 hover:bg-primary/90"
                      >
                        Voir l'annonce
                      </a>
                    </div>
                  </MapComponents.Popup>
                </MapComponents.Marker>
              );
            })}
          </MapComponents.MapContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chargement de la carte...</p>
            </div>
          </div>
        )}
      </div>

      {/* City list */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Annonces par ville</h2>
        <div className="flex flex-wrap gap-2">
          {Object.keys(CITY_COORDS).map((city) => {
            const count = filteredListings.filter((l: any) => l.city === city).length;
            if (count === 0) return null;
            return (
              <Badge key={city} variant="secondary" className="gap-1 cursor-pointer hover:bg-primary/10 transition-colors">
                <MapPin className="w-3 h-3" />
                {city} ({count})
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}
