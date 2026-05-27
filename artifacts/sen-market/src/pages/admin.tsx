import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import {
  useAdminGetListings,
  useAdminApproveListing,
  useAdminRejectListing,
  useAdminGetUsers,
  useAdminBanUser,
  useGetAdminStats,
  getAdminGetListingsQueryKey,
  getAdminGetUsersQueryKey,
  getGetAdminStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, User, Package, Clock, AlertTriangle, Zap, Shield, BarChart3, Heart, Star, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "secondary" },
  active: { label: "Approuvé", variant: "default" },
  rejected: { label: "Refusé", variant: "destructive" },
};

export default function Admin() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [boostingId, setBoostingId] = useState<number | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [promotingId, setPromotingId] = useState<number | null>(null);

  const [revokingId, setRevokingId] = useState<number | null>(null);

  const handleMakeAdmin = async (id: number, name: string) => {
    setPromotingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/make-admin`, { method: "PATCH", credentials: "include" });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
      toast({ title: `${name} est maintenant administrateur !` });
    } catch {
      toast({ title: "Erreur", description: "Impossible de promouvoir.", variant: "destructive" });
    } finally {
      setPromotingId(null);
    }
  };

  const handleRevokeAdmin = async (id: number, name: string) => {
    setRevokingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/revoke-admin`, { method: "PATCH", credentials: "include" });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
      toast({ title: `Droits admin retirés`, description: `${name} n'est plus administrateur.` });
    } catch {
      toast({ title: "Erreur", description: "Impossible de retirer les droits.", variant: "destructive" });
    } finally {
      setRevokingId(null);
    }
  };
  const handleAdminDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: getAdminGetListingsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getAdminGetListingsQueryKey({ status: statusFilter }) });
      toast({ title: "Annonce supprimée définitivement." });
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleBoost = async (id: number, days = 30) => {
    setBoostingId(id);
    try {
      await fetch(`/api/admin/listings/${id}/boost`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
        credentials: "include",
      });
      queryClient.invalidateQueries({ queryKey: getAdminGetListingsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getAdminGetListingsQueryKey({ status: statusFilter }) });
      toast({ title: "Annonce boostée !", description: `Mise en VEDETTE pour ${days} jours.` });
    } finally {
      setBoostingId(null);
    }
  };

  const handleUnboost = async (id: number) => {
    setBoostingId(id);
    try {
      await fetch(`/api/admin/listings/${id}/unboost`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      queryClient.invalidateQueries({ queryKey: getAdminGetListingsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getAdminGetListingsQueryKey({ status: statusFilter }) });
      toast({ title: "Boost retiré", description: "L'annonce n'est plus en vedette." });
    } finally {
      setBoostingId(null);
    }
  };

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !user?.isAdmin)) {
      setLocation("/");
    }
  }, [isAuthLoading, isAuthenticated, user?.isAdmin, setLocation]);

  const { data: listings, isLoading: isLoadingListings } = useAdminGetListings(
    { status: statusFilter },
    { query: { queryKey: getAdminGetListingsQueryKey({ status: statusFilter }) } },
  );

  const { data: users, isLoading: isLoadingUsers } = useAdminGetUsers({
    query: { queryKey: getAdminGetUsersQueryKey() },
  });

  const { data: stats, isLoading: isLoadingStats } = useGetAdminStats({
    query: { queryKey: getGetAdminStatsQueryKey() },
  });

  const approveMutation = useAdminApproveListing({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminGetListingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminGetListingsQueryKey({ status: statusFilter }) });
        toast({ title: "Annonce approuvée", description: "L'annonce est maintenant en ligne." });
      },
    },
  });

  const rejectMutation = useAdminRejectListing({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminGetListingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminGetListingsQueryKey({ status: statusFilter }) });
        toast({ title: "Annonce refusée", description: "L'annonce a été retirée." });
      },
    },
  });

  const banMutation = useAdminBanUser({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminGetListingsQueryKey() });
        toast({ title: "Utilisateur suspendu", description: data.message });
      },
    },
  });

  const formatPrice = (price?: number | null) => {
    if (price == null) return "Prix sur demande";
    return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(price);
  };

  if (isAuthLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-64 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">A</div>
        <div>
          <h1 className="text-3xl font-bold">Panel Administration</h1>
          <p className="text-muted-foreground text-sm">Bonjour {user?.name} — gérez les annonces et les utilisateurs</p>
        </div>
      </div>

      <Tabs defaultValue="listings">
        <TabsList className="mb-6">
          <TabsTrigger value="listings" data-testid="tab-admin-listings">
            <Package className="w-4 h-4 mr-2" />
            Annonces
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-admin-users">
            <User className="w-4 h-4 mr-2" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="stats" data-testid="tab-admin-stats">
            <BarChart3 className="w-4 h-4 mr-2" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listings">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Gestion des annonces</CardTitle>
              <div className="flex gap-2">
                {["pending", "active", "rejected"].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={statusFilter === s ? "default" : "outline"}
                    onClick={() => setStatusFilter(s)}
                    data-testid={`filter-${s}`}
                  >
                    {STATUS_LABELS[s].label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingListings ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
              ) : listings && listings.length > 0 ? (
                <div className="space-y-3">
                  {listings.map((listing) => (
                    <div
                      key={listing.id}
                      className="flex items-start gap-4 p-4 border rounded-lg bg-card"
                      data-testid={`admin-listing-${listing.id}`}
                    >
                      <div className="h-16 w-16 bg-muted rounded overflow-hidden shrink-0">
                        {listing.photos?.[0] ? (
                          <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-8 h-8 m-4 text-muted-foreground opacity-20" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link href={`/annonces/${listing.id}`} className="font-semibold hover:text-primary hover:underline line-clamp-1">
                              {listing.title}
                            </Link>
                            <p className="text-xs text-muted-foreground mt-1">
                              Par <span className="font-medium">{listing.user?.name}</span> · {listing.city} ·{" "}
                              <Clock className="inline w-3 h-3" />{" "}
                              {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true, locale: fr })}
                            </p>
                          </div>
                          <Badge variant={STATUS_LABELS[listing.status]?.variant ?? "outline"}>
                            {STATUS_LABELS[listing.status]?.label ?? listing.status}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">{formatPrice(listing.price)}</span>
                          <Badge variant="outline" className="text-xs">{listing.category}</Badge>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        {listing.status !== "active" && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate({ id: listing.id })}
                            data-testid={`approve-${listing.id}`}
                          >
                            <CheckCircle className="w-3 h-3" />
                            Approuver
                          </Button>
                        )}
                        {listing.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            disabled={rejectMutation.isPending}
                            onClick={() => rejectMutation.mutate({ id: listing.id })}
                            data-testid={`reject-${listing.id}`}
                          >
                            <XCircle className="w-3 h-3" />
                            Refuser
                          </Button>
                        )}
                        {listing.status === "active" && !(listing as any).isBoosted && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 gap-1"
                            disabled={boostingId === listing.id}
                            onClick={() => handleBoost(listing.id, 30)}
                          >
                            <Zap className="w-3 h-3" />
                            Booster
                          </Button>
                        )}
                        {(listing as any).isBoosted && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-muted-foreground text-muted-foreground gap-1"
                            disabled={boostingId === listing.id}
                            onClick={() => handleUnboost(listing.id)}
                          >
                            <Zap className="w-3 h-3" />
                            Retirer VEDETTE
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="gap-1" disabled={deletingId === listing.id}>
                              <XCircle className="w-3 h-3" />
                              Supprimer
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer définitivement ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                L'annonce « {listing.title} » sera supprimée de façon irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => handleAdminDelete(listing.id)}
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Aucune annonce {STATUS_LABELS[statusFilter]?.label.toLowerCase()} pour l'instant.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="space-y-6">
            {isLoadingStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-28 w-full" />)}
              </div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Utilisateurs", value: stats.totalUsers, icon: User, color: "text-blue-600" },
                    { label: "Annonces totales", value: stats.totalListings, icon: Package, color: "text-slate-600" },
                    { label: "Annonces actives", value: stats.activeListings, icon: TrendingUp, color: "text-emerald-600" },
                    { label: "En attente", value: stats.pendingListings, icon: Clock, color: "text-amber-600" },
                    { label: "Refusées", value: stats.rejectedListings, icon: XCircle, color: "text-red-500" },
                    { label: "Boostées", value: stats.boostedListings, icon: Zap, color: "text-[#D4AF37]" },
                    { label: "Favoris", value: stats.totalFavorites, icon: Heart, color: "text-rose-500" },
                    { label: "Avis", value: stats.totalReviews, icon: Star, color: "text-purple-500" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label}>
                      <CardContent className="p-5 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{label}</span>
                          <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <span className="text-3xl font-bold">{value}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {stats.listingsByCategory && stats.listingsByCategory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Annonces par catégorie (actives)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.listingsByCategory.map((cat: any) => {
                          const pct = stats.activeListings > 0
                            ? Math.round((cat.count / stats.activeListings) * 100)
                            : 0;
                          return (
                            <div key={cat.category}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">{cat.category}</span>
                                <span className="text-sm text-muted-foreground">{cat.count} ({pct}%)</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Impossible de charger les statistiques.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : users && users.length > 0 ? (
                <div className="space-y-3">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center gap-4 p-4 border rounded-lg" data-testid={`admin-user-${u.id}`}>
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{u.name}</span>
                          {u.isAdmin && <Badge variant="default" className="text-xs">Admin</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{u.email} · {u.city ?? "Ville non renseignée"}</p>
                      </div>
                      {u.id !== user?.id && (
                        <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                          {u.isAdmin ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 border-destructive text-destructive hover:bg-destructive/10"
                              disabled={revokingId === u.id}
                              onClick={() => handleRevokeAdmin(u.id, u.name)}
                            >
                              <Shield className="w-3 h-3" />
                              Retirer admin
                            </Button>
                          ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
                            disabled={promotingId === u.id}
                            onClick={() => handleMakeAdmin(u.id, u.name)}
                          >
                            <Shield className="w-3 h-3" />
                            Rendre admin
                          </Button>
                          )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1 shrink-0"
                              data-testid={`ban-${u.id}`}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              Supprimer annonces
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer toutes les annonces ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cela supprimera toutes les annonces de <strong>{u.name}</strong>. Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => banMutation.mutate({ id: u.id })}
                              >
                                Confirmer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Aucun utilisateur.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
