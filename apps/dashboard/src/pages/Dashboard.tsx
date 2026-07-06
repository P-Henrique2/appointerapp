import React, { useState } from "react";
import { Calendar, Plus, Check, X, Clock, AlertCircle, ChevronRight, Loader2, BarChart2 } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { useAuth } from "../lib/auth";
import type { Appointment } from "../types";
import { useAppointments } from "../hooks/useAppointments";

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
  const { data: appointments = [] } = useAppointments();
  const now = new Date();
  const upcoming = appointments.filter(a => new Date(a.starts_at) >= now && a.status !== "cancelled");
  const todayAppts = appointments.filter(a => isToday(new Date(a.starts_at)));

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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "32px" }}>
        <StatCard label="Today"        value={todayAppts.length} icon={Calendar} />
        <StatCard label="Upcoming"     value={upcoming.length}   icon={Clock} />
        <StatCard label="Total customers" value={upcoming.length} icon={Clock} />
      </div>

      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid #f3f4f6" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "600", color: "#111", margin: 0 }}>Appointments</h2>
        </div>
        {upcoming.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 16px" }}>
            <Calendar size={24} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>No upcoming appointments</p>
            <a href="/appointments" style={{ fontSize: "14px", color: "#0f6e56", fontWeight: "500", textDecoration: "none", display: "inline-block", marginTop: "8px" }}>
              Add your first appointment →
            </a>
          </div>
        ) : (
        upcoming.slice(0, 5).map(appt => (
          <div key={appt.id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 16px", borderBottom: "1px solid #f9fafb" }}>
            <div style={{ width: "48px", textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: "500", color: isToday(new Date(appt.starts_at)) ? "#0f6e56" : "#111" }}>
                {isToday(new Date(appt.starts_at)) ? "Today" : format(new Date(appt.starts_at), "MMM d")}
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>{format(new Date(appt.starts_at), "h:mm a")}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: "500", color: "#111" }}>{appt.customers?.name ?? "—"}</div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>{appt.title}</div>
            </div>
            <span style={{ fontSize: "12px", fontWeight: "500", padding: "2px 8px", borderRadius: "20px", background: appt.status === "confirmed" ? "#f0fdf4" : "#eff6ff", color: appt.status === "confirmed" ? "#15803d" : "#1d4ed8" }}>
              {appt.status}
            </span>
          </div>
        ))
      )}
      </div>
    </div>
  );
}