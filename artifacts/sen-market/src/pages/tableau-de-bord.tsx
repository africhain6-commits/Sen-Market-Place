import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetMyListings,
  useGetConversations,
  useDeleteListing,
  useUpdateListing,
  useRenewListing,
  useGetFavorites,
  useRemoveFavorite,
  getGetMyListingsQueryKey,
  getGetConversationsQueryKey,
  getGetFavoritesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
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
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Package, Clock, ExternalLink, Zap, Pencil, Pause, Play, Heart, RefreshCw, MapPin } from "lucide-react";
import { useState } from "react";
import { BoostModal } from "@/components/boost-modal";

const formatPrice = (price?: number | null) => {
  if (price == null) return "Sur demande";
  return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(price);
};

export default function TableauDeBord() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [boostListing, setBoostListing] = useState<{ id: number; title: string } | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useDeleteListing({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyListingsQueryKey() });
        toast({ title: "Annonce supprimée" });
      },
      onError: () => toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" }),
    },
  });

  const statusMutation = useUpdateListing({
    mutation: {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: getGetMyListingsQueryKey() });
        const isPausing = variables.data.status === "inactive";
        toast({ title: isPausing ? "Annonce mise en pause" : "Annonce réactivée" });
      },
      onError: () => toast({ title: "Erreur", description: "Impossible de modifier le statut.", variant: "destructive" }),
    },
  });

  const renewMutation = useRenewListing({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyListingsQueryKey() });
        toast({ title: "Annonce renouvelée !", description: "Votre annonce est de nouveau en tête des résultats." });
      },
      onError: () => toast({ title: "Erreur", description: "Impossible de renouveler.", variant: "destructive" }),
    },
  });

  const removeFavoriteMutation = useRemoveFavorite({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFavoritesQueryKey() });
        toast({ title: "Retiré des favoris" });
      },
    },
  });

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation("/connexion");
    }
  }, [isAuthLoading, isAuthenticated, setLocation]);

  const { data: listings, isLoading: isLoadingListings } = useGetMyListings({
    query: {
      enabled: isAuthenticated,
      queryKey: getGetMyListingsQueryKey(),
    }
  });

  const { data: conversations, isLoading: isLoadingConversations } = useGetConversations({
    query: {
      enabled: isAuthenticated,
      queryKey: getGetConversationsQueryKey(),
    }
  });

  const { data: favorites, isLoading: isLoadingFavorites } = useGetFavorites({
    query: {
      enabled: isAuthenticated,
      queryKey: getGetFavoritesQueryKey(),
    }
  });

  if (isAuthLoading || !isAuthenticated) return null;

  return (
    <>
    {boostListing && (
      <BoostModal
        open={!!boostListing}
        onClose={() => setBoostListing(null)}
        listingId={boostListing.id}
        listingTitle={boostListing.title}
      />
    )}
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tableau de bord</h1>

      <Tabs defaultValue="annonces" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3 mb-8">
          <TabsTrigger value="annonces" data-testid="tab-annonces">
            <Package className="w-4 h-4 mr-2" />
            Mes annonces
          </TabsTrigger>
          <TabsTrigger value="favoris" data-testid="tab-favoris">
            <Heart className="w-4 h-4 mr-2" />
            Favoris
            {favorites && favorites.length > 0 && (
              <span className="ml-2 bg-primary/10 text-primary text-xs font-bold px-1.5 py-0.5 rounded-full">
                {favorites.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages" data-testid="tab-messages">
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
            {conversations && conversations.some(c => c.unreadCount > 0) && (
              <span className="ml-2 bg-destructive text-destructive-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs">
                {conversations.filter(c => c.unreadCount > 0).length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="annonces">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Mes annonces</CardTitle>
                <CardDescription>Gérez vos annonces publiées.</CardDescription>
              </div>
              <Link href="/publier">
                <Button size="sm">Nouvelle annonce</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoadingListings ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
              ) : listings && listings.length > 0 ? (
                <div className="space-y-4">
                  {listings.map(listing => (
                    <div key={listing.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-16 w-16 bg-muted rounded overflow-hidden shrink-0">
                        {listing.photos && listing.photos[0] ? (
                          <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-8 h-8 m-4 text-muted-foreground opacity-20" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/annonces/${listing.id}`} className="font-semibold text-primary hover:underline line-clamp-1 block">
                          {listing.title}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="font-normal">{listing.category}</Badge>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(listing.createdAt), { locale: fr, addSuffix: true })}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right flex flex-col items-end gap-2">
                        <div className="font-semibold">{formatPrice(listing.price)}</div>
                        <div className="flex items-center gap-2">
                          {(listing as any).isBoosted && (
                            <Badge className="bg-[#D4AF37] text-[#0A2463] border-0 gap-1">
                              <Zap className="w-3 h-3" /> VEDETTE
                            </Badge>
                          )}
                          <Badge variant={listing.status === 'active' ? "default" : "secondary"}>
                            {listing.status === 'active' ? "En ligne" : listing.status === 'pending' ? "En attente" : "Inactif"}
                          </Badge>
                        </div>
                        <Link href={`/modifier/${listing.id}`}>
                          <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={(e) => e.stopPropagation()}>
                            <Pencil className="w-3 h-3" />
                            Modifier
                          </Button>
                        </Link>
                        {listing.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs h-7 border-primary/40 text-primary hover:bg-primary/5"
                            disabled={renewMutation.isPending}
                            onClick={() => renewMutation.mutate({ id: listing.id })}
                          >
                            <RefreshCw className="w-3 h-3" />
                            Renouveler
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs h-7"
                          disabled={statusMutation.isPending}
                          onClick={(e) => {
                            e.preventDefault();
                            statusMutation.mutate({
                              id: listing.id,
                              data: { status: listing.status === "active" ? "inactive" : "active" },
                            });
                          }}
                        >
                          {listing.status === "active" ? (
                            <><Pause className="w-3 h-3" /> Pause</>
                          ) : (
                            <><Play className="w-3 h-3" /> Activer</>
                          )}
                        </Button>
                        {!(listing as any).isBoosted && listing.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 gap-1 text-xs h-7"
                            onClick={(e) => {
                              e.preventDefault();
                              setBoostListing({ id: listing.id, title: listing.title });
                            }}
                          >
                            <Zap className="w-3 h-3" />
                            Booster
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive text-destructive hover:bg-destructive/10 gap-1 text-xs h-7"
                              onClick={(e) => e.preventDefault()}
                            >
                              Supprimer
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer cette annonce ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. L'annonce « {listing.title} » sera définitivement supprimée.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => deleteMutation.mutate({ id: listing.id })}
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
                <div className="text-center py-12 text-muted-foreground">
                  Vous n'avez pas encore d'annonces.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favoris">
          <Card>
            <CardHeader>
              <CardTitle>Mes favoris</CardTitle>
              <CardDescription>Les annonces que vous avez sauvegardées.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingFavorites ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full" />)}
                </div>
              ) : favorites && favorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favorites.map((listing: any) => (
                    <div key={listing.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow group">
                      <Link href={`/annonces/${listing.id}`}>
                        <div className="relative h-36 bg-muted overflow-hidden">
                          {listing.photos?.[0] ? (
                            <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-10 h-10 text-muted-foreground opacity-20" />
                            </div>
                          )}
                          {listing.isBoosted && (
                            <span className="absolute top-2 left-2 bg-[#D4AF37] text-[#0A2463] text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                              <Zap className="w-3 h-3" /> VEDETTE
                            </span>
                          )}
                        </div>
                      </Link>
                      <div className="p-3">
                        <Link href={`/annonces/${listing.id}`} className="font-semibold text-sm text-primary hover:underline line-clamp-1 block">
                          {listing.title}
                        </Link>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-bold text-primary text-sm">{formatPrice(listing.price)}</span>
                          {listing.city && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{listing.city}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">{listing.category}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-destructive hover:bg-destructive/10 gap-1"
                            onClick={() => removeFavoriteMutation.mutate({ listingId: listing.id })}
                            disabled={removeFavoriteMutation.isPending}
                          >
                            <Heart className="w-3 h-3 fill-destructive" />
                            Retirer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Aucun favori pour l'instant.</p>
                  <Link href="/annonces">
                    <Button variant="outline" className="mt-4">Parcourir les annonces</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Mes messages</CardTitle>
              <CardDescription>Conversations liées à vos annonces et celles des autres.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingConversations ? (
                <div className="space-y-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : conversations && conversations.length > 0 ? (
                <div className="space-y-4">
                  {conversations.map((conv, i) => (
                    <div key={`${conv.listingId}-${conv.otherUser.id}-${i}`} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
                        {conv.otherUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold">{conv.otherUser.name}</h4>
                          {conv.lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { locale: fr, addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <Link href={`/annonces/${conv.listingId}`} className="text-xs text-primary font-medium hover:underline flex items-center gap-1 mb-2">
                          <ExternalLink className="w-3 h-3" /> {conv.listing?.title || "Annonce"}
                        </Link>
                        {conv.lastMessage && (
                          <p className={`text-sm line-clamp-1 ${conv.unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                            {conv.lastMessage.content}
                          </p>
                        )}
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="shrink-0 bg-primary text-primary-foreground text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    La messagerie complète sera implémentée prochainement. 
                    <br/>Pour l'instant, répondez directement depuis l'annonce.
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Aucun message pour le moment.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}
