import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { PhotoUploader } from "@/components/photo-uploader";
import { formatFcfa } from "@/lib/format";
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  Check,
  MapPin,
  MessageCircle,
  Phone,
  Trash2,
  Wallet,
} from "lucide-react";

type Project = {
  id: number;
  userId: number;
  title: string;
  developerName: string | null;
  city: string;
  neighborhood: string | null;
  description: string;
  launchPrice: number | null;
  paymentPlan: string | null;
  deliveryDate: string | null;
  photos: string[] | null;
  status: string;
  createdAt: string;
  ownerName: string;
  ownerAgency: string | null;
  ownerVerified: boolean;
  phone: string | null;
  whatsapp: string | null;
};

const CITIES = ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Kaolack", "Mbour", "Touba", "Diourbel", "Louga", "Tambacounda"];

const EMPTY_FORM = {
  title: "",
  developerName: "",
  city: "",
  neighborhood: "",
  launchPrice: "",
  deliveryDate: "",
  paymentPlan: "",
  description: "",
};

async function api<T = unknown>(url: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || "Une erreur est survenue");
  }
  return res.json();
}

function ProjectCard({
  p,
  canManage,
  pending,
  onApprove,
  onDelete,
}: {
  p: Project;
  canManage: boolean;
  pending?: boolean;
  onApprove?: () => void;
  onDelete?: () => void;
}) {
  const waNumber = (p.whatsapp || p.phone || "").replace(/\D/g, "");
  const photos = p.photos ?? [];

  return (
    <Card data-testid={`card-project-${p.id}`}>
      <CardContent className="p-4 sm:p-5 space-y-4">
        {photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {photos.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={p.title}
                className="h-48 sm:h-56 rounded-lg object-cover shrink-0"
              />
            ))}
          </div>
        )}

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold">{p.title}</h3>
            {pending && <Badge variant="secondary">En attente</Badge>}
          </div>
          <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {p.neighborhood ? `${p.neighborhood}, ` : ""}
              {p.city}
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              {p.developerName || p.ownerAgency || p.ownerName}
              {p.ownerVerified && <BadgeCheck className="w-4 h-4 text-emerald-600" />}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border p-3 bg-muted/20">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Prix de lancement
            </p>
            <p className="font-bold text-primary mt-1">
              {p.launchPrice ? `À partir de ${formatFcfa(p.launchPrice)}` : "Sur demande"}
            </p>
          </div>
          <div className="rounded-lg border p-3 bg-muted/20 sm:col-span-1">
            <p className="text-xs text-muted-foreground">Plan de paiement</p>
            <p className="mt-1 whitespace-pre-line">{p.paymentPlan || "Sur demande"}</p>
          </div>
          <div className="rounded-lg border p-3 bg-muted/20">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarClock className="w-3.5 h-3.5" /> Livraison
            </p>
            <p className="mt-1">{p.deliveryDate || "À préciser"}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground whitespace-pre-line">{p.description}</p>

        <div className="flex flex-wrap gap-2">
          {p.phone && (
            <a href={`tel:${p.phone}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Phone className="w-4 h-4" />
                Appeler
              </Button>
            </a>
          )}
          {waNumber && (
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Bonjour, je suis intéressé par le projet « ${p.title} ».`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
            </a>
          )}
          <Link href={`/profil/${p.userId}`}>
            <Button variant="ghost" size="sm">Voir le promoteur</Button>
          </Link>
          {pending && onApprove && (
            <Button size="sm" className="gap-2" onClick={onApprove}>
              <Check className="w-4 h-4" />
              Approuver
            </Button>
          )}
          {canManage && onDelete && (
            <Button variant="outline" size="sm" className="gap-2 text-destructive" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
              Supprimer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Projets() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const me = user as unknown as { id: number; isAdmin?: boolean; accountType?: string } | null;
  const isAdmin = me?.isAdmin === true;
  const canPublish = isAuthenticated && (isAdmin || (!!me?.accountType && me.accountType !== "particulier"));

  const { data: projects, isLoading, isError } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api<Project[]>("/api/projects"),
  });

  const { data: pending } = useQuery({
    queryKey: ["projects-pending"],
    queryFn: () => api<Project[]>("/api/admin/projects/pending"),
    enabled: isAdmin,
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const setField = (key: keyof typeof EMPTY_FORM, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["projects-pending"] });
  };

  const submit = async () => {
    const cleaned = form.launchPrice.trim().replace(/[\s.]/g, "").replace(",", ".");
    const price = cleaned ? parseFloat(cleaned) : undefined;
    if (cleaned && (price === undefined || isNaN(price) || price <= 0)) {
      toast({ variant: "destructive", title: "Prix invalide", description: "Écrivez le prix en chiffres, ex : 25000000." });
      return;
    }
    setSaving(true);
    try {
      const result = await api<{ status: string }>("/api/projects", "POST", {
        title: form.title,
        developerName: form.developerName,
        city: form.city,
        neighborhood: form.neighborhood,
        launchPrice: price,
        deliveryDate: form.deliveryDate,
        paymentPlan: form.paymentPlan,
        description: form.description,
        photos,
      });
      toast({
        title: result.status === "active" ? "Projet publié" : "Projet envoyé en modération",
        description: result.status === "active" ? undefined : "Il sera visible après validation par notre équipe.",
      });
      setOpen(false);
      setForm(EMPTY_FORM);
      setPhotos([]);
      refresh();
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const approve = async (id: number) => {
    try {
      await api(`/api/admin/projects/${id}/approve`, "PATCH");
      toast({ title: "Projet approuvé" });
      refresh();
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: (err as Error).message });
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("Supprimer ce projet ?")) return;
    try {
      await api(`/api/projects/${id}`, "DELETE");
      toast({ title: "Projet supprimé" });
      refresh();
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: (err as Error).message });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Nouveaux projets</h1>
          <p className="text-muted-foreground mt-1">
            Programmes neufs au Sénégal : prix de lancement, plan de paiement et date de livraison.
          </p>
        </div>
        {canPublish ? (
          <Button onClick={() => setOpen(true)} className="shrink-0" data-testid="button-add-project">
            Publier un projet
          </Button>
        ) : isAuthenticated ? (
          <Link href="/courtiers">
            <Button variant="outline" className="shrink-0">Créer mon profil professionnel</Button>
          </Link>
        ) : (
          <Link href="/connexion">
            <Button variant="outline" className="shrink-0">Se connecter pour publier</Button>
          </Link>
        )}
      </div>

      {isAdmin && pending && pending.length > 0 && (
        <div className="mb-8 space-y-4">
          <h2 className="text-lg font-bold">En attente de validation ({pending.length})</h2>
          {pending.map((p) => (
            <ProjectCard
              key={p.id}
              p={p}
              pending
              canManage
              onApprove={() => approve(p.id)}
              onDelete={() => remove(p.id)}
            />
          ))}
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      )}

      {isError && <p className="text-center text-muted-foreground py-12">Impossible de charger les projets pour le moment.</p>}

      {!isLoading && !isError && projects && projects.length === 0 && (
        <div className="text-center py-16 border rounded-lg bg-muted/30">
          <Building2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Aucun projet pour le moment</p>
          <p className="text-sm text-muted-foreground mt-1">Les promoteurs peuvent publier leur premier projet ici.</p>
        </div>
      )}

      <div className="space-y-4">
        {projects?.map((p) => (
          <ProjectCard
            key={p.id}
            p={p}
            canManage={isAdmin || p.userId === me?.id}
            onDelete={() => remove(p.id)}
          />
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publier un projet</DialogTitle>
            <DialogDescription>Votre projet sera visible après validation par l'équipe SenMarket.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nom du projet *</label>
              <Input value={form.title} onChange={(e) => setField("title", e.target.value)} maxLength={120} placeholder="Ex : Résidence Les Almadies" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Promoteur</label>
              <Input value={form.developerName} onChange={(e) => setField("developerName", e.target.value)} maxLength={100} placeholder="Nom de la société" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Ville *</label>
                <Select value={form.city} onValueChange={(v) => setField("city", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Quartier</label>
                <Input value={form.neighborhood} onChange={(e) => setField("neighborhood", e.target.value)} maxLength={100} placeholder="Ex : Almadies" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Prix de lancement (FCFA)</label>
                <Input value={form.launchPrice} onChange={(e) => setField("launchPrice", e.target.value)} inputMode="numeric" placeholder="Ex : 25000000" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Date de livraison</label>
                <Input value={form.deliveryDate} onChange={(e) => setField("deliveryDate", e.target.value)} maxLength={60} placeholder="Ex : Décembre 2027" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Plan de paiement</label>
              <Textarea
                value={form.paymentPlan}
                onChange={(e) => setField("paymentPlan", e.target.value)}
                rows={3}
                maxLength={600}
                placeholder="Ex : 30% à la réservation, 40% pendant les travaux, 30% à la livraison"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={4}
                maxLength={3000}
                placeholder="Types de logements, surfaces, équipements, titre foncier..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Photos (jusqu'à 6)</label>
              <PhotoUploader photos={photos} onChange={setPhotos} maxPhotos={6} />
            </div>
          </div>

          <DialogFooter>
            <Button disabled={saving} onClick={submit}>
              {saving ? "Envoi..." : "Envoyer le projet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
