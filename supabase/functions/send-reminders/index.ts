import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("APP_SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function buildEmailHTML(customerName: string, businessName: string, appointmentTime: string, triggerType: string): string {
  const isClose = triggerType === "2h";
  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <div style="margin-bottom: 24px;">
    <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 8px;">
      ${isClose ? "Your appointment is in 2 hours" : "Appointment reminder for tomorrow"}
    </h2>
    <p style="color: #666; margin: 0;">
      Hi ${customerName}, this is a reminder about your upcoming appointment with <strong>${businessName}</strong>.
    </p>
  </div>
  <div style="background: #f4f4f4; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 18px; font-weight: 600;">${appointmentTime}</p>
  </div>
  <p style="color: #999; font-size: 13px;">
    Need to cancel or reschedule? Contact ${businessName} directly.
  </p>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<string> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "onboarding@resend.dev",
      to,
      subject,
      html,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data));
  return data.id;
}

Deno.serve(async (_req) => {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in26h = new Date(now.getTime() + 26 * 60 * 60 * 1000);
    const in2h  = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const in4h  = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(`
        id, starts_at, title, channel, reminder_24h, reminder_2h, account_id,
        customers ( name, email ),
        accounts ( business_name, timezone, subscription_status )
      `)
      .eq("status", "scheduled")
      .or(
        `and(starts_at.gte.${in24h.toISOString()},starts_at.lte.${in26h.toISOString()}),` +
        `and(starts_at.gte.${in2h.toISOString()},starts_at.lte.${in4h.toISOString()})`
      );

    if (error) throw new Error(`DB error: ${error.message}`);
    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({ message: "No reminders due", sent: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let failed = 0;
    const results: any[] = [];

    for (const appt of appointments) {
      const customer = appt.customers as any;
      const account  = appt.accounts as any;

      if (!customer?.email) continue;
      if (appt.channel === "sms") continue;

      const startsAt   = new Date(appt.starts_at);
      const hoursUntil = (startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      const triggerType = hoursUntil <= 4 ? "2h" : "24h";

      if (triggerType === "2h" && !appt.reminder_2h) continue;
      if (triggerType === "24h" && !appt.reminder_24h) continue;

      // Check if already sent
      const { data: existing } = await supabase
        .from("reminder_logs")
        .select("id")
        .eq("appointment_id", appt.id)
        .eq("channel", "email")
        .eq("trigger_type", triggerType)
        .eq("status", "sent")
        .maybeSingle();

      if (existing) continue;

      // Create pending log
      const { data: log } = await supabase
        .from("reminder_logs")
        .insert({
          appointment_id: appt.id,
          account_id: appt.account_id,
          channel: "email",
          trigger_type: triggerType,
          status: "pending",
        })
        .select("id")
        .single();

      const timeStr = new Intl.DateTimeFormat("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit",
        timeZone: account?.timezone ?? "UTC",
      }).format(startsAt);

      const subject = triggerType === "2h"
        ? `Your appointment is in 2 hours — ${timeStr}`
        : `Appointment reminder for tomorrow — ${timeStr}`;

      try {
        const emailId = await sendEmail(
          customer.email,
          subject,
          buildEmailHTML(customer.name, account?.business_name ?? "your provider", timeStr, triggerType)
        );

        await supabase.from("reminder_logs").update({
          status: "sent",
          provider_id: emailId,
          sent_at: new Date().toISOString(),
        }).eq("id", log.id);

        sent++;
        results.push({ appointment_id: appt.id, status: "sent", emailId });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await supabase.from("reminder_logs").update({
          status: "failed",
          error_message: msg,
        }).eq("id", log.id);
        failed++;
        results.push({ appointment_id: appt.id, status: "failed", error: msg });
      }
    }

    return new Response(JSON.stringify({ sent, failed, results }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});