import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateListing } from "@workspace/api-client-react";
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

const CATEGORIES = ["Immobilier", "Véhicules", "Emplois", "Services", "Électronique", "Maison & Jardin"];
const CITIES = ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Kaolack", "Mbour", "Touba", "Diourbel", "Louga", "Tambacounda"];

const publishSchema = z.object({
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères.").max(100, "Titre trop long."),
  description: z.string().min(20, "La description doit contenir au moins 20 caractères."),
  price: z.coerce.number().optional(),
  category: z.string().min(1, "Veuillez sélectionner une catégorie."),
  city: z.string().min(1, "Veuillez sélectionner une ville."),
  photos: z.string().optional(),
});

type PublishFormValues = z.infer<typeof publishSchema>;

export default function Publier() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour publier une annonce.",
      });
      setLocation("/connexion");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  const form = useForm<PublishFormValues>({
    resolver: zodResolver(publishSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      city: "",
      photos: "",
    },
  });

  const createListingMutation = useCreateListing({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/listings/my-listings"] });
        toast({
          title: "Annonce publiée !",
          description: "Votre annonce est maintenant en ligne.",
        });
        setLocation(`/annonces/${data.id}`);
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
    const photosArray = data.photos 
      ? data.photos.split(",").map(url => url.trim()).filter(url => url.length > 0)
      : [];

    createListingMutation.mutate({
      data: {
        title: data.title,
        description: data.description,
        price: data.price ? Number(data.price) : undefined,
        category: data.category,
        city: data.city,
        photos: photosArray.length > 0 ? photosArray : undefined,
      }
    });
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Publier une annonce</CardTitle>
          <CardDescription>Remplissez les informations ci-dessous pour mettre votre bien en ligne.</CardDescription>
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
                      <FormLabel>Prix (XOF)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 500000" {...field} data-testid="input-price" />
                      </FormControl>
                      <FormDescription>Laissez vide si prix sur demande.</FormDescription>
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
                          placeholder="Décrivez votre bien en détail..." 
                          className="min-h-[150px]"
                          {...field} 
                          data-testid="input-description" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="photos"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>URLs des photos (séparées par des virgules)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..., https://..." {...field} data-testid="input-photos" />
                      </FormControl>
                      <FormDescription>
                        Pour cet exercice, veuillez fournir des URLs d'images valides.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4 border-t gap-4">
                <Button type="button" variant="outline" onClick={() => setLocation("/")}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createListingMutation.isPending} data-testid="button-submit">
                  {createListingMutation.isPending ? "Publication..." : "Publier l'annonce"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}