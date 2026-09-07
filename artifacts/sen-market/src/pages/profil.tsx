import { useRoute, Link } from "wouter";
import { useGetUser, getGetUserQueryKey, useGetUserReviews, getGetUserReviewsQueryKey, useCreateReview } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Calendar, Box, MessageCircle, Phone, Star, Mail, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          disabled={!onChange}
        >
          <Star
            className={`w-5 h-5 ${(hover || value) >= star ? "fill-[#D4AF37] text-[#D4AF37]" : "text-muted-foreground"}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function Profil() {
  const [, params] = useRoute("/profil/:id");
  const [, navigate] = useLocation();
  const userId = params?.id ? parseInt(params.id) : 0;
  const { user: currentUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data: user, isLoading: isLoadingUser } = useGetUser(userId, {
    query: {
      enabled: !!userId,
      queryKey: getGetUserQueryKey(userId),
    }
  });

  const { data: reviews, isLoading: isLoadingReviews } = useGetUserReviews(userId, {
    query: {
      enabled: !!userId,
      queryKey: getGetUserReviewsQueryKey(userId),
    }
  });

  const createReview = useCreateReview({
    mutation: {
      onSuccess: () => {
        toast({ title: "Avis publié !", description: "Merci pour votre évaluation." });
        setRating(0);
        setComment("");
        queryClient.invalidateQueries({ queryKey: getGetUserReviewsQueryKey(userId) });
      },
      onError: () => {
        toast({ title: "Erreur", description: "Impossible de publier votre avis.", variant: "destructive" });
      },
    },
  });

  if (isLoadingUser) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-48 w-full rounded-xl mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Utilisateur introuvable</h1>
        <p className="text-muted-foreground">Ce profil n'existe pas ou a été supprimé.</p>
      </div>
    );
  }

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    : null;
  const isOwnProfile = currentUser?.id === userId;
  const alreadyReviewed = reviews?.some((r: any) => r.fromUser?.id === currentUser?.id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>
      <div className="bg-primary/5 rounded-xl p-8 border mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
          <AvatarImage src={user.avatarUrl || ""} />
          <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
            {user.name?.charAt(0)?.toUpperCase() || "?"}          </AvatarFallback>
        </Avatar>
        
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-3xl font-bold mb-1">{user.name}</h1>

          {avgRating !== null && (
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
              <StarRating value={Math.round(avgRating)} />
              <span className="text-sm text-muted-foreground">
                {avgRating.toFixed(1)} ({reviews!.length} avis)
              </span>
            </div>
          )}
          
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-muted-foreground mt-4">
            {user.city && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{user.city}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Membre depuis {format(new Date(user.createdAt), "MMMM yyyy", { locale: fr })}</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-4">
            {user.whatsapp && (
              <a
                href={`https://wa.me/${user.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="profil-whatsapp"
              >
                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
              </a>
            )}
            {user.phone && (
              <a href={`tel:${user.phone}`} data-testid="profil-phone">
                <Button size="sm" variant="outline" className="gap-2">
                  <Phone className="w-4 h-4" />
                  {user.phone}
                </Button>
              </a>
            )}
            {user.email && (
              <a href={`mailto:${user.email}`} data-testid="profil-email">
                <Button size="sm" variant="outline" className="gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="w-5 h-5" />
            Annonces de l'utilisateur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
            <p>Pour consulter les annonces de cet utilisateur, veuillez utiliser la barre de recherche principale.</p>
            <Link href="/annonces">
              <Button variant="outline" className="mt-4">Rechercher des annonces</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Avis des acheteurs
            {reviews && reviews.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-1">({reviews.length})</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingReviews ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <div key={review.id} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {review.fromUser?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium text-sm">{review.fromUser?.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(review.createdAt), { locale: fr, addSuffix: true })}
                        </span>
                      </div>
                      <StarRating value={review.rating} />
                      {review.comment && (
                        <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">Aucun avis pour le moment.</p>
          )}

          {isAuthenticated && !isOwnProfile && !alreadyReviewed && (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3">Laisser un avis</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Note</label>
                  <StarRating value={rating} onChange={setRating} />
                </div>
                <Textarea
                  placeholder="Votre commentaire (optionnel)..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                />
                <Button
                  disabled={rating === 0 || createReview.isPending}
                  onClick={() => createReview.mutate({ data: { toUserId: userId, rating, comment: comment || undefined } })}
                >
                  Publier mon avis
                </Button>
              </div>
            </div>
          )}
          {alreadyReviewed && (
            <p className="text-sm text-muted-foreground text-center pt-2">Vous avez déjà laissé un avis.</p>
          )}
          {!isAuthenticated && (
            <div className="border-t pt-4 text-center">
              <Link href="/connexion">
                <Button variant="outline" size="sm">Connectez-vous pour laisser un avis</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
