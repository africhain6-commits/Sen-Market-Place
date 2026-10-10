
const categories: {
  id: string;
  short: string;
  icon: typeof HomeIcon;
  color: string;
  href: string;
  subs: Sub[];
}[] = [
  {
    id: "Immobilier", short: "Immobilier", icon: HomeIcon,
    color: "bg-blue-100 text-blue-600",
    href: "/annonces?category=Immobilier",
    subs: [
      { label: "Nouveaux projets", href: "/projets" },
      "Appartements",
      "Studios",
      { label: "1 chambre", search: "1 chambre" },
      { label: "2 chambres", search: "2 chambres" },
      { label: "3 chambres et plus", search: "3 chambres" },
      "Villas",
      "Maisons",
      "Terrains",
      { label: "Bureaux & commerces", search: "bureau" },
      "Colocation",
      "Location",
      "Vente",
    ],
  },
  {
    id: "Véhicules", short: "Véhicules", icon: Car,
    color: "bg-red-100 text-red-600",
    href: "/annonces?category=Véhicules",
    subs: [
      "Voitures",
      { label: "Voitures d'occasion", search: "occasion" },
      { label: "Voitures neuves", search: "neuve" },
      "Motos",
      "Camions",
      "Pièces détachées",
      { label: "Location de voitures", search: "location" },
    ],
  },
  {
    id: "Emplois", short: "Emplois", icon: Briefcase,
    color: "bg-green-100 text-green-600",
    href: "/annonces?category=Emplois",
    subs: [
      { label: "Offres d'emploi", search: "recrute" },
      { label: "Recherche d'emploi - CV", search: "CV" },
      "Temps plein",
      "Freelance",
      "Stage",
      "Petits boulots",
    ],
  },
  {
    id: "Électronique", short: "Électronique", icon: Smartphone,
    color: "bg-amber-100 text-amber-600",
    href: "/annonces?category=Électronique",
    subs: [
      { label: "Téléphones & tablettes", search: "téléphone" },
      "Ordinateurs",
      { label: "TV & vidéo", search: "TV" },
      { label: "Consoles & jeux vidéo", search: "console" },
      { label: "Audio & musique", search: "audio" },
      { label: "Écouteurs & casques", search: "écouteurs" },
      { label: "Caméras & appareils photo", search: "caméra" },
      { label: "Sécurité & surveillance", search: "surveillance" },
      { label: "Réseau", search: "routeur" },
      { label: "Imprimantes & scanners", search: "imprimante" },
      { label: "Écrans d'ordinateur", search: "écran" },
      { label: "Composants informatiques", search: "composant" },
      "Accessoires",
      "Logiciels",
    ],
  },
  {
    id: "Services", short: "Services", icon: Wrench,
    color: "bg-purple-100 text-purple-600",
    href: "/annonces?category=Services",
    subs: [
      { label: "Construction & métiers", search: "construction" },
      { label: "Services auto", search: "auto" },
      { label: "Services informatiques", search: "informatique" },
      { label: "Réparation", search: "réparation" },
      { label: "Nettoyage", search: "nettoyage" },
      { label: "Impression", search: "impression" },
      { label: "Logistique & livraison", search: "livraison" },
      { label: "Juridique", search: "juridique" },
      { label: "Fiscalité & finance", search: "fiscalité" },
      { label: "Recrutement", search: "recrutement" },
      { label: "Location", search: "location" },
      { label: "Chauffeur & transfert aéroport", search: "chauffeur" },
      { label: "Voyages & circuits", search: "voyage" },
      { label: "Cours & classes", search: "cours" },
      { label: "Garde d'enfants", search: "garde" },
      { label: "Santé & beauté", search: "beauté" },
    ],
  },
  {
    id: "Maison & Jardin", short: "Maison", icon: Trees,
    color: "bg-emerald-100 text-emerald-600",
    href: "/annonces?category=Maison%20%26%20Jardin",
    subs: [
      "Meubles",
      "Électroménager",
      "Décoration",
      "Jardinage",
      { label: "Réparation & construction", search: "construction" },
      { label: "Équipement & outils pro", search: "outils" },
    ],
  },
  {
    id: "Boutiques & Couturiers", short: "Boutiques", icon: Scissors,
    color: "bg-pink-100 text-pink-600",
    href: "/boutiques",
    subs: [
      "Mode femme",
      "Mode homme",
      "Couture sur mesure",
      "Tissus & Bazin",
      { label: "Beauté & soins personnels", search: "beauté" },
      { label: "Bébés & enfants", search: "bébé" },
    ],
  },
  {
    id: "Animaux & Compagnie", short: "Animaux", icon: PawPrint,
    color: "bg-orange-100 text-orange-600",
    href: "/annonces?category=Animaux%20%26%20Compagnie",
    subs: [
      { label: "Chiens & chiots", search: "chien" },
      { label: "Chats & chatons", search: "chat" },
      "Oiseaux",
      "Poissons",
      { label: "Autres animaux", search: "animal" },
      { label: "Accessoires pour animaux", search: "accessoires" },
      { label: "Services animaliers", search: "vétérinaire" },
    ],
  },
];

// Rangée du téléphone : « Projets » juste après Immobilier
const PROJECT_CHIP = {
  id: "Projets",
  short: "Projets",
  icon: Building2,
  color: "bg-sky-100 text-sky-600",
  href: "/projets",
};
const chips = [categories[0], PROJECT_CHIP, ...categories.slice(1)];
