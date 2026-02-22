import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";
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

const persister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => get(key),
    setItem: async (key, value) => set(key, value),
    removeItem: async (key) => del(key),
  },
});

function PageLoader() {
  return <></>;
}

export function App() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
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
