import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Layout } from "./components/layout";
import Dashboard from "./pages/dashboard";
import Agents from "./pages/agents";
import Workflows from "./pages/workflows";
import WorkflowEditor from "./pages/workflow-editor";
import Executions from "./pages/executions";
import KnowledgeBases from "./pages/knowledge-bases";
import Templates from "./pages/templates";
import AIBuilder from "./pages/ai-builder";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/workflows/:id/edit" component={WorkflowEditor} />
      
      <Route path="/">
        <Layout><Dashboard /></Layout>
      </Route>
      <Route path="/agents">
        <Layout><Agents /></Layout>
      </Route>
      <Route path="/workflows">
        <Layout><Workflows /></Layout>
      </Route>
      <Route path="/executions">
        <Layout><Executions /></Layout>
      </Route>
      <Route path="/knowledge-bases">
        <Layout><KnowledgeBases /></Layout>
      </Route>
      <Route path="/templates">
        <Layout><Templates /></Layout>
      </Route>
      <Route path="/ai-builder">
        <Layout><AIBuilder /></Layout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
