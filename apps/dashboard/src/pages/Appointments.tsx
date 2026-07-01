import React, { useState } from "react";
import { format } from "date-fns";
import { Plus, X, Check, AlertCircle, Loader2, Calendar, ChevronDown } from "lucide-react";
import { useAppointments, useCreateAppointment, useUpdateAppointmentStatus, useCustomers, useCreateCustomer } from "../hooks/useAppointments";
import type { Appointment } from "../types";

// ── Shared input style ────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: "100%", padding: "10px 12px", fontSize: "14px",
  border: "1px solid #e5e7eb", borderRadius: "8px",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

const label: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: "500",
  color: "#374151", marginBottom: "6px",
};

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Appointment["status"] }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    scheduled: { bg: "#eff6ff", color: "#1d4ed8", label: "Scheduled" },
    confirmed: { bg: "#f0fdf4", color: "#15803d", label: "Confirmed" },
    cancelled: { bg: "#fef2f2", color: "#dc2626", label: "Cancelled" },
    no_show:   { bg: "#fffbeb", color: "#d97706", label: "No show"   },
    completed: { bg: "#f3f4f6", color: "#6b7280", label: "Completed" },
  };
  const s = map[status] ?? map.scheduled;
  return (
    <span style={{ background: s.bg, color: s.color, padding: "2px 8px", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }}>
      {s.label}
    </span>
  );
}

// ── New Customer Modal ────────────────────────────────────────────────────────
function NewCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const createCustomer = useCreateCustomer();
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Name is required."); return; }
    if (!email.trim() && !phone.trim()) { setError("Add at least an email or phone number."); return; }
    try {
      const customer = await createCustomer.mutateAsync({ name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined });
      onCreated(customer.id);
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "16px" }}>
      <div style={{ background: "white", borderRadius: "16px", width: "100%", maxWidth: "400px", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>New customer</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "14px" }}>
            <label style={label}>Full name *</label>
            <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" />
          </div>
          <div style={{ marginBottom: "14px" }}>
            <label style={label}>Email</label>
            <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
          </div>
          <div style={{ marginBottom: "14px" }}>
            <label style={label}>Phone (for SMS reminders)</label>
            <input style={inp} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
          </div>

          {error && (
            <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", marginBottom: "14px" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={createCustomer.isPending} style={{ width: "100%", background: "#0f6e56", color: "white", border: "none", borderRadius: "8px", padding: "10px", fontSize: "14px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            {createCustomer.isPending && <Loader2 size={14} />}
            Save customer
          </button>
        </form>
      </div>
    </div>
  );
}

