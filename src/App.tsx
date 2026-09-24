import React from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LinkButton } from "./components/LinkButton";
import { Dashboard } from "./pages/Dashboard";
import { Metrics } from "./pages/Metrics";
import { client } from "./api/client";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const Notifications = () => <div className="card p-4">Notifications</div>;
const Billing = () => <div className="card p-4">Billing</div>;
const Members = () => <div className="card p-4">Members</div>;

const Login = () => {
  const { t } = useTranslation();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await client.post("/auth/token/", {
        username,
        password,
      });
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      // Redirect to dashboard
      window.location.href = "/";
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="card w-full max-w-md p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">PulseGuard</h1>
          <p className="text-sm text-slate-500">{t("login")}</p>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <input 
          className="input" 
          placeholder="Username" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input 
          className="input" 
          placeholder="Password" 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
        <button 
          className="w-full justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : t("login")}
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="/metrics" element={<Metrics />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/members" element={<Members />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
