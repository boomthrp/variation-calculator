import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProjectProvider } from "./contexts/ProjectContext";
import SimpleLayout from "./components/SimpleLayout";
import UploadPage from "./pages/Upload";
import ConfigurePage from "./pages/Configure";
import AnalyzePage from "./pages/Analyze";
import ResultsPage from "./pages/Results";

function Router() {
  return (
    <SimpleLayout>
      <Switch>
        <Route path={"/"} component={UploadPage} />
        <Route path={"/configure"} component={ConfigurePage} />
        <Route path={"/analyze"} component={AnalyzePage} />
        <Route path={"/results"} component={ResultsPage} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </SimpleLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
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
