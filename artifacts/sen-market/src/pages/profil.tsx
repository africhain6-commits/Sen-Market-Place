import { useRoute, Link } from "wouter";
import { useGetUser, getGetUserQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Box, MessageCircle, Phone } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Profil() {
  const [, params] = useRoute("/profil/:id");
  const userId = params?.id ? parseInt(params.id) : 0;

  const { data: user, isLoading: isLoadingUser } = useGetUser(userId, {
    query: {
      enabled: !!userId,
      queryKey: getGetUserQueryKey(userId),
    }
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-primary/5 rounded-xl p-8 border mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
          <AvatarImage src={user.avatarUrl || ""} />
          <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
          
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
          </div>
        </div>
      </div>

      <Card>
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
    </div>
  );
}