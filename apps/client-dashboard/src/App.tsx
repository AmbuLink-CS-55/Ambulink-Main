import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { DashboardLayout } from "./pages/layouts/DashboardLayout";

const Dashboard = lazy(() => import("./pages/dashboard"));
const LoginPage = lazy(() => import("./pages/login"));
const AmbulancesDashboard = lazy(() => import("./pages/ambulances/dashboard"));
const DriversDashboard = lazy(() => import("./pages/drivers/dashboard"));
const PatientsDashboard = lazy(() => import("./pages/patients/dashboard"));
const BookingLogPage = lazy(() => import("./pages/booking/dashboard"));

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

const persister = createSyncStoragePersister({
  storage: globalThis.localStorage,
});

function PageLoader() {
  return <></>;
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
