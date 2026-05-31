import { Link } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-[#0A2463]/10 rounded-lg">
            <Shield className="w-6 h-6 text-[#0A2463]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#0A2463]">Politique de Confidentialité</h1>
            <p className="text-sm text-muted-foreground mt-1">Dernière mise à jour : 1er juin 2026</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 text-foreground">

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              SenMarket ("nous", "notre", "nos") s'engage à protéger votre vie privée. La présente Politique de
              Confidentialité décrit comment nous collectons, utilisons et protégeons vos informations personnelles
              lorsque vous utilisez notre plateforme d'annonces en ligne disponible sur le web et sur l'application
              mobile SenMarket.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              En utilisant SenMarket, vous acceptez les pratiques décrites dans la présente politique.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">2. Données collectées</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">Nous collectons les informations suivantes :</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Données d'inscription :</strong> nom, adresse e-mail, numéro de téléphone, ville</li>
              <li><strong>Données de profil :</strong> numéro WhatsApp, photo de profil (facultative)</li>
              <li><strong>Données d'annonces :</strong> titre, description, prix, catégorie, photos, localisation</li>
              <li><strong>Données de messagerie :</strong> messages échangés entre utilisateurs</li>
              <li><strong>Données techniques :</strong> adresse IP, type d'appareil, système d'exploitation, journaux d'activité</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">3. Utilisation des données</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">Vos données sont utilisées pour :</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Créer et gérer votre compte utilisateur</li>
              <li>Publier et afficher vos annonces</li>
              <li>Permettre la communication entre acheteurs et vendeurs</li>
              <li>Améliorer nos services et l'expérience utilisateur</li>
              <li>Prévenir la fraude et assurer la sécurité de la plateforme</li>
              <li>Envoyer des notifications liées à votre activité (alertes de recherche, messages reçus)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">4. Partage des données</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous ne vendons pas vos données personnelles à des tiers. Vos informations de contact (téléphone,
              WhatsApp) sont visibles par les autres utilisateurs sur vos annonces, conformément à votre
              consentement lors de l'inscription. Nous pouvons partager des données avec des prestataires
              techniques dans le cadre strict de l'exploitation du service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">5. Conservation des données</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vos données sont conservées tant que votre compte est actif. En cas de suppression de votre compte,
              vos données personnelles sont supprimées dans un délai de 30 jours, à l'exception des données requises
              par la loi sénégalaise (loi n° 2008-12 du 25 janvier 2008 sur la protection des données personnelles).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">6. Vos droits</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Conformément à la loi sénégalaise sur la protection des données personnelles, vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Droit d'accès :</strong> consulter les données que nous détenons sur vous</li>
              <li><strong>Droit de rectification :</strong> corriger vos informations personnelles</li>
              <li><strong>Droit à l'effacement :</strong> supprimer votre compte et vos données</li>
              <li><strong>Droit d'opposition :</strong> vous opposer à certains traitements de vos données</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Pour exercer ces droits, contactez-nous à : <strong>contact@senmarket.sn</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">7. Sécurité</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos
              données contre tout accès non autorisé, modification, divulgation ou destruction. Les mots de passe
              sont stockés sous forme chiffrée (bcrypt) et les communications sont sécurisées par HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">8. Cookies et sessions</h2>
            <p className="text-muted-foreground leading-relaxed">
              SenMarket utilise des cookies de session sécurisés pour maintenir votre connexion. Ces cookies sont
              strictement nécessaires au fonctionnement du service et ne sont pas utilisés à des fins publicitaires.
              Ils expirent automatiquement après 7 jours d'inactivité.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">9. Suppression du compte</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vous pouvez supprimer votre compte à tout moment depuis les paramètres de votre profil sur
              l'application mobile ou sur le site web. La suppression entraîne la suppression définitive de toutes
              vos annonces, messages et données associées.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">10. Modifications</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous nous réservons le droit de modifier cette politique à tout moment. Les modifications importantes
              vous seront notifiées par e-mail ou via l'application. La date de dernière mise à jour est indiquée
              en haut de cette page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">11. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pour toute question concernant cette politique de confidentialité, contactez-nous :<br />
              <strong>SenMarket</strong><br />
              Email : contact@senmarket.sn<br />
              Dakar, Sénégal
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
