import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import CareGate from "./components/CareGate";
import ProfileLanguageSync from "./components/ProfileLanguageSync";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { SpeechProvider } from "./contexts/SpeechContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const PeoplePage = lazy(() => import("./pages/PeoplePage"));
const AssistantPage = lazy(() => import("./pages/AssistantPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));

function PageLoading() {
  const { t } = useLanguage();
  return <main className="page-wrap" role="status" aria-live="polite">{t("Loading…")}</main>;
}

function ProtectedApp({ children }: { children: React.ReactNode }) {
  return <DashboardLayout><CareGate><Suspense fallback={<PageLoading />}>{children}</Suspense></CareGate></DashboardLayout>;
}

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/app"><ProtectedApp><DashboardPage /></ProtectedApp></Route>
    <Route path="/calendar"><ProtectedApp><CalendarPage /></ProtectedApp></Route>
    <Route path="/people"><ProtectedApp><PeoplePage /></ProtectedApp></Route>
    <Route path="/assistant"><ProtectedApp><AssistantPage /></ProtectedApp></Route>
    <Route path="/help"><ProtectedApp><HelpPage /></ProtectedApp></Route>
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ThemeProvider defaultTheme="light">
    <LanguageProvider>
      <ErrorBoundary>
        <SpeechProvider>
          <TooltipProvider>
            <Toaster />
            <ProfileLanguageSync />
            <Router />
          </TooltipProvider>
        </SpeechProvider>
      </ErrorBoundary>
    </LanguageProvider>
  </ThemeProvider>;
}
