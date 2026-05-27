import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateListing, getGetMyListingsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { PhotoUploader } from "@/components/photo-uploader";
import { Info } from "lucide-react";

const CATEGORIES = ["Immobilier", "Véhicules", "Emplois", "Services", "Électronique", "Maison & Jardin"];
const CITIES = ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Kaolack", "Mbour", "Touba", "Diourbel", "Louga", "Tambacounda"];

function parseFrenchPrice(val: string): number | undefined {
  if (!val || val.trim() === "") return undefined;
  const cleaned = val.trim().replace(/[\s.]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

const publishSchema = z.object({
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères.").max(100, "Titre trop long."),
  description: z.string().min(20, "La description doit contenir au moins 20 caractères."),
  price: z.string().optional().transform((val) => {
    if (!val || val.trim() === "") return undefined;
    const parsed = parseFrenchPrice(val);
    return parsed;
  }).pipe(z.number().positive("Le prix doit être positif.").optional()),
  category: z.string().min(1, "Veuillez sélectionner une catégorie."),
  city: z.string().min(1, "Veuillez sélectionner une ville."),
});

type PublishFormValues = z.infer<typeof publishSchema>;

export default function Publier() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, isFetching } = useAuth();
  const queryClient = useQueryClient();
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading && !isFetching && !isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour publier une annonce.",
      });
      setLocation("/connexion");
    }
  }, [isLoading, isFetching, isAuthenticated, setLocation]);

  const form = useForm<PublishFormValues>({
    resolver: zodResolver(publishSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      city: "",
    },
  });

  const createListingMutation = useCreateListing({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyListingsQueryKey() });
        toast({
          title: "Annonce envoyée en modération",
          description: "Votre annonce sera publiée après validation par notre équipe.",
        });
        setLocation("/tableau-de-bord");
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message || "Impossible de publier l'annonce.",
        });
      }
    }
  });

  const onSubmit = (data: PublishFormValues) => {
    createListingMutation.mutate({
      data: {
        title: data.title,
        description: data.description,
        price: data.price ? Number(data.price) : undefined,
        category: data.category,
        city: data.city,
        photos: photos.length > 0 ? photos : undefined,
      }
    });
  };

  if (isLoading || isFetching || !isAuthenticated) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Publier une annonce</CardTitle>
          <CardDescription>Remplissez les informations ci-dessous pour mettre votre bien en ligne.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Moderation notice */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong>Modération :</strong> Votre annonce sera vérifiée par notre équipe avant d'être visible sur la plateforme. Délai habituel : quelques heures.
            </div>
          </div>

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
                        <Input placeholder="Ex: iPhone 13 Pro Max 256Go" {...field} data-testid="input-title" />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-city">
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
                        <Input type="text" inputMode="numeric" placeholder="Ex: 5.800.000 ou 5800000" {...field} data-testid="input-price" />
                      </FormControl>
                      <FormDescription>Formats acceptés : 5800000 · 5.800.000 · 5 800 000. Laissez vide si prix sur demande.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="hidden md:block"></div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Décrivez votre bien en détail (état, caractéristiques, conditions de vente...)"
                          className="min-h-[150px]"
                          {...field}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <label className="text-sm font-medium leading-none">Photos (jusqu'à 10)</label>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    La première photo sera utilisée comme photo principale. Formats acceptés : JPG, PNG, WebP.
                  </p>
                  <PhotoUploader
                    photos={photos}
                    onChange={setPhotos}
                    maxPhotos={10}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t gap-4">
                <Button type="button" variant="outline" onClick={() => setLocation("/")}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={createListingMutation.isPending}
                  className="bg-[#D4AF37] text-[#0A2463] hover:bg-[#c9a430] border-0"
                  data-testid="button-submit"
                >
                  {createListingMutation.isPending ? "Publication..." : "Soumettre l'annonce"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
