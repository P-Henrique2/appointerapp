import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Bell, Calendar, Users, Settings, LogOut, Code, BarChart2 } from "lucide-react";
import { AuthProvider, useAuth } from "./lib/auth";
import Auth         from "./pages/Auth";
import Dashboard    from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Customers    from "./pages/Customers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 2,
    },
    mutations: {
      retry: false,
    },
  },
});

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "24px", height: "24px", border: "2px solid #0f6e56", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  return user ? <Outlet /> : <Navigate to="/auth" replace />;
}

const NAV = [
  { href: "/dashboard",   label: "Overview",      Icon: BarChart2 },
  { href: "/appointments", label: "Appointments",  Icon: Calendar },
  { href: "/customers",   label: "Customers",     Icon: Users },
  { href: "/widget",      label: "Widget",        Icon: Code },
  { href: "/settings",    label: "Settings",      Icon: Settings },
];

function AppLayout() {
  const { account, signOut } = useAuth();
  const { pathname }         = useLocation();

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f9fafb" }}>
      <aside style={{ width: "220px", background: "white", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "20px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ width: "28px", height: "28px", background: "#0f6e56", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Bell size={14} color="white" />
          </div>
          <span style={{ fontWeight: "600", color: "#111", fontSize: "15px" }}>Remindly</span>
        </div>

        <div style={{ padding: "12px 20px", borderBottom: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: "13px", fontWeight: "500", color: "#111", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {account?.business_name}
          </p>
          <span style={{ fontSize: "11px", background: "#f0fdf4", color: "#15803d", padding: "2px 6px", borderRadius: "4px", fontWeight: "500", marginTop: "4px", display: "inline-block" }}>
            {account?.plan ?? "starter"}
          </span>
        </div>

        <nav style={{ flex: 1, padding: "12px" }}>
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} to={href} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "8px", fontSize: "14px", textDecoration: "none", marginBottom: "2px", background: active ? "#f0fdf4" : "transparent", color: active ? "#0f6e56" : "#6b7280", fontWeight: active ? "500" : "400" }}>
                <Icon size={15} color={active ? "#0f6e56" : "#9ca3af"} />
                {label}
              </Link>
            );
          })}
        </nav>

        <button onClick={signOut} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 20px", fontSize: "14px", color: "#6b7280", background: "none", border: "none", borderTop: "1px solid #f3f4f6", cursor: "pointer", width: "100%" }}>
          <LogOut size={15} />
          Sign out
        </button>
      </aside>

      <main style={{ flex: 1, overflow: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: "600", color: "#111" }}>{title}</h1>
      <p style={{ color: "#6b7280", fontSize: "14px" }}>This page is coming soon.</p>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard"     element={<Dashboard />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/widget"        element={<PlaceholderPage title="Widget setup" />} />
                <Route path="/settings"      element={<PlaceholderPage title="Settings" />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}