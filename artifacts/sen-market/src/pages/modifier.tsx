import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRoute, useLocation } from "wouter";
import { useGetListing, useUpdateListing, getGetMyListingsQueryKey, getGetListingQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { PhotoUploader } from "@/components/photo-uploader";

const CATEGORIES = ["Immobilier", "Véhicules", "Emplois", "Services", "Électronique", "Maison & Jardin"];
const CITIES = ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Kaolack", "Mbour", "Touba", "Diourbel", "Louga", "Tambacounda"];

function parseFrenchPrice(val: string): number | undefined {
  if (!val || val.trim() === "") return undefined;
  const cleaned = val.trim().replace(/[\s.]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

const editSchema = z.object({
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères.").max(100, "Titre trop long."),
  description: z.string().min(20, "La description doit contenir au moins 20 caractères."),
  price: z.string().optional(),
  category: z.string().min(1, "Veuillez sélectionner une catégorie."),
  city: z.string().min(1, "Veuillez sélectionner une ville."),
});

type EditFormValues = z.infer<typeof editSchema>;

export default function Modifier() {
  const [, params] = useRoute("/modifier/:id");
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const id = params?.id ? parseInt(params.id, 10) : null;

  const { data: listing, isLoading: isLoadingListing } = useGetListing(id ?? 0, {
    query: { queryKey: getGetListingQueryKey(id ?? 0), enabled: !!id }
  });

  const [photos, setPhotos] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { title: "", description: "", category: "", city: "" },
  });

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation("/connexion");
    }
  }, [isAuthLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (listing && !initialized) {
      form.reset({
        title: listing.title,
        description: listing.description,
        category: listing.category,
        city: listing.city,
        price: listing.price ? String(listing.price) : "",
      });
      setPhotos((listing.photos as string[]) ?? []);
      setInitialized(true);
    }
  }, [listing, initialized, form]);

  useEffect(() => {
    if (listing && user && listing.userId !== user.id) {
      toast({ title: "Accès interdit", description: "Vous ne pouvez modifier que vos propres annonces.", variant: "destructive" });
      setLocation("/tableau-de-bord");
    }
  }, [listing, user, setLocation]);

  const updateMutation = useUpdateListing({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyListingsQueryKey() });
        toast({ title: "Annonce modifiée !", description: "Vos modifications ont été enregistrées. L'annonce sera re-vérifiée si nécessaire." });
        setLocation("/tableau-de-bord");
      },
      onError: () => {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de modifier l'annonce." });
      },
    },
  });

  const onSubmit = (data: EditFormValues) => {
    if (!id) return;
    const parsedPrice = data.price ? parseFrenchPrice(data.price) : undefined;
    if (data.price && data.price.trim() !== "" && (parsedPrice === undefined || parsedPrice <= 0)) {
      form.setError("price", { message: "Le prix doit être un nombre positif." });
      return;
    }
    updateMutation.mutate({
      id,
      data: {
        title: data.title,
        description: data.description,
        price: parsedPrice,
        category: data.category,
        city: data.city,
        photos: photos.length > 0 ? photos : undefined,
      },
    });
  };

  if (isAuthLoading || !isAuthenticated) return null;

  if (isLoadingListing || !initialized) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Modifier l'annonce</CardTitle>
          <CardDescription>Modifiez les informations de votre annonce.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Titre de l'annonce *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: iPhone 13 Pro Max 256Go" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix (FCFA)</FormLabel>
                      <FormControl>
                        <Input type="text" inputMode="numeric" placeholder="Ex: 5.800.000 ou 5800000" {...field} />
                      </FormControl>
                      <FormDescription>Formats acceptés : 5800000 · 5.800.000 · 5 800 000. Laissez vide si prix sur demande.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="hidden md:block" />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Décrivez votre bien en détail..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <label className="text-sm font-medium leading-none">Photos (jusqu'à 10)</label>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    La première photo sera utilisée comme photo principale.
                  </p>
                  <PhotoUploader photos={photos} onChange={setPhotos} maxPhotos={10} />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t gap-4">
                <Button type="button" variant="outline" onClick={() => setLocation("/tableau-de-bord")}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-[#D4AF37] text-[#0A2463] hover:bg-[#c9a430] border-0"
                >
                  {updateMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
