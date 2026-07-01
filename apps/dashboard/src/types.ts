export type PlanTier = "starter" | "growth" | "pro";
export type AppointmentStatus = "scheduled" | "confirmed" | "cancelled" | "no_show" | "completed";
export type ReminderChannel = "sms" | "email" | "both";

export interface Account {
  id: string;
  owner_id: string;
  business_name: string;
  timezone: string;
  plan: PlanTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  trial_ends_at: string | null;
  appointments_this_month: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  account_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  account_id: string;
  customer_id: string;
  title: string;
  notes: string | null;
  starts_at: string;
  duration_mins: number;
  status: AppointmentStatus;
  reminder_24h: boolean;
  reminder_2h: boolean;
  channel: ReminderChannel;
  booked_via_widget: boolean;
  created_at: string;
  updated_at: string;
  customers?: Customer;
}

export interface ReminderLog {
  id: string;
  appointment_id: string;
  account_id: string;
  channel: string;
  trigger_type: string;
  status: "pending" | "sent" | "failed" | "skipped";
  provider_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface AccountSettings {
  id: string;
  account_id: string;
  sms_template_24h: string;
  sms_template_2h: string;
  email_subject: string;
  notify_on_cancel: boolean;
  notify_on_booking: boolean;
  owner_notify_email: string | null;
}

export interface WidgetConfig {
  id: string;
  account_id: string;
  primary_color: string;
  button_text: string;
  slot_duration_mins: number;
  advance_booking_days: number;
  buffer_mins: number;
  business_hours: BusinessHours;
  is_active: boolean;
}

export interface BusinessHours {
  mon?: DayHours;
  tue?: DayHours;
  wed?: DayHours;
  thu?: DayHours;
  fri?: DayHours;
  sat?: DayHours;
  sun?: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
}