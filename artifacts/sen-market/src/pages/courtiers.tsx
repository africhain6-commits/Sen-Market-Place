import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BadgeCheck, MapPin, Phone, MessageCircle, Languages, Building2, Search, Store, UserCheck } from "lucide-react";
import { StoriesBar } from "@/components/stories-bar";

type Pro = {
  id: number;
  name: string;
  avatarUrl: string | null;
  city: string | null;
  accountType: string;
  agencyName: string | null;
  languages: string | null;
  isVerified: boolean;
  phone: string | null;
  whatsapp: string | null;
  activeListings: number;
  createdAt: string;
};

const TYPE_TABS = [
  { value: "all", label: "Tous" },
  { value: "courtier", label: "Courtiers" },
  { value: "boutique", label: "Boutiques" },
  { value: "prestataire", label: "Prestataires" },
];

const TYPE_LABELS: Record<string, string> = {
  courtier: "Courtier",
  boutique: "Boutique",
  prestataire: "Prestataire de services",
};

async function fetchPros(type: string, q: string): Promise<Pro[]> {
  const params = new URLSearchParams();
  if (type !== "all") params.set("type", type);
  if (q.trim()) params.set("q", q.trim());
  const res = await fetch(`/api/courtiers?${params.toString()}`, { credentials: "include" });
  if (!res.ok) throw new Error("Chargement impossible");
  return res.json();
}

async function sendJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || "Une erreur est survenue");
  }
  return res.json();
}

