import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";
import { DashboardLayout } from "./pages/layouts/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = lazy(() => import("./pages/dashboard"));
const LoginPage = lazy(() => import("./pages/login"));
const AmbulancesDashboard = lazy(() => import("./pages/ambulances/dashboard"));
const NewAmbulancePage = lazy(() => import("./pages/ambulances/new"));
const AmbulanceDetailsPage = lazy(() => import("./pages/ambulances/details"));
const DriversDashboard = lazy(() => import("./pages/drivers/dashboard"));
const NewDriverPage = lazy(() => import("./pages/drivers/new"));
const DriverDetailsPage = lazy(() => import("./pages/drivers/details"));
const PatientsDashboard = lazy(() => import("./pages/patients/dashboard"));
const NewPatientPage = lazy(() => import("./pages/patients/new"));
const PatientDetailsPage = lazy(() => import("./pages/patients/details"));

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
  return (
    <div className="flex h-screen items-center justify-center p-8">
      <div className="space-y-4 w-full max-w-md">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
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

              <Route path="/ambulances">
                <Route index element={<AmbulancesDashboard />} />
                <Route path="new" element={<NewAmbulancePage />} />
                <Route path=":id" element={<AmbulanceDetailsPage />} />
              </Route>

              <Route path="/drivers">
                <Route index element={<DriversDashboard />} />
                <Route path="new" element={<NewDriverPage />} />
                <Route path=":id" element={<DriverDetailsPage />} />
              </Route>

              <Route path="/patients">
                <Route index element={<PatientsDashboard />} />
                <Route path="new" element={<NewPatientPage />} />
                <Route path=":id" element={<PatientDetailsPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </PersistQueryClientProvider>
  );
}

export default App;
