import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2, Bell } from "lucide-react";
import { useAuth } from "../lib/auth";

export default function Auth() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode]     = useState<"signin" | "signup">("signin");
  const [email, setEmail]   = useState("");
  const [password, setPass] = useState("");
  const [bizName, setBiz]   = useState("");
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoad]  = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoad(true);

    if (mode === "signup") {
      if (!bizName.trim()) {
        setError("Business name is required.");
        setLoad(false);
        return;
      }
      const { error } = await signUp(email, password, bizName.trim());
      if (error) {
        setError(error);
      } else {
        navigate("/dashboard");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError("Incorrect email or password.");
      } else {
        navigate("/dashboard");
      }
    }

    setLoad(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "32px" }}>
          <div style={{ width: "36px", height: "36px", background: "#0f6e56", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell size={18} color="white" />
          </div>
          <span style={{ fontSize: "20px", fontWeight: "600", color: "#111" }}>Remindly</span>
        </div>

        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e5e7eb", padding: "24px" }}>
          <h1 style={{ fontSize: "18px", fontWeight: "600", color: "#111", marginBottom: "4px" }}>
            {mode === "signin" ? "Sign in" : "Start your free trial"}
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "24px" }}>
            {mode === "signin" ? "Welcome back." : "14 days free, no credit card required."}
          </p>

          <form onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
                  Business name
                </label>
                <input
                  type="text"
                  value={bizName}
                  onChange={e => setBiz(e.target.value)}
                  placeholder="Sunrise Salon"
                  required
                  style={{ width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@business.com"
                required
                style={{ width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPass(e.target.value)}
                placeholder={mode === "signup" ? "At least 8 characters" : ""}
                required
                minLength={8}
                style={{ width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {error && (
              <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", marginBottom: "16px" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#0f6e56", color: "white", padding: "10px", borderRadius: "8px", fontSize: "14px", fontWeight: "500", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
              style={{ fontSize: "14px", color: "#0f6e56", background: "none", border: "none", cursor: "pointer" }}
            >
              {mode === "signin" ? "Don't have an account? Start free trial" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}