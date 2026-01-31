import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProjectProvider } from "./contexts/ProjectContext";
import DashboardLayout from "./components/DashboardLayout";
import Import from "./pages/Import";
import Configure from "./pages/Configure";
import Analyze from "./pages/Analyze";
import Export from "./pages/Export";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Import} />
        <Route path={"/configure"} component={Configure} />
        <Route path={"/analyze"} component={Analyze} />
        <Route path={"/export"} component={Export} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <ProjectProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ProjectProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
