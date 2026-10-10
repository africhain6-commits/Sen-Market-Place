import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";

type Region = {
  slug: string;
  name: string;
  tagline: string;
  image: string;
  search: string;
  intro: string[];
  highlights: { title: string; text: string }[];
};

const REGIONS: Region[] = [
  {
    slug: "dakar",
    name: "Dakar",
    tagline: "La capitale, entre océan et modernité",
    image: "/senegal/dakar.jpg",
    search: "Dakar",
    intro: [
      "Dakar est la capitale du Sénégal. Elle se trouve sur la presqu'île du Cap-Vert, le point le plus à l'ouest de l'Afrique continentale. C'est le centre économique, administratif et culturel du pays.",
      "La ville est vivante jour et nuit : marchés animés, vie artistique, restaurants, plages et quartiers résidentiels très recherchés comme les Almadies, Mermoz, Ouakam ou le Plateau. C'est ici que la demande en logements, bureaux et services est la plus forte.",
    ],
    highlights: [
      { title: "Monument de la Renaissance africaine", text: "Une statue géante qui domine la ville, avec une vue superbe depuis le haut." },
      { title: "Le marché Sandaga", text: "Tissus, artisanat, vêtements : le grand marché populaire du centre-ville." },
      { title: "La Corniche et les plages", text: "Promenades en bord de mer, surf et couchers de soleil aux Almadies." },
      { title: "Île de Ngor", text: "Une petite île à quelques minutes en pirogue, calme et pleine de charme." },
      { title: "Musée des Civilisations noires", text: "Un grand musée moderne sur l'histoire et les cultures africaines." },
      { title: "Le Lac Rose", text: "Un lac aux eaux rosées, à environ une heure de route de la ville." },
    ],
  },
  {
    slug: "goree",
    name: "Île de Gorée",
    tagline: "Ruelles colorées et mémoire de l'histoire",
    image: "/senegal/goree.jpg",
    search: "Gorée",
    intro: [
      "Gorée est une petite île située face à Dakar. On y accède en une vingtaine de minutes de bateau depuis le port de la capitale. Elle est classée au patrimoine mondial de l'UNESCO.",
      "Il n'y a pas de voitures sur l'île : on se promène à pied dans des ruelles de sable, entre maisons colorées, bougainvilliers et petits ateliers d'artistes. C'est un lieu de mémoire, mais aussi un endroit calme et très agréable pour une journée.",
    ],
    highlights: [
      { title: "La Maison des Esclaves", text: "Le lieu le plus connu de l'île, symbole de l'histoire de la traite négrière." },
      { title: "Les ruelles colorées", text: "Des maisons anciennes aux couleurs vives, idéales pour la photo." },
      { title: "Le Fort d'Estrées", text: "Un ancien fort qui abrite aujourd'hui un musée d'histoire." },
      { title: "Les artisans et artistes", text: "Peintres, sculpteurs et vendeurs d'objets faits main sur la place et dans les ruelles." },
      { title: "La petite plage", text: "Un coin tranquille pour se baigner ou se reposer." },
      { title: "Les restaurants du port", text: "Poisson frais et plats sénégalais face à la mer." },
    ],
  },
  {
    slug: "saint-louis",
    name: "Saint-Louis",
    tagline: "L'ancienne capitale, ville d'histoire et de fleuve",
    image: "/senegal/saint-louis.jpg",
    search: "Saint-Louis",
    intro: [
      "Saint-Louis est située au nord du pays, à environ 260 km de Dakar, à l'embouchure du fleuve Sénégal. Elle a été une capitale pendant la période coloniale et son centre historique, construit sur une île, est classé à l'UNESCO.",
      "La ville est connue pour son architecture ancienne, ses balcons en fer forgé, ses pirogues colorées et son ambiance paisible. Elle accueille chaque année un célèbre festival de jazz.",
    ],
    highlights: [
      { title: "Le pont Faidherbe", text: "Le grand pont en métal qui relie l'île au reste de la ville." },
      { title: "L'île et ses maisons coloniales", text: "Se promener dans les rues du centre historique est déjà une visite." },
      { title: "Guet Ndar et les pirogues", text: "Un quartier de pêcheurs très vivant, avec des centaines de pirogues peintes." },
      { title: "La Langue de Barbarie", text: "Une longue bande de sable entre le fleuve et l'océan, avec des plages et des oiseaux." },
      { title: "Le Parc du Djoudj", text: "Un grand parc d'oiseaux migrateurs, à une heure et demie environ de la ville." },
      { title: "Saint-Louis Jazz", text: "Un festival de musique qui attire des visiteurs de tout le pays et de l'étranger." },
    ],
  },
  {
    slug: "saly",
    name: "Saly",
    tagline: "Plages, hôtels et douceur de vivre",
    image: "/senegal/saly.jpg",
    search: "Saly",
    intro: [
      "Saly est la grande station balnéaire du Sénégal, sur la Petite Côte, à environ 80 km de Dakar, près de la ville de Mbour. Le climat est doux presque toute l'année, avec de longues plages de sable et des palmiers.",
      "C'est une zone très prisée pour les vacances et les résidences secondaires : hôtels, résidences, restaurants, golf et activités nautiques. On y trouve beaucoup d'annonces de villas, d'appartements et de locations de courte durée.",
    ],
    highlights: [
      { title: "Les plages de la Petite Côte", text: "Sable fin, eau chaude et ambiance détendue." },
      { title: "Les activités nautiques", text: "Promenade en bateau, pêche, jet-ski ou simple baignade." },
      { title: "Le marché artisanal", text: "Souvenirs, tissus et objets faits main à rapporter." },
      { title: "Mbour et son port de pêche", text: "Le retour des pirogues, en fin de journée, est un vrai spectacle." },
      { title: "Joal-Fadiouth", text: "Une île construite en coquillages, accessible par un pont en bois." },
      { title: "La Réserve de Bandia", text: "À proximité, pour un safari d'une demi-journée." },
    ],
  },
  {
    slug: "casamance",
    name: "Casamance",
    tagline: "Mangroves, forêts et villages au bord de l'eau",
    image: "/senegal/casamance.jpg",
    search: "Casamance",
    intro: [
      "La Casamance est la région verte du sud du Sénégal, autour de la ville de Ziguinchor. Elle reçoit plus de pluie que le reste du pays, ce qui donne des forêts, des rizières et de grandes mangroves traversées par le fleuve Casamance.",
      "La région est aussi connue pour ses cultures locales, notamment celle des Diolas, ses villages calmes et ses plages presque désertes. C'est une destination pour les gens qui aiment la nature et le voyage lent.",
    ],
    highlights: [
      { title: "Ziguinchor", text: "La grande ville de la région, au bord du fleuve, avec ses marchés et son port." },
      { title: "Cap Skirring", text: "La plus belle station balnéaire du sud, avec de longues plages de sable blanc." },
      { title: "Les mangroves en pirogue", text: "Une balade calme au milieu des canaux et des oiseaux." },
      { title: "L'île de Carabane", text: "Une petite île chargée d'histoire, accessible en bateau." },
      { title: "Oussouye et les villages diolas", text: "Des maisons à étage en terre, des traditions vivantes." },
      { title: "Kafountine", text: "Un village de pêcheurs animé, connu pour ses plages et le poisson fumé." },
    ],
  },
  {
    slug: "bandia",
    name: "Réserve de Bandia",
    tagline: "Un safari et des baobabs à portée de Dakar",
    image: "/senegal/bandia.jpg",
    search: "Bandia",
    intro: [
      "La Réserve de Bandia est une réserve privée de plusieurs milliers d'hectares, à environ une heure de route de Dakar, près de Mbour et de Saly. On y circule en véhicule safari pour observer les animaux de près.",
      "On peut y voir des girafes, des rhinocéros, des zèbres, des buffles, des antilopes et des crocodiles, au milieu de baobabs très anciens. C'est une sortie facile à faire en une demi-journée, en famille ou avec des amis.",
    ],
    highlights: [
      { title: "Le safari en véhicule", text: "Un guide vous emmène au plus près des animaux, en toute sécurité." },
      { title: "Les girafes et les rhinocéros", text: "Les animaux les plus attendus par les visiteurs." },
      { title: "Les baobabs géants", text: "Certains arbres sont centenaires et impressionnants de taille." },
      { title: "Les crocodiles", text: "Un coin de la réserve où l'on peut les observer en sécurité." },
      { title: "Le restaurant sur place", text: "Pour faire une pause à l'ombre pendant la visite." },
      { title: "Un combiné avec Saly ou Mbour", text: "Facile à ajouter à un séjour balnéaire sur la Petite Côte." },
    ],
  },
];

