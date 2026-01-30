import { DashboardLayout } from "./layouts/DashboardLayout";
import { BrowserRouter, Route, Routes } from "react-router-dom";

export function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={"dashboard"} />

        <Route element={<DashboardLayout />}>
          <Route path="/" element={<h1>dashboard</h1>} />
          <Route path="/requests" element={<h1>requests</h1>} />
          <Route path="/ambulances" element={<h1>ambulances</h1>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
