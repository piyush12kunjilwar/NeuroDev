import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { ModelProvider } from "./hooks/use-model";
import { ContributionsProvider } from "./hooks/use-contributions";
import { IpfsProvider } from "./hooks/use-ipfs";
import { ProtectedRoute } from "./lib/protected-route";

import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ModelProvider>
          <ContributionsProvider>
            <IpfsProvider>
              <Router />
              <Toaster />
            </IpfsProvider>
          </ContributionsProvider>
        </ModelProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
