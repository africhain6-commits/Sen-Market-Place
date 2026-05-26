import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, TrendingUp, Users, Eye, Star, Mail, Phone } from "lucide-react";

const packages = [
  {
    name: "Starter",
    price: "15 000",
    period: "/ semaine",
    color: "border-blue-200 bg-blue-50/50",
    badge: "",
    features: [
      "1 annonce en vedette",
      "Mise en avant 7 jours",
      "Badge 'Vérifié'",
      "Visibilité dans les résultats de recherche",
    ],
  },
  {
    name: "Business",
    price: "45 000",
    period: "/ mois",
    color: "border-[#D4AF37] bg-[#D4AF37]/5 shadow-lg scale-105",
    badge: "Populaire",
    features: [
      "3 annonces en vedette",
      "Mise en avant 30 jours",
      "Badge 'Business'",
      "Position prioritaire dans la recherche",
      "Bannière sur la page d'accueil",
      "Statistiques détaillées",
    ],
  },
  {
    name: "Premium",
    price: "120 000",
    period: "/ trimestre",
    color: "border-purple-200 bg-purple-50/50",
    badge: "Meilleure valeur",
    features: [
      "10 annonces en vedette",
      "Mise en avant 90 jours",
      "Badge 'Premium'",
      "Position #1 garantie",
      "Bannière sur toutes les pages",
      "Statistiques avancées",
      "Support dédié",
      "Page boutique personnalisée",
    ],
  },
];

const stats = [
  { value: "50 000+", label: "Visiteurs par mois", icon: Users },
  { value: "200 000+", label: "Pages vues mensuelles", icon: Eye },
  { value: "5 000+", label: "Annonces actives", icon: Star },
  { value: "95%", label: "Taux de satisfaction", icon: TrendingUp },
];

export default function Pub() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section
        className="relative py-20 md:py-28 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0A2463 0%, #1a3a80 60%, #2a4a90 100%)" }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#D4AF37] translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-[#D4AF37] -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/20 text-[#D4AF37] px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-[#D4AF37]/30">
            <TrendingUp className="w-4 h-4" />
            Boostez votre visibilité
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            Faites connaître votre<br />
            <span className="text-[#D4AF37]">business au Sénégal</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Touchez des milliers d'acheteurs qualifiés chaque jour. Des offres publicitaires adaptées à chaque budget.
          </p>
          <a href="mailto:pub@senmarket.sn">
            <Button size="lg" className="h-14 px-8 text-base bg-[#D4AF37] text-[#0A2463] hover:bg-[#c9a430] border-0 font-bold">
              <Mail className="w-5 h-5 mr-2" />
              Nous contacter
            </Button>
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Nos offres publicitaires</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Choisissez le forfait qui correspond à vos besoins. Tous les prix sont en Francs CFA (FCFA).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {packages.map((pkg) => (
              <Card key={pkg.name} className={`relative border-2 ${pkg.color} transition-all`}>
                {pkg.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#D4AF37] text-[#0A2463] text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      {pkg.badge}
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-2 pt-6">
                  <CardTitle className="text-2xl font-bold">{pkg.name}</CardTitle>
                  <div className="mt-3">
                    <span className="text-4xl font-bold text-primary">{pkg.price}</span>
                    <span className="text-muted-foreground text-sm ml-1">FCFA {pkg.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a href="mailto:pub@senmarket.sn">
                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Choisir {pkg.name}
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pourquoi SenMarket */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Pourquoi choisir SenMarket ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="p-4 rounded-full bg-blue-100 text-blue-600 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Audience qualifiée</h3>
              <p className="text-muted-foreground">Des visiteurs qui cherchent activement à acheter ou commander. Taux de conversion optimal pour vos annonces.</p>
            </div>
            <div className="text-center p-6">
              <div className="p-4 rounded-full bg-green-100 text-green-600 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Croissance rapide</h3>
              <p className="text-muted-foreground">Notre plateforme est en pleine expansion. Soyez parmi les premiers à profiter de cette visibilité au Sénégal.</p>
            </div>
            <div className="text-center p-6">
              <div className="p-4 rounded-full bg-amber-100 text-amber-600 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Simple &amp; efficace</h3>
              <p className="text-muted-foreground">Mise en ligne immédiate de vos annonces. Interface intuitive, support réactif, résultats mesurables.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Prêt à développer votre activité ?</h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Contactez notre équipe commerciale pour un devis personnalisé ou pour toute question sur nos offres.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:africhain6@gmail.com">
              <Button size="lg" className="h-14 px-8 bg-[#D4AF37] text-[#0A2463] hover:bg-[#c9a430] border-0 font-bold">
                <Mail className="w-5 h-5 mr-2" />
                africhain6@gmail.com
              </Button>
            </a>
            <a href="tel:+221773579701">
              <Button size="lg" variant="outline" className="h-14 px-8 text-white border-white/50 hover:bg-white/10 hover:text-white">
                <Phone className="w-5 h-5 mr-2" />
                +221 77 357 97 01
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