// ── New Appointment Modal ─────────────────────────────────────────────────────
function NewAppointmentModal({ onClose }: { onClose: () => void }) {
  const createAppointment = useCreateAppointment();
  const { data: customers = [] } = useCustomers();

  const [customerId, setCustomerId] = useState("");
  const [title, setTitle]           = useState("");
  const [date, setDate]             = useState("");
  const [time, setTime]             = useState("");
  const [duration, setDuration]     = useState("60");
  const [channel, setChannel]       = useState<"sms" | "email" | "both">("both");
  const [notes, setNotes]           = useState("");
  const [error, setError]           = useState<string | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!customerId)  { setError("Please select a customer."); return; }
    if (!title.trim()) { setError("Please enter a title."); return; }
    if (!date || !time) { setError("Please select a date and time."); return; }

    const starts_at = new Date(`${date}T${time}`).toISOString();

    try {
      await createAppointment.mutateAsync({
        customer_id: customerId,
        title: title.trim(),
        starts_at,
        duration_mins: parseInt(duration),
        notes: notes.trim() || undefined,
        channel,
        reminder_24h: true,
        reminder_2h: true,
      });
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "16px" }}>
        <div style={{ background: "white", borderRadius: "16px", width: "100%", maxWidth: "480px", padding: "24px", maxHeight: "90vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>New appointment</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Customer selector */}
            <div style={{ marginBottom: "14px" }}>
              <label style={label}>Customer *</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <select
                  style={{ ...inp, flex: 1 }}
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                >
                  <option value="">Select a customer…</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} {c.email ? `(${c.email})` : ""}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCustomer(true)}
                  style={{ padding: "10px 12px", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "500", whiteSpace: "nowrap" }}
                >
                  + New
                </button>
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: "14px" }}>
              <label style={label}>Title *</label>
              <input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Haircut, Consultation" />
            </div>

            {/* Date and time */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label style={label}>Date *</label>
                <input style={inp} type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
              </div>
              <div>
                <label style={label}>Time *</label>
                <input style={inp} type="time" value={time} onChange={e => setTime(e.target.value)} />
              </div>
            </div>

            {/* Duration */}
            <div style={{ marginBottom: "14px" }}>
              <label style={label}>Duration</label>
              <select style={inp} value={duration} onChange={e => setDuration(e.target.value)}>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>

            {/* Reminder channel */}
            <div style={{ marginBottom: "14px" }}>
              <label style={label}>Send reminders via</label>
              <select style={inp} value={channel} onChange={e => setChannel(e.target.value as any)}>
                <option value="both">SMS + Email</option>
                <option value="sms">SMS only</option>
                <option value="email">Email only</option>
              </select>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: "14px" }}>
              <label style={label}>Notes (optional)</label>
              <textarea style={{ ...inp, resize: "vertical", minHeight: "72px" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about this appointment…" />
            </div>

            {error && (
              <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", marginBottom: "14px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <AlertCircle size={14} style={{ marginTop: "1px", flexShrink: 0 }} />
                {error}
              </div>
            )}

            <button type="submit" disabled={createAppointment.isPending} style={{ width: "100%", background: "#0f6e56", color: "white", border: "none", borderRadius: "8px", padding: "10px", fontSize: "14px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {createAppointment.isPending && <Loader2 size={14} />}
              Book appointment
            </button>
          </form>
        </div>
      </div>

      {showNewCustomer && (
        <NewCustomerModal
          onClose={() => setShowNewCustomer(false)}
          onCreated={(id) => { setCustomerId(id); setShowNewCustomer(false); }}
        />
      )}
    </>
  );
}

// ── Main Appointments Page ────────────────────────────────────────────────────
export default function Appointments() {
  const { data: appointments = [], isLoading, isError } = useAppointments();
  const updateStatus = useUpdateAppointmentStatus();
  const [showNew, setShowNew]   = useState(false);
  const [filter, setFilter]     = useState<"upcoming" | "all">("upcoming");

  const now = new Date();
  const displayed = filter === "upcoming"
    ? appointments.filter(a => new Date(a.starts_at) >= now && a.status !== "cancelled")
    : appointments;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "600", color: "#111", margin: 0 }}>Appointments</h1>
        <button
          onClick={() => setShowNew(true)}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "#0f6e56", color: "white", padding: "8px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: "500", border: "none", cursor: "pointer" }}
        >
          <Plus size={16} />
          New appointment
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
        {(["upcoming", "all"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "500", border: "none", cursor: "pointer", background: filter === f ? "#f3f4f6" : "transparent", color: filter === f ? "#111" : "#6b7280" }}
          >
            {f === "upcoming" ? "Upcoming" : "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 160px 100px 80px", gap: "12px", padding: "10px 16px", borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
          {["Date & time", "Customer", "Title", "Status", "Actions"].map(h => (
            <span key={h} style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280" }}>{h}</span>
          ))}
        </div>

        {isLoading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "48px", color: "#9ca3af" }}>
            <Loader2 size={16} />
            <span style={{ fontSize: "14px" }}>Loading…</span>
          </div>
        )}

        {isError && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "24px", color: "#dc2626" }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: "14px" }}>Failed to load appointments.</span>
          </div>
        )}

        {!isLoading && !isError && displayed.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 16px" }}>
            <Calendar size={24} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>No appointments yet</p>
            <button
              onClick={() => setShowNew(true)}
              style={{ fontSize: "14px", color: "#0f6e56", fontWeight: "500", background: "none", border: "none", cursor: "pointer", marginTop: "8px" }}
            >
              Add your first appointment →
            </button>
          </div>
        )}

        {!isLoading && !isError && displayed.map(appt => {
          const startsAt = new Date(appt.starts_at);
          const isPast   = startsAt < now;
          return (
            <div key={appt.id} style={{ display: "grid", gridTemplateColumns: "140px 1fr 160px 100px 80px", gap: "12px", padding: "12px 16px", borderBottom: "1px solid #f9fafb", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "500", color: "#111" }}>{format(startsAt, "MMM d, yyyy")}</div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>{format(startsAt, "h:mm a")}</div>
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "500", color: "#111" }}>{appt.customers?.name ?? "—"}</div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>{appt.customers?.email ?? appt.customers?.phone ?? ""}</div>
              </div>
              <div style={{ fontSize: "13px", color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.title}</div>
              <div><StatusBadge status={appt.status} /></div>
              <div style={{ display: "flex", gap: "4px" }}>
                {appt.status === "scheduled" && !isPast && (
                  <>
                    <button
                      onClick={() => updateStatus.mutate({ id: appt.id, status: "confirmed" })}
                      title="Confirm"
                      style={{ padding: "4px", borderRadius: "6px", border: "none", background: "#f0fdf4", color: "#15803d", cursor: "pointer" }}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => updateStatus.mutate({ id: appt.id, status: "cancelled" })}
                      title="Cancel"
                      style={{ padding: "4px", borderRadius: "6px", border: "none", background: "#fef2f2", color: "#dc2626", cursor: "pointer" }}
                    >
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showNew && <NewAppointmentModal onClose={() => setShowNew(false)} />}
    </div>
  );
}