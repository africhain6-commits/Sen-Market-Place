import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { AuthProvider } from "@/hooks/use-auth";

import Home from "@/pages/home";
import Annonces from "@/pages/annonces";
import AnnonceDetail from "@/pages/annonce-detail";
import Publier from "@/pages/publier";
import Connexion from "@/pages/connexion";
import Inscription from "@/pages/inscription";
import TableauDeBord from "@/pages/tableau-de-bord";
import Profil from "@/pages/profil";
import Admin from "@/pages/admin";
import Boutiques from "@/pages/boutiques";
import Pub from "@/pages/pub";
import Modifier from "@/pages/modifier";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/annonces" component={Annonces} />
        <Route path="/annonces/:id" component={AnnonceDetail} />
        <Route path="/publier" component={Publier} />
        <Route path="/connexion" component={Connexion} />
        <Route path="/inscription" component={Inscription} />
        <Route path="/tableau-de-bord" component={TableauDeBord} />
        <Route path="/profil/:id" component={Profil} />
        <Route path="/admin" component={Admin} />
        <Route path="/boutiques" component={Boutiques} />
        <Route path="/publicite" component={Pub} />
        <Route path="/modifier/:id" component={Modifier} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
