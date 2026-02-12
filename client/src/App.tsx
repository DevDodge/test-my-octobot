import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import BotsPage from "./pages/Bots";
import TestersPage from "./pages/Testers";
import TeamsPage from "./pages/Teams";
import SessionsPage from "./pages/Sessions";
import SessionDetailPage from "./pages/SessionDetail";
import AnalyticsPage from "./pages/Analytics";
import BannersPage from "./pages/Banners";
import ClientChat from "./pages/ClientChat";
import LoginPage from "./pages/Login";
import AdminManagementPage from "./pages/AdminManagement";

function AdminRoutes() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/bots" component={BotsPage} />
        <Route path="/testers" component={TestersPage} />
        <Route path="/teams" component={TeamsPage} />
        <Route path="/sessions" component={SessionsPage} />
        <Route path="/sessions/:id" component={SessionDetailPage} />
        <Route path="/banners" component={BannersPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/admins" component={AdminManagementPage} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Login page */}
      <Route path="/login" component={LoginPage} />
      {/* Client chat - public route via share token */}
      <Route path="/chat/:token" component={ClientChat} />
      {/* All other routes go through admin dashboard */}
      <Route component={AdminRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
