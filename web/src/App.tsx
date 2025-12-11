import { BrowserRouter, Routes, Route } from "react-router";
import Dashboard from "./pages/Dashboard";
import UnitDetails from "./pages/Unit/UnitDetails";
import Layout from "./components/layout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/unit/:id" element={<UnitDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
