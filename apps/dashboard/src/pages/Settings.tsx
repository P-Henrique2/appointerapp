import React, { useState, useEffect } from "react";
import { Check, Loader2, Bell, Building2, Mail } from "lucide-react";
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

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useAccountSettings() {
  const { account } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["account-settings", account?.id],
    queryFn: async () => {
      if (!account?.id) return null;
      const { data, error } = await supabase
        .from("account_settings")
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
        .from("account_settings")
        .update(updates)
        .eq("account_id", account.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-settings", account?.id] });
    },
  });

  return { settings: query.data, isLoading: query.isLoading, save: mutation };
}

function useUpdateAccount() {
  const { account, refreshAccount } = useAuth();

  return useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (!account?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("accounts")
        .update(updates)
        .eq("id", account.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => refreshAccount(),
  });
}

// ── Token helper ──────────────────────────────────────────────────────────────
function TokenHint() {
  return (
    <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "6px" }}>
      Available tokens: <code style={{ background: "#f3f4f6", padding: "1px 4px", borderRadius: "4px" }}>{"{{name}}"}</code>{" "}
      <code style={{ background: "#f3f4f6", padding: "1px 4px", borderRadius: "4px" }}>{"{{time}}"}</code>{" "}
      <code style={{ background: "#f3f4f6", padding: "1px 4px", borderRadius: "4px" }}>{"{{business}}"}</code>
    </p>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────
