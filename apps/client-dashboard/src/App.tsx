import { Suspense, lazy, useEffect } from "react";
import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { DashboardLayout } from "./pages/layouts/DashboardLayout";
import { applyThemeMode } from "@/lib/theme-mode";
import { useDashboardSettingsStore } from "@/stores/dashboard-settings.store";
import { useAuthStore } from "@/stores/auth.store";

const Dashboard = lazy(() => import("./pages/dashboard/page"));
const LoginPage = lazy(() => import("./pages/login"));
const AmbulancesDashboard = lazy(() => import("./pages/ambulances/page"));
const DispatchersDashboard = lazy(() => import("./pages/dispatchers/page"));
const DriversDashboard = lazy(() => import("./pages/drivers/page"));
const EmtsDashboard = lazy(() => import("./pages/emts/page"));
const PatientsDashboard = lazy(() => import("./pages/patients/page"));
const BookingLogPage = lazy(() => import("./pages/booking/page"));
const AnalyticsPage = lazy(() => import("./pages/analytics/page"));
const AnalyticsReportsPage = lazy(() => import("./pages/analytics-reports/page"));

const HOUR_IN_MS = 1000 * 60 * 60;
const DAY_IN_MS = HOUR_IN_MS * 24;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: HOUR_IN_MS,
      gcTime: DAY_IN_MS,
    },
  },
});

const persister = createAsyncStoragePersister({
  // passing undifined skips the persister on builds
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
});

function PageLoader() {
  return null;
}

function ThemeModeSync() {
  const themeMode = useDashboardSettingsStore((state) => state.settings.themeMode);

  useEffect(() => {
    applyThemeMode(themeMode);
  }, [themeMode]);

  return null;
}

function ProtectedRoute({ children }: { children: ReactElement }) {
  const session = useAuthStore((state) => state.session);
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicOnlyRoute({ children }: { children: ReactElement }) {
  const session = useAuthStore((state) => state.session);
  if (session) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: DAY_IN_MS,
      }}
    >
      <BrowserRouter>
        <ThemeModeSync />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />

            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/ambulances" element={<AmbulancesDashboard />} />
              <Route path="/dispatcher" element={<DispatchersDashboard />} />
              <Route path="/drivers" element={<DriversDashboard />} />
              <Route path="/emts" element={<EmtsDashboard />} />
              <Route path="/patients" element={<PatientsDashboard />} />
              <Route path="/booking" element={<BookingLogPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/analytics/reports" element={<AnalyticsReportsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </PersistQueryClientProvider>
  );
}

export default App;
