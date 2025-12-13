import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "./context/auth-context";
import { ThemeProvider } from "./context/theme-provider";
import ProtectedRoute from "./components/auth/protected-route";
import PublicRoute from "./components/auth/public-route";

import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard";
import Plants from "./pages/Plant";
import Units from "./pages/Unit";
import UnitDetails from "./pages/Unit/details";
import PlantDetails from "./pages/Plant/details";
import Layout from "./components/layout";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/plants" element={<Plants />} />
                <Route path="/units" element={<Units />} />
                <Route path="/unit/:id" element={<UnitDetails />} />
                <Route path="/plant/:id" element={<PlantDetails />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
