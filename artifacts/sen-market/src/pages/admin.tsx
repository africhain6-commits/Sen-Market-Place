import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import {
  useAdminGetListings,
  useAdminApproveListing,
  useAdminRejectListing,
  useAdminGetUsers,
  useAdminBanUser,
  getAdminGetListingsQueryKey,
  getAdminGetUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, User, Package, Clock, AlertTriangle } from "lucide-react";
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
                      {!u.isAdmin && u.id !== user?.id && (
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