export default function RegionPage() {
  const params = useParams<{ slug: string }>();
  const region = REGIONS.find((r) => r.slug === params.slug);

  if (!region) return <NotFound />;

  const q = encodeURIComponent(region.search);
  const others = REGIONS.filter((r) => r.slug !== region.slug);

  return (
    <div className="flex flex-col">
      {/* Grande photo */}
      <section className="relative h-60 md:h-96 bg-muted overflow-hidden">
        <img
          src={region.image}
          alt={region.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="container mx-auto px-4 pb-5 md:pb-8 text-white">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs md:text-sm text-white/80 hover:text-white mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Accueil
            </Link>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">{region.name}</h1>
            <p className="text-sm md:text-lg text-white/85 mt-1">{region.tagline}</p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Texte */}
        <section className="space-y-4">
          {region.intro.map((p, i) => (
            <p key={i} className="text-base md:text-lg text-foreground/90 leading-relaxed">
              {p}
            </p>
          ))}
        </section>

        {/* Boutons vers les annonces */}
        <section className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link href={`/annonces?search=${q}`}>
            <Button className="w-full sm:w-auto h-12 px-6 font-bold bg-[#D4AF37] text-[#0A2463] hover:bg-[#c9a430] border-0">
              Voir les annonces — {region.name}
            </Button>
          </Link>
          <Link href={`/annonces?category=Immobilier&search=${q}`}>
            <Button variant="outline" className="w-full sm:w-auto h-12 px-6 font-semibold">
              Immobilier à {region.name}
            </Button>
          </Link>
        </section>

        {/* À voir */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4">À voir et à faire</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {region.highlights.map((h) => (
              <div key={h.title} className="border rounded-lg p-4 bg-card">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 p-2 rounded-full bg-[#D4AF37]/15 text-[#0A2463] shrink-0">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-sm md:text-base">{h.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{h.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Autres régions */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4">Découvrir aussi</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {others.map((r) => (
              <Link
                key={r.slug}
                href={`/region/${r.slug}`}
                className="group relative block w-40 md:w-52 aspect-[3/2] shrink-0 overflow-hidden rounded-xl bg-muted"
              >
                <img
                  src={r.image}
                  alt={r.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute bottom-2 left-3 right-3 text-white font-bold text-sm leading-tight">
                  {r.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Appel à publier */}
        <section className="mt-10 rounded-xl bg-primary text-white p-6 text-center">
          <h2 className="text-lg md:text-xl font-bold">Vous vendez ou louez à {region.name} ?</h2>
          <p className="text-white/75 text-sm mt-1 mb-4">Publiez votre annonce gratuitement.</p>
          <Link href="/publier">
            <Button className="font-bold bg-[#D4AF37] text-[#0A2463] hover:bg-[#c9a430] border-0">
              Publier une annonce <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}
