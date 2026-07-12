import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import VehiclesPage from "./pages/vehicles/VehiclesPage";
import DriversPage from "./pages/drivers/DriversPage";
import MaintenancePage from "./pages/maintenance/MaintenancePage";
import FinancePage from "./pages/finance/FinancePage";
import TripsPage from "./pages/trips/TripsPage";

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <svg
      className="animate-spin h-8 w-8 text-indigo-600"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, loading, getRole } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = getRole();
  return allowedRoles.includes(role) ? (
    children
  ) : (
    <Navigate to="/dashboard" replace />
  );
};

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route
                  path="vehicles"
                  element={
                    <RoleProtectedRoute
                      allowedRoles={[
                        "fleet_manager",
                        "driver",
                        "safety_officer",
                        "financial_analyst",
                      ]}
                    >
                      <VehiclesPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="drivers"
                  element={
                    <RoleProtectedRoute
                      allowedRoles={["fleet_manager", "safety_officer"]}
                    >
                      <DriversPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="trips"
                  element={
                    <RoleProtectedRoute
                      allowedRoles={["fleet_manager", "driver"]}
                    >
                      <TripsPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="maintenance"
                  element={
                    <RoleProtectedRoute allowedRoles={["fleet_manager"]}>
                      <MaintenancePage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="finance"
                  element={
                    <RoleProtectedRoute
                      allowedRoles={["fleet_manager", "financial_analyst"]}
                    >
                      <FinancePage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
