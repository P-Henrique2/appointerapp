import React, { useState } from "react";
import { Calendar, Plus, Check, X, Clock, AlertCircle, ChevronRight, Loader2, BarChart2 } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { useAuth } from "../lib/auth";
import type { Appointment } from "../types";

function StatusBadge({ status }: { status: Appointment["status"] }) {
  const styles: Record<string, { background: string; color: string }> = {
    scheduled: { background: "#eff6ff", color: "#1d4ed8" },
    confirmed: { background: "#f0fdf4", color: "#15803d" },
    cancelled: { background: "#fef2f2", color: "#dc2626" },
    no_show:   { background: "#fffbeb", color: "#d97706" },
    completed: { background: "#f3f4f6", color: "#6b7280" },
  };
  const labels: Record<string, string> = {
    scheduled: "Scheduled", confirmed: "Confirmed",
    cancelled: "Cancelled", no_show: "No show", completed: "Completed",
  };
  const s = styles[status] ?? styles.scheduled;
  return (
    <span style={{ ...s, padding: "2px 8px", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }}>
      {labels[status] ?? status}
    </span>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>{label}</span>
        <div style={{ width: "28px", height: "28px", background: "#f0fdf4", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} color="#0f6e56" />
        </div>
      </div>
      <div style={{ fontSize: "24px", fontWeight: "600", color: "#111" }}>{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const { account } = useAuth();
  const now = new Date();

  const planLimits: Record<string, number> = { starter: 100, growth: 400, pro: 9999 };
  const limit    = planLimits[account?.plan ?? "starter"] ?? 100;
  const thisMonth = account?.appointments_this_month ?? 0;
  const usagePct  = (thisMonth / limit) * 100;
  const nearLimit = usagePct >= 80;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: "#111", margin: 0 }}>
            {account?.business_name ?? "Dashboard"}
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
            {format(now, "EEEE, MMMM d")}
          </p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: "8px", background: "#0f6e56", color: "white", padding: "8px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: "500", border: "none", cursor: "pointer" }}>
          <Plus size={16} />
          New appointment
        </button>
      </div>

      {account?.subscription_status === "trialing" && (
        <div style={{ marginBottom: "24px", display: "flex", alignItems: "flex-start", gap: "12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "16px" }}>
          <AlertCircle size={16} color="#d97706" style={{ marginTop: "2px", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: "14px", fontWeight: "500", color: "#92400e", margin: 0 }}>You're on a free trial</p>
            <p style={{ fontSize: "13px", color: "#b45309", marginTop: "4px" }}>
              Trial ends {account.trial_ends_at ? format(new Date(account.trial_ends_at), "MMMM d") : "soon"}. Add billing to keep sending reminders.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "32px" }}>
        <StatCard label="This month"   value={thisMonth}  icon={BarChart2} />
        <StatCard label="Plan limit"   value={limit === 9999 ? "Unlimited" : limit} icon={Clock} />
        <StatCard label="Plan"         value={account?.plan ?? "starter"} icon={Calendar} />
      </div>

      {limit !== 9999 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", color: "#6b7280" }}>Monthly usage</span>
            <span style={{ fontSize: "12px", fontWeight: "500", color: nearLimit ? "#d97706" : "#374151" }}>
              {thisMonth} / {limit}
            </span>
          </div>
          <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(usagePct, 100)}%`, background: nearLimit ? "#f59e0b" : "#0f6e56", borderRadius: "99px", transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid #f3f4f6" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "600", color: "#111", margin: 0 }}>Appointments</h2>
        </div>
        <div style={{ textAlign: "center", padding: "48px 16px" }}>
          <Calendar size={24} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>No appointments yet</p>
          <button style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "14px", color: "#0f6e56", fontWeight: "500", background: "none", border: "none", cursor: "pointer", marginTop: "8px" }}>
            Add your first appointment <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}