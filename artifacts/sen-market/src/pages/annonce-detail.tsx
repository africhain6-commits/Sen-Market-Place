import { useState, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetListing, useSendMessage, getGetListingQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, ShieldCheck, Mail, AlertCircle, Home as HomeIcon, MessageCircle, ArrowLeft, ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
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
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
  const photos: string[] = listing.photos ?? [];

  const prevPhoto = () => setCurrentPhoto((i) => (i === 0 ? Math.max(photos.length - 1, 0) : i - 1));
  const nextPhoto = () => setCurrentPhoto((i) => (i === photos.length - 1 ? 0 : i + 1));

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
            {photos.length > 0 ? (
              <>
                {/* Main photo with arrows */}
                <div className="aspect-[4/3] sm:aspect-video relative bg-muted group cursor-zoom-in" onClick={() => setLightboxOpen(true)}>
                  <img
                    src={photos[currentPhoto]}
                    alt={`${listing.title} — photo ${currentPhoto + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Zoom hint */}
                  <div className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100 active:opacity-100"
                        aria-label="Photo précédente"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100 active:opacity-100"
                        aria-label="Photo suivante"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      {/* Counter */}
                      <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                        {currentPhoto + 1} / {photos.length}
                      </div>
                    </>
                  )}
                </div>
                {/* Thumbnails */}
                {photos.length > 1 && (
                  <div className="flex p-3 gap-2 overflow-x-auto border-t bg-muted/20">
                    {photos.map((photo, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPhoto(i)}
                        className={`shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${i === currentPhoto ? "border-primary shadow-md scale-105" : "border-transparent hover:border-primary/50 opacity-70 hover:opacity-100"}`}
                        aria-label={`Voir photo ${i + 1}`}
                      >
                        <img src={photo} alt={`Miniature ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-[4/3] sm:aspect-video relative bg-muted flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <HomeIcon className="w-16 h-16 mx-auto mb-2 opacity-20" />
                  <p>Aucune photo disponible</p>
                </div>
              </div>
            )}
          </div>

          {/* Lightbox */}
          {lightboxOpen && photos.length > 0 && (
            <div
              className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
              onClick={() => setLightboxOpen(false)}
            >
              <button
                className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 z-10"
                onClick={() => setLightboxOpen(false)}
                aria-label="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
                {currentPhoto + 1} / {photos.length}
              </div>
              {photos.length > 1 && (
                <>
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/25 rounded-full p-3 z-10"
                    onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                    aria-label="Photo précédente"
                  >
                    <ChevronLeft className="w-7 h-7" />
                  </button>
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/25 rounded-full p-3 z-10"
                    onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                    aria-label="Photo suivante"
                  >
                    <ChevronRight className="w-7 h-7" />
                  </button>
                </>
              )}
              <img
                src={photos[currentPhoto]}
                alt={`${listing.title} — photo ${currentPhoto + 1}`}
                className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              {/* Thumbnail strip */}
              {photos.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[80vw] p-1">
                  {photos.map((photo, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setCurrentPhoto(i); }}
                      className={`shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all ${i === currentPhoto ? "border-white" : "border-white/30 opacity-60 hover:opacity-100"}`}
                    >
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

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