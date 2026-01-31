import { DashboardLayout } from "./layouts/DashboardLayout";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import DashBoard from "./pages/dashboard";

export function App() {

  return (
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
  )
}

export default App;