export default function Settings() {
  const { account } = useAuth();
  const { settings, isLoading, save: saveSettings } = useAccountSettings();
  const updateAccount = useUpdateAccount();
  const queryClient = useQueryClient();

  // Business info
  const [businessName, setBusinessName] = useState("");
  const [timezone, setTimezone]         = useState("America/New_York");

  // Reminder templates
  const [sms24h, setSms24h]       = useState("");
  const [sms2h, setSms2h]         = useState("");
  const [emailSubject, setEmailSubject] = useState("");

  // Notifications
  const [notifyCancel, setNotifyCancel]   = useState(true);
  const [notifyBooking, setNotifyBooking] = useState(true);
  const [notifyEmail, setNotifyEmail]     = useState("");

  // Save states
  const [savedBiz, setSavedBiz]         = useState(false);
  const [savedTemplates, setSavedTemplates] = useState(false);
  const [savedNotify, setSavedNotify]   = useState(false);

  // Sync when data loads
  useEffect(() => {
    if (account) {
      setBusinessName(account.business_name ?? "");
      setTimezone(account.timezone ?? "America/New_York");
    }
  }, [account]);

  useEffect(() => {
    if (settings) {
      setSms24h(settings.sms_template_24h ?? "");
      setSms2h(settings.sms_template_2h ?? "");
      setEmailSubject(settings.email_subject ?? "");
      setNotifyCancel(settings.notify_on_cancel ?? true);
      setNotifyBooking(settings.notify_on_booking ?? true);
      setNotifyEmail(settings.owner_notify_email ?? "");
    }
  }, [settings]);

  async function handleSaveBusiness() {
    await updateAccount.mutateAsync({ business_name: businessName, timezone });
    setSavedBiz(true);
    setTimeout(() => setSavedBiz(false), 2000);
  }

  async function handleSaveTemplates() {
    await saveSettings.mutateAsync({
      sms_template_24h: sms24h,
      sms_template_2h: sms2h,
      email_subject: emailSubject,
    });
    setSavedTemplates(true);
    setTimeout(() => setSavedTemplates(false), 2000);
  }

  async function handleSaveNotifications() {
    await saveSettings.mutateAsync({
      notify_on_cancel: notifyCancel,
      notify_on_booking: notifyBooking,
      owner_notify_email: notifyEmail || null,
    });
    setSavedNotify(true);
    setTimeout(() => setSavedNotify(false), 2000);
  }

  if (isLoading) {
    return (
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "32px 16px" }}>
        <p style={{ color: "#6b7280", fontSize: "14px" }}>Loading settings…</p>
      </div>
    );
  }

  const TIMEZONES = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Sao_Paulo",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Sydney",
    "Australia/Sydney",
  ];

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "32px 16px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "600", color: "#111", margin: 0 }}>Settings</h1>
        <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
          Manage your business info and reminder preferences.
        </p>
      </div>

      {/* ── Business info ── */}
      <Section title="Business info" icon={Building2}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div>
            <label style={lbl}>Business name</label>
            <input
              style={inp}
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="My Business"
            />
          </div>
          <div>
            <label style={lbl}>Timezone</label>
            <select style={inp} value={timezone} onChange={e => setTimezone(e.target.value)}>
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Plan info */}
        <div style={{ background: "#f9fafb", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "500", color: "#111" }}>
              Current plan: <span style={{ textTransform: "capitalize" }}>{account?.plan ?? "starter"}</span>
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }}>
              Free plan — unlimited access
            </p>
          </div>
          <span style={{ fontSize: "11px", background: "#f0fdf4", color: "#15803d", padding: "3px 8px", borderRadius: "20px", fontWeight: "500" }}>
            {account?.appointments_this_month ?? 0} appts this month
          </span>
        </div>

        <button
          onClick={handleSaveBusiness}
          disabled={updateAccount.isPending}
          style={{ background: savedBiz ? "#15803d" : "#0f6e56", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "14px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          {savedBiz ? <><Check size={14} /> Saved!</> : updateAccount.isPending ? "Saving…" : "Save business info"}
        </button>
      </Section>

      {/* ── Reminder templates ── */}
      <Section title="Reminder message templates" icon={Bell}>
        <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>
          Customize the messages sent to your customers before their appointments.
        </p>

        <div style={{ marginBottom: "16px" }}>
          <label style={lbl}>SMS — 24 hours before</label>
          <textarea
            style={{ ...inp, resize: "vertical", minHeight: "72px" }}
            value={sms24h}
            onChange={e => setSms24h(e.target.value)}
          />
          <TokenHint />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={lbl}>SMS — 2 hours before</label>
          <textarea
            style={{ ...inp, resize: "vertical", minHeight: "72px" }}
            value={sms2h}
            onChange={e => setSms2h(e.target.value)}
          />
          <TokenHint />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={lbl}>Email subject line</label>
          <input
            style={inp}
            value={emailSubject}
            onChange={e => setEmailSubject(e.target.value)}
            placeholder="Appointment reminder — {{time}}"
          />
          <TokenHint />
        </div>

        <button
          onClick={handleSaveTemplates}
          disabled={saveSettings.isPending}
          style={{ background: savedTemplates ? "#15803d" : "#0f6e56", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "14px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          {savedTemplates ? <><Check size={14} /> Saved!</> : saveSettings.isPending ? "Saving…" : "Save templates"}
        </button>
      </Section>

      {/* ── Notifications ── */}
      <Section title="Owner notifications" icon={Mail}>
        <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>
          Get notified when customers book or cancel through the widget.
        </p>

        <div style={{ marginBottom: "14px" }}>
          <label style={lbl}>Notification email</label>
          <input
            style={inp}
            type="email"
            value={notifyEmail}
            onChange={e => setNotifyEmail(e.target.value)}
            placeholder="you@yourbusiness.com"
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
          {[
            { label: "Email me when a customer cancels", value: notifyCancel, set: setNotifyCancel },
            { label: "Email me when a customer books via widget", value: notifyBooking, set: setNotifyBooking },
          ].map(({ label, value, set }) => (
            <label key={label} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={value}
                onChange={e => set(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "#0f6e56", cursor: "pointer" }}
              />
              <span style={{ fontSize: "14px", color: "#374151" }}>{label}</span>
            </label>
          ))}
        </div>

        <button
          onClick={handleSaveNotifications}
          disabled={saveSettings.isPending}
          style={{ background: savedNotify ? "#15803d" : "#0f6e56", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "14px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          {savedNotify ? <><Check size={14} /> Saved!</> : saveSettings.isPending ? "Saving…" : "Save notifications"}
        </button>
      </Section>
    </div>
  );
}