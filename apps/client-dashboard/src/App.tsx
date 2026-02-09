import { DashboardLayout } from "./pages/layouts/DashboardLayout";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import DashBoard from "./pages/dashboard";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";

export function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60 * 24,
      },
    },
  });

  const persister = createAsyncStoragePersister({
    storage: {
      getItem: async (key) => await get(key),
      setItem: async (key, value) => await set(key, value),
      removeItem: async (key) => await del(key),
    },
  });

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={"Login"} />

          <Route element={<DashboardLayout />}>
            <Route path="" element={<DashBoard />} />

            <Route path="ambulances">
              <Route index element={<h1>dashboard</h1>} />
              <Route path="new" element={<h1>dashboard</h1>} />
              <Route path=":id" element={<h1>dashboard</h1>} />
            </Route>

            <Route path="drivers">
              <Route index element={<h1>dashboard</h1>} />
              <Route path="new" element={<h1>dashboard</h1>} />
              <Route path=":id" element={<h1>dashboard</h1>} />
            </Route>

            <Route path="patients">
              <Route path="" element={<h1>dashboard</h1>} />
              <Route path="new" element={<h1>dashboard</h1>} />
              <Route path=":id" element={<h1>dashboard</h1>} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </PersistQueryClientProvider>
  );
}

export default App;
