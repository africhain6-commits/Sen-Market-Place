import { Layout } from "@/components/layout";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
// ... other imports will be added here
import { Switch, Route, Router as WouterRouter } from "wouter";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        {/* other routes will be added here */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

// Ensure AuthProvider wraps the layout
export default function App() {
  // ... QueryClientProvider is handled by main.tsx / wrapper usually, check App.tsx
  return null;
}