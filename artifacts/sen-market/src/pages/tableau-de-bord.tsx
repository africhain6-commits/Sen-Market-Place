import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetMyListings, useGetConversations, getGetMyListingsQueryKey, getGetConversationsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Package, Clock, ExternalLink } from "lucide-react";

export default function TableauDeBord() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

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

  if (isAuthLoading || !isAuthenticated) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tableau de bord</h1>

      <Tabs defaultValue="annonces" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="annonces" data-testid="tab-annonces">
            <Package className="w-4 h-4 mr-2" />
            Mes annonces
          </TabsTrigger>
          <TabsTrigger value="messages" data-testid="tab-messages">
            <MessageSquare className="w-4 h-4 mr-2" />
            Mes messages
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
                      <div className="shrink-0 text-right">
                        <div className="font-semibold mb-1">
                          {listing.price ? new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF" }).format(listing.price) : "Sur demande"}
                        </div>
                        <Badge variant={listing.status === 'active' ? "default" : "secondary"}>
                          {listing.status === 'active' ? "En ligne" : "Inactif"}
                        </Badge>
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
  );
}