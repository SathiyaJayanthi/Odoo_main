import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";

function ProtectedRoute({ children }) {
  const { accessToken } = useAuth();

  return accessToken ? children : <Navigate to="/login" replace />;
}

function RootRedirect() {
  const { accessToken } = useAuth();

  return accessToken ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  );
}

function PlaceholderPage({ title }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">This area is coming soon.</p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="dashboard"
          element={<PlaceholderPage title="Dashboard" />}
        />
        <Route path="vehicles" element={<PlaceholderPage title="Vehicles" />} />
        <Route path="drivers" element={<PlaceholderPage title="Drivers" />} />
        <Route path="trips" element={<PlaceholderPage title="Trips" />} />
        <Route
          path="maintenance"
          element={<PlaceholderPage title="Maintenance" />}
        />
        <Route path="finance" element={<PlaceholderPage title="Finance" />} />
        <Route path="reports" element={<PlaceholderPage title="Reports" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