export default function Courtiers() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const me = user as unknown as
    | { id: number; isAdmin?: boolean; accountType?: string; agencyName?: string | null; languages?: string | null }
    | null;

  const [type, setType] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Recherche automatique pendant la frappe
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: pros, isLoading, isError } = useQuery({
    queryKey: ["courtiers", type, search],
    queryFn: () => fetchPros(type, search),
  });

  // Formulaire « Je suis un professionnel »
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState("courtier");
  const [formAgency, setFormAgency] = useState("");
  const [formLanguages, setFormLanguages] = useState("");
  const [saving, setSaving] = useState(false);

  const openForm = () => {
    const current = me?.accountType && me.accountType !== "particulier" ? me.accountType : "courtier";
    setFormType(current);
    setFormAgency(me?.agencyName ?? "");
    setFormLanguages(me?.languages ?? "");
    setFormOpen(true);
  };

  const saveForm = async (accountType: string) => {
    setSaving(true);
    try {
      await sendJson("/api/me/pro-profile", {
        accountType,
        agencyName: formAgency,
        languages: formLanguages,
      });
      toast({
        title: accountType === "particulier" ? "Profil professionnel retiré" : "Profil professionnel enregistré",
      });
      setFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["courtiers"] });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const toggleVerified = async (pro: Pro) => {
    try {
      await sendJson(`/api/admin/users/${pro.id}/verify`, { verified: !pro.isVerified });
      queryClient.invalidateQueries({ queryKey: ["courtiers"] });
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: (err as Error).message });
    }
  };

  const isPro = !!me?.accountType && me.accountType !== "particulier";

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Courtiers &amp; professionnels</h1>
          <p className="text-muted-foreground mt-1">
            Trouvez un courtier, une boutique ou un prestataire de confiance au Sénégal.
          </p>
        </div>
        {isAuthenticated ? (
          <Button onClick={openForm} className="gap-2 shrink-0" data-testid="button-pro-profile">
            <UserCheck className="w-4 h-4" />
            {isPro ? "Modifier mon profil pro" : "Je suis un professionnel"}
          </Button>
        ) : (
          <Link href="/inscription">
            <Button className="gap-2 shrink-0">
              <UserCheck className="w-4 h-4" />
              Je suis un professionnel
            </Button>
          </Link>
        )}
      </div>

      <StoriesBar />

      <form
        className="flex gap-2 mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(searchInput);
        }}
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Nom, agence ou ville (ex : Dakar)"
            className="pl-9"
            data-testid="input-search-pros"
          />
        </div>
        <Button type="submit">Chercher</Button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {TYPE_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={type === tab.value ? "default" : "outline"}
            size="sm"
            className="shrink-0"
            onClick={() => setType(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      )}

      {isError && <p className="text-center text-muted-foreground py-12">Impossible de charger la liste pour le moment.</p>}

      {!isLoading && !isError && pros && pros.length === 0 && (
        <div className="text-center py-16 border rounded-lg bg-muted/30">
          <Store className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Aucun professionnel pour le moment</p>
          <p className="text-sm text-muted-foreground mt-1">Soyez le premier à créer votre profil professionnel.</p>
        </div>
      )}

      <div className="space-y-4">
        {pros?.map((pro) => {
          const waNumber = (pro.whatsapp || pro.phone || "").replace(/\D/g, "");
          return (
            <Card key={pro.id} data-testid={`card-pro-${pro.id}`}>
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                <Link href={`/profil/${pro.id}`} className="shrink-0 self-start">
                  <Avatar className="h-24 w-24 rounded-lg">
                    <AvatarImage src={pro.avatarUrl || ""} className="object-cover" />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-3xl">
                      {pro.name?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/profil/${pro.id}`} className="text-lg font-semibold hover:text-primary transition-colors">
                      {pro.name}
                    </Link>
                    {pro.isVerified && (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600 gap-1">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Vérifié
                      </Badge>
                    )}
                    <Badge variant="secondary">{TYPE_LABELS[pro.accountType] ?? pro.accountType}</Badge>
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {pro.agencyName && (
                      <p className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 shrink-0" />
                        {pro.agencyName}
                      </p>
                    )}
                    {pro.city && (
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 shrink-0" />
                        {pro.city}
                      </p>
                    )}
                    {pro.languages && (
                      <p className="flex items-center gap-2">
                        <Languages className="w-4 h-4 shrink-0" />
                        Parle {pro.languages}
                      </p>
                    )}
                    <p className="font-medium text-foreground">
                      {pro.activeListings} annonce{pro.activeListings > 1 ? "s" : ""} en ligne
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {pro.phone && (
                      <a href={`tel:${pro.phone}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Phone className="w-4 h-4" />
                          Appeler
                        </Button>
                      </a>
                    )}
                    {waNumber && (
                      <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white">
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </Button>
                      </a>
                    )}
                    <Link href={`/profil/${pro.id}`}>
                      <Button variant="ghost" size="sm">Voir le profil</Button>
                    </Link>
                    {me?.isAdmin && (
                      <Button variant="outline" size="sm" onClick={() => toggleVerified(pro)}>
                        {pro.isVerified ? "Retirer « Vérifié »" : "Marquer « Vérifié »"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mon profil professionnel</DialogTitle>
            <DialogDescription>
              Votre profil apparaîtra dans la liste. Le badge « Vérifié » est donné par l'équipe SenMarket.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Je suis</label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="courtier">Courtier immobilier</SelectItem>
                  <SelectItem value="boutique">Boutique / commerçant</SelectItem>
                  <SelectItem value="prestataire">Prestataire de services</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Agence ou nom de la boutique</label>
              <Input value={formAgency} onChange={(e) => setFormAgency(e.target.value)} maxLength={100} placeholder="Ex : Dakar Immo" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Langues parlées</label>
              <Input value={formLanguages} onChange={(e) => setFormLanguages(e.target.value)} maxLength={100} placeholder="Ex : Français, Wolof, Anglais" />
            </div>
            <p className="text-xs text-muted-foreground">
              Pensez à renseigner votre ville, votre téléphone et votre WhatsApp dans votre profil pour être contacté facilement.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {isPro && (
              <Button variant="ghost" disabled={saving} onClick={() => saveForm("particulier")}>
                Retirer mon profil pro
              </Button>
            )}
            <Button disabled={saving} onClick={() => saveForm(formType)}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
