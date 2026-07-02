import React, { useState } from "react";
import { Code, Copy, Check, Globe, Clock, Palette } from "lucide-react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 12px", fontSize: "14px",
  border: "1px solid #e5e7eb", borderRadius: "8px",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

const lbl: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: "500",
  color: "#374151", marginBottom: "6px",
};

// ── Hook: load and save widget config ─────────────────────────────────────────
function useWidgetConfig() {
  const { account } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["widget-config", account?.id],
    queryFn: async () => {
      if (!account?.id) return null;
      const { data, error } = await supabase
        .from("widget_configs")
        .select("*")
        .eq("account_id", account.id)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!account?.id,
  });

  const mutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (!account?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("widget_configs")
        .update(updates)
        .eq("account_id", account.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widget-config", account?.id] });
    },
  });

  return { config: query.data, isLoading: query.isLoading, save: mutation };
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: copied ? "#f0fdf4" : "#f3f4f6", color: copied ? "#15803d" : "#374151", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "500", cursor: "pointer", transition: "all 0.15s" }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 16px", borderBottom: "1px solid #f3f4f6" }}>
        <Icon size={15} color="#0f6e56" />
        <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#111" }}>{title}</h2>
      </div>
      <div style={{ padding: "16px" }}>
        {children}
      </div>
    </div>
  );
}

// ── Main Widget Page ──────────────────────────────────────────────────────────
export default function Widget() {
  const { account } = useAuth();
  const { config, isLoading, save } = useWidgetConfig();
  const [saved, setSaved] = useState(false);

  // Local form state
  const [buttonText, setButtonText]   = useState("");
  const [color, setColor]             = useState("#0f6e56");
  const [slotDuration, setSlotDuration] = useState("60");
  const [advanceDays, setAdvanceDays] = useState("30");
  const [isActive, setIsActive]       = useState(true);

  // Sync form state when config loads
  React.useEffect(() => {
    if (config) {
      setButtonText(config.button_text ?? "Book an appointment");
      setColor(config.primary_color ?? "#0f6e56");
      setSlotDuration(String(config.slot_duration_mins ?? 60));
      setAdvanceDays(String(config.advance_booking_days ?? 30));
      setIsActive(config.is_active ?? true);
    }
  }, [config]);

  const widgetUrl = `${window.location.origin}/widget/remindly-widget.min.js`;

  const embedSnippet = account
    ? `<!-- Remindly Booking Widget -->
<div id="remindly-widget" data-account="${account.id}"></div>
<script src="${widgetUrl}" defer></script>`
    : "Loading...";

  async function handleSave() {
    await save.mutateAsync({
      button_text: buttonText,
      primary_color: color,
      slot_duration_mins: parseInt(slotDuration),
      advance_booking_days: parseInt(advanceDays),
      is_active: isActive,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (isLoading) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 16px" }}>
        <p style={{ color: "#6b7280", fontSize: "14px" }}>Loading widget settings…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "32px 16px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "600", color: "#111", margin: 0 }}>Booking widget</h1>
        <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
          Paste the snippet below on any website to add a booking button.
        </p>
      </div>

      {/* ── Embed snippet ── */}
      <Section title="Your embed snippet" icon={Code}>
        <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>
          Copy this code and paste it anywhere in your website's HTML — inside a page, a contact section, or a sidebar.
        </p>
        <div style={{ background: "#0f172a", borderRadius: "8px", padding: "16px", position: "relative" }}>
          <pre style={{ margin: 0, fontSize: "12px", color: "#7dd3fc", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {embedSnippet}
          </pre>
          <div style={{ position: "absolute", top: "10px", right: "10px" }}>
            <CopyButton text={embedSnippet} />
          </div>
        </div>
        <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "10px" }}>
          💡 The widget loads automatically when the page opens. No extra setup needed.
        </p>
      </Section>

      {/* ── Widget status ── */}
      <Section title="Widget status" icon={Globe}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: "500", color: "#111" }}>
              {isActive ? "Widget is active" : "Widget is disabled"}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6b7280" }}>
              {isActive ? "Customers can book appointments through your widget." : "Your booking widget is currently hidden."}
            </p>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            style={{ padding: "6px 14px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "500", background: isActive ? "#fef2f2" : "#f0fdf4", color: isActive ? "#dc2626" : "#15803d" }}
          >
            {isActive ? "Disable" : "Enable"}
          </button>
        </div>
      </Section>

      {/* ── Appearance ── */}
      <Section title="Appearance" icon={Palette}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={lbl}>Button text</label>
            <input
              style={inp}
              value={buttonText}
              onChange={e => setButtonText(e.target.value)}
              placeholder="Book an appointment"
            />
          </div>
          <div>
            <label style={lbl}>Brand color</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                style={{ width: "42px", height: "42px", borderRadius: "8px", border: "1px solid #e5e7eb", cursor: "pointer", padding: "2px" }}
              />
              <input
                style={{ ...inp, flex: 1 }}
                value={color}
                onChange={e => setColor(e.target.value)}
                placeholder="#0f6e56"
              />
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div style={{ marginTop: "16px", padding: "16px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#9ca3af" }}>Live preview</p>
          <button style={{ padding: "10px 20px", background: color, color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>
            {buttonText || "Book an appointment"}
          </button>
        </div>
      </Section>

      {/* ── Booking rules ── */}
      <Section title="Booking rules" icon={Clock}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={lbl}>Appointment duration</label>
            <select style={inp} value={slotDuration} onChange={e => setSlotDuration(e.target.value)}>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>
          <div>
            <label style={lbl}>How far ahead can customers book?</label>
            <select style={inp} value={advanceDays} onChange={e => setAdvanceDays(e.target.value)}>
              <option value="7">1 week</option>
              <option value="14">2 weeks</option>
              <option value="30">1 month</option>
              <option value="60">2 months</option>
              <option value="90">3 months</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={save.isPending}
        style={{ width: "100%", background: saved ? "#15803d" : "#0f6e56", color: "white", border: "none", borderRadius: "8px", padding: "12px", fontSize: "14px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "background 0.2s" }}
      >
        {saved ? <><Check size={16} /> Saved!</> : save.isPending ? "Saving…" : "Save widget settings"}
      </button>
    </div>
  );
}