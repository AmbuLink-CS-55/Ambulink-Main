import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { DashboardLayout } from "./pages/layouts/DashboardLayout";

const Dashboard = lazy(() => import("./pages/dashboard/page"));
const LoginPage = lazy(() => import("./pages/login"));
const AmbulancesDashboard = lazy(() => import("./pages/ambulances/page"));
const DriversDashboard = lazy(() => import("./pages/drivers/page"));
const EmtsDashboard = lazy(() => import("./pages/emts/page"));
const PatientsDashboard = lazy(() => import("./pages/patients/page"));
const BookingLogPage = lazy(() => import("./pages/booking/page"));

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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/ambulances" element={<AmbulancesDashboard />} />
              <Route path="/drivers" element={<DriversDashboard />} />
              <Route path="/emts" element={<EmtsDashboard />} />
              <Route path="/patients" element={<PatientsDashboard />} />
              <Route path="/booking" element={<BookingLogPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </PersistQueryClientProvider>
  );
}

export default App;
