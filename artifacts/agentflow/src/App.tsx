import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";

import { Layout } from "./components/layout";
import Dashboard from "./pages/dashboard";
import Agents from "./pages/agents";
import Workflows from "./pages/workflows";
import WorkflowEditor from "./pages/workflow-editor";
import Executions from "./pages/executions";
import KnowledgeBases from "./pages/knowledge-bases";
import Templates from "./pages/templates";
import AIBuilder from "./pages/ai-builder";
import Integrations from "./pages/integrations";
import Evaluations from "./pages/evaluations";
import Settings from "./pages/settings";
import AgentChat from "./pages/agent-chat";
import FeatureRequests from "./pages/feature-requests";
import Leaderboard from "./pages/leaderboard";
import ABTesting from "./pages/ab-testing";
import BulkExecution from "./pages/bulk-execution";
import Webhooks from "./pages/webhooks";
import Prompts from "./pages/prompts";
import AuditLog from "./pages/audit-log";
import NotificationCenter from "./pages/notification-center";
import AgentPresets from "./pages/agent-presets";
import MemoryViewer from "./pages/memory-viewer";
import RateLimits from "./pages/rate-limits";
import DebugTrace from "./pages/debug-trace";
import OutputValidation from "./pages/output-validation";
import WorkflowRefiner from "./pages/workflow-refiner";
import CostOptimizer from "./pages/cost-optimizer";
import TeamWorkspaces from "./pages/team-workspaces";
import SlackConfig from "./pages/slack-config";
import BridgePage from "./pages/BridgePage";
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
      <Route path="/agents/:id/chat" component={AgentChat} />
      
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
      <Route path="/integrations">
        <Layout><Integrations /></Layout>
      </Route>
      <Route path="/evaluations">
        <Layout><Evaluations /></Layout>
      </Route>
      <Route path="/settings">
        <Layout><Settings /></Layout>
      </Route>
      <Route path="/feature-requests">
        <Layout><FeatureRequests /></Layout>
      </Route>
      <Route path="/leaderboard">
        <Layout><Leaderboard /></Layout>
      </Route>
      <Route path="/ab-testing">
        <Layout><ABTesting /></Layout>
      </Route>
      <Route path="/bulk-execution">
        <Layout><BulkExecution /></Layout>
      </Route>
      <Route path="/webhooks">
        <Layout><Webhooks /></Layout>
      </Route>
      <Route path="/prompts">
        <Layout><Prompts /></Layout>
      </Route>
      <Route path="/audit-log">
        <Layout><AuditLog /></Layout>
      </Route>
      <Route path="/notifications">
        <Layout><NotificationCenter /></Layout>
      </Route>
      <Route path="/agent-presets">
        <Layout><AgentPresets /></Layout>
      </Route>
      <Route path="/memory-viewer">
        <Layout><MemoryViewer /></Layout>
      </Route>
      <Route path="/rate-limits">
        <Layout><RateLimits /></Layout>
      </Route>
      <Route path="/debug-trace">
        <Layout><DebugTrace /></Layout>
      </Route>
      <Route path="/output-validation">
        <Layout><OutputValidation /></Layout>
      </Route>
      <Route path="/workflow-refiner">
        <Layout><WorkflowRefiner /></Layout>
      </Route>
      <Route path="/cost-optimizer">
        <Layout><CostOptimizer /></Layout>
      </Route>
      <Route path="/team-workspaces">
        <Layout><TeamWorkspaces /></Layout>
      </Route>
      <Route path="/slack-config">
        <Layout><SlackConfig /></Layout>
      </Route>
      <Route path="/bridge">
        <Layout><BridgePage /></Layout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
