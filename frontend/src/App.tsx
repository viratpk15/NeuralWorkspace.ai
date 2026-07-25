import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Layout } from "@/components/layout";
import { BackgroundJobsProvider } from "@/contexts/background-jobs-context";
import { reconnectActiveJobs } from "@/hooks/use-sse-stream";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Workspace from "@/pages/workspace";
import Assistant from "@/pages/assistant";
import Planner from "@/pages/planner";
import ArchitectureStudio from "@/pages/architecture";
import DocsStudio from "@/pages/docs-studio";
import Memory from "@/pages/memory";
import Prompts from "@/pages/prompts";
import WorkflowPage from "@/pages/workflow";
import Settings from "@/pages/settings";
import { Route, Switch, Router as WouterRouter } from "wouter";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/workspace/:id?" component={Workspace} />
        <Route path="/assistant/:conversationId?" component={Assistant} />
        <Route path="/planner" component={Planner} />
        <Route path="/architecture" component={ArchitectureStudio} />
        <Route path="/docs-studio" component={DocsStudio} />
        <Route path="/memory" component={Memory} />
        <Route path="/prompts" component={Prompts} />
        <Route path="/workflow" component={WorkflowPage} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Reconnect any active background jobs on app startup
  // Ensures generation continues after page refresh
  useEffect(() => {
    reconnectActiveJobs();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <BackgroundJobsProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </BackgroundJobsProvider>
          <Toaster
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "rgba(10, 10, 10, 0.85)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                color: "#e0e0e0",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
              },
              className: "glass",
            }}
          />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
