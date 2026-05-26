import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetListing, useSendMessage, getGetListingQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, ShieldCheck, Mail, AlertCircle, Home as HomeIcon, MessageCircle, ArrowLeft } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";

export default function AnnonceDetail() {
  const [, params] = useRoute("/annonces/:id");
  const [, setLocation] = useLocation();
  const listingId = params?.id ? parseInt(params.id) : 0;
  
  const { user, isAuthenticated } = useAuth();
  const [message, setMessage] = useState("");
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

  const { data: listing, isLoading, error } = useGetListing(listingId, {
    query: {
      enabled: !!listingId,
      queryKey: getGetListingQueryKey(listingId),
    }
  });

  const sendMessageMutation = useSendMessage({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Message envoyé",
          description: "Le vendeur recevra votre message sous peu.",
        });
        setIsMessageDialogOpen(false);
        setMessage("");
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: err.message || "Impossible d'envoyer le message.",
        });
      }
    }
  });

  const handleSendMessage = () => {
    if (!message.trim() || !listing?.userId) return;
    sendMessageMutation.mutate({
      data: {
        content: message,
        listingId: listing.id,
        receiverId: listing.userId
      }
    });
  };

  const formatPrice = (price?: number | null) => {
    if (price == null) return "Prix sur demande";
    return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF" }).format(price);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="w-full aspect-[4/3] rounded-lg" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Annonce introuvable</h1>
        <p className="text-muted-foreground mb-6">Cette annonce a peut-être été supprimée ou n'existe pas.</p>
        <Link href="/annonces">
          <Button>Retour aux annonces</Button>
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === listing.userId;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button + breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => setLocation("/annonces")}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden">
          <Link href="/" className="hover:text-foreground transition-colors shrink-0">Accueil</Link>
          <span>/</span>
          <Link href="/annonces" className="hover:text-foreground transition-colors shrink-0">Annonces</Link>
          <span>/</span>
          <Link href={`/annonces?category=${listing.category}`} className="hover:text-foreground transition-colors truncate">{listing.category}</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Photos and Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-lg overflow-hidden">
            {listing.photos && listing.photos.length > 0 ? (
              <div className="aspect-[4/3] sm:aspect-video relative bg-muted flex items-center justify-center">
                <img 
                  src={listing.photos[0]} 
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[4/3] sm:aspect-video relative bg-muted flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <HomeIcon className="w-16 h-16 mx-auto mb-2 opacity-20" />
                  <p>Aucune photo disponible</p>
                </div>
              </div>
            )}
            
            {/* Thumbnails if multiple photos */}
            {listing.photos && listing.photos.length > 1 && (
              <div className="flex p-4 gap-4 overflow-x-auto border-t">
                {listing.photos.map((photo, i) => (
                  <button key={i} className="shrink-0 w-24 h-24 rounded border-2 border-transparent hover:border-primary overflow-hidden transition-colors">
                    <img src={photo} alt={`Photo ${i+1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
              {listing.description}
            </div>
          </div>
        </div>

        {/* Right Column - Info and Actions */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
              <div className="text-3xl font-bold text-primary mb-6">
                {formatPrice(listing.price)}
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <span>{listing.city}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span>Publié {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true, locale: fr })}</span>
                </div>
              </div>

              {!isOwner ? (
                <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full" data-testid="button-contact">
                      <Mail className="w-4 h-4 mr-2" />
                      Envoyer un message
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Contacter le vendeur</DialogTitle>
                      <DialogDescription>
                        Envoyez un message concernant : {listing.title}
                      </DialogDescription>
                    </DialogHeader>
                    {!isAuthenticated ? (
                      <div className="py-6 text-center space-y-4">
                        <p>Vous devez être connecté pour envoyer un message.</p>
                        <div className="flex gap-4 justify-center">
                          <Link href="/connexion"><Button variant="outline">Se connecter</Button></Link>
                          <Link href="/inscription"><Button>S'inscrire</Button></Link>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 py-4">
                        <Textarea 
                          placeholder="Bonjour, je suis intéressé(e) par votre annonce..." 
                          className="min-h-[150px]"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                        />
                      </div>
                    )}
                    {isAuthenticated && (
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>Annuler</Button>
                        <Button 
                          onClick={handleSendMessage} 
                          disabled={!message.trim() || sendMessageMutation.isPending}
                        >
                          {sendMessageMutation.isPending ? "Envoi..." : "Envoyer"}
                        </Button>
                      </DialogFooter>
                    )}
                  </DialogContent>
                </Dialog>
              ) : (
                <Button size="lg" variant="outline" className="w-full" disabled>
                  C'est votre annonce
                </Button>
              )}
            </CardContent>
          </Card>

          {listing.user && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Informations du vendeur</h3>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={listing.user.avatarUrl || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {listing.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link href={`/profil/${listing.user.id}`} className="font-medium hover:text-primary transition-colors">
                      {listing.user.name}
                    </Link>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      Membre depuis {format(new Date(listing.user.createdAt), "MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {listing.user.whatsapp && !isOwner && (
                    <a
                      href={`https://wa.me/${listing.user.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                      data-testid="button-whatsapp"
                    >
                      <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Contacter sur WhatsApp
                      </Button>
                    </a>
                  )}
                  {listing.user.phone && !isOwner && (
                    <a href={`tel:${listing.user.phone}`} className="w-full" data-testid="link-phone">
                      <Button variant="outline" className="w-full gap-2">
                        <Mail className="w-4 h-4" />
                        {listing.user.phone}
                      </Button>
                    </a>
                  )}
                  <Link href={`/profil/${listing.user.id}`}>
                    <Button variant="outline" className="w-full">
                      Voir le profil
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Conseils de sécurité
            </h4>
            <ul className="space-y-1 list-disc pl-4">
              <li>Rencontrez le vendeur dans un lieu public.</li>
              <li>Vérifiez l'article avant d'acheter.</li>
              <li>Ne payez jamais d'avance (transfert d'argent).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}