import React, { useState } from "react";
import { Plus, X, Users, Mail, Phone, Loader2, AlertCircle } from "lucide-react";
import { useCustomers, useCreateCustomer } from "../hooks/useAppointments";

// ── Shared styles ─────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: "100%", padding: "10px 12px", fontSize: "14px",
  border: "1px solid #e5e7eb", borderRadius: "8px",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

const lbl: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: "500",
  color: "#374151", marginBottom: "6px",
};

// ── New Customer Modal ────────────────────────────────────────────────────────
function NewCustomerModal({ onClose }: { onClose: () => void }) {
  const createCustomer = useCreateCustomer();
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Name is required."); return; }
    if (!email.trim() && !phone.trim()) { setError("Add at least an email or phone number."); return; }
    try {
      await createCustomer.mutateAsync({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
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
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "14px" }}>
            <label style={lbl}>Full name *</label>
            <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" />
          </div>
          <div style={{ marginBottom: "14px" }}>
            <label style={lbl}>Email</label>
            <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
          </div>
          <div style={{ marginBottom: "14px" }}>
            <label style={lbl}>Phone (for SMS reminders)</label>
            <input style={inp} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
          </div>
          <div style={{ marginBottom: "14px" }}>
            <label style={lbl}>Notes (optional)</label>
            <textarea
              style={{ ...inp, resize: "vertical", minHeight: "72px" }}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any notes about this customer…"
            />
          </div>

          {error && (
            <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", marginBottom: "14px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <AlertCircle size={14} style={{ marginTop: "1px", flexShrink: 0 }} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={createCustomer.isPending}
            style={{ width: "100%", background: "#0f6e56", color: "white", border: "none", borderRadius: "8px", padding: "10px", fontSize: "14px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            {createCustomer.isPending && <Loader2 size={14} />}
            Save customer
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Customer card ─────────────────────────────────────────────────────────────
function CustomerCard({ customer }: { customer: any }) {
  return (
    <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
      {/* Avatar */}
      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: "16px", fontWeight: "600", color: "#0f6e56" }}>
          {customer.name.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: "14px", fontWeight: "500", color: "#111" }}>{customer.name}</p>
        <div style={{ display: "flex", gap: "12px", marginTop: "4px", flexWrap: "wrap" }}>
          {customer.email && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#6b7280" }}>
              <Mail size={11} />
              {customer.email}
            </span>
          )}
          {customer.phone && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#6b7280" }}>
              <Phone size={11} />
              {customer.phone}
            </span>
          )}
        </div>
        {customer.notes && (
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {customer.notes}
          </p>
        )}
      </div>

      {/* Date added */}
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <span style={{ fontSize: "11px", color: "#9ca3af" }}>
          Added {new Date(customer.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
    </div>
  );
}

// ── Main Customers Page ───────────────────────────────────────────────────────
export default function Customers() {
  const { data: customers = [], isLoading, isError } = useCustomers();
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch]   = useState("");

  const filtered = customers.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: "#111", margin: 0 }}>Customers</h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
            {customers.length} total
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "#0f6e56", color: "white", padding: "8px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: "500", border: "none", cursor: "pointer" }}
        >
          <Plus size={16} />
          New customer
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "16px" }}>
        <input
          style={{ ...inp, maxWidth: "320px" }}
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "48px", justifyContent: "center", color: "#9ca3af" }}>
          <Loader2 size={16} />
          <span style={{ fontSize: "14px" }}>Loading customers…</span>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "24px", color: "#dc2626" }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: "14px" }}>Failed to load customers.</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 16px" }}>
          <Users size={24} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
            {search ? "No customers match your search" : "No customers yet"}
          </p>
          {!search && (
            <button
              onClick={() => setShowNew(true)}
              style={{ fontSize: "14px", color: "#0f6e56", fontWeight: "500", background: "none", border: "none", cursor: "pointer", marginTop: "8px" }}
            >
              Add your first customer →
            </button>
          )}
        </div>
      )}

      {/* Customer list */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((customer: any) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      )}

      {showNew && <NewCustomerModal onClose={() => setShowNew(false)} />}
    </div>
  );
}