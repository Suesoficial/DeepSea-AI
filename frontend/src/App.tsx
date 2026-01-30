import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { ConnectionStatus } from "./components/connection-status";
import NotFound from "./pages/not-found";
import Dashboard from "./pages/dashboard";
import Upload from "./pages/upload";
import Results from "./pages/results";
import Analysis from "./pages/analysis";
import Navbar from "./components/layout/navbar";

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      {/* Only show connection status in development or when there are issues */}
      <div className="container mx-auto px-4">
        <div className="py-2">
          <ConnectionStatus />
        </div>
      </div>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/upload" component={Upload} />
        <Route path="/results" component={Results} />
        <Route path="/analysis" component={Analysis} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
