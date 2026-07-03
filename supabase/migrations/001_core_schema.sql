create type plan_tier as enum ('starter', 'growth', 'pro');
create type appointment_status as enum ('scheduled', 'confirmed', 'cancelled', 'no_show', 'completed');
create type reminder_channel as enum ('sms', 'email', 'both');
create type reminder_status as enum ('pending', 'sent', 'failed', 'skipped');

create table public.accounts (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  business_name text not null check (char_length(business_name) between 2 and 100),
  timezone      text not null default 'America/New_York',
  plan          plan_tier not null default 'starter',
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  subscription_status     text default 'trialing',
  trial_ends_at           timestamptz default (now() + interval '14 days'),
  appointments_this_month integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint one_account_per_owner unique (owner_id)
);

create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 100),
  email       text,
  phone       text,
  notes       text,
  created_at  timestamptz not null default now()
);

create index idx_customers_account on public.customers(account_id);

create table public.appointments (
  id             uuid primary key default gen_random_uuid(),
  account_id     uuid not null references public.accounts(id) on delete cascade,
  customer_id    uuid not null references public.customers(id) on delete restrict,
  title          text not null check (char_length(title) between 1 and 200),
  notes          text,
  starts_at      timestamptz not null,
  duration_mins  integer not null default 60 check (duration_mins between 5 and 480),
  status         appointment_status not null default 'scheduled',
  reminder_24h   boolean not null default true,
  reminder_2h    boolean not null default true,
  channel        reminder_channel not null default 'both',
  booked_via_widget boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_appointments_account on public.appointments(account_id);
create index idx_appointments_starts_at on public.appointments(starts_at);
create index idx_appointments_customer on public.appointments(customer_id);

create table public.reminder_logs (
  id              uuid primary key default gen_random_uuid(),
  appointment_id  uuid not null references public.appointments(id) on delete cascade,
  account_id      uuid not null references public.accounts(id) on delete cascade,
  channel         text not null,
  trigger_type    text not null,
  status          reminder_status not null default 'pending',
  provider_id     text,
  error_message   text,
  sent_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index idx_reminder_logs_appointment on public.reminder_logs(appointment_id);

create table public.account_settings (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts(id) on delete cascade unique,
  sms_template_24h  text not null default 'Hi {{name}}, reminder: you have an appointment with {{business}} tomorrow at {{time}}. Reply YES to confirm or NO to cancel.',
  sms_template_2h   text not null default 'Hi {{name}}, your appointment with {{business}} is in 2 hours at {{time}}. See you soon!',
  email_subject     text not null default 'Appointment reminder — {{time}}',
  notify_on_cancel  boolean not null default true,
  notify_on_booking boolean not null default true,
  owner_notify_email text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.widget_configs (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid not null references public.accounts(id) on delete cascade unique,
  primary_color   text not null default '#0F6E56',
  button_text     text not null default 'Book an appointment',
  slot_duration_mins    integer not null default 60,
  advance_booking_days  integer not null default 30,
  buffer_mins           integer not null default 0,
  business_hours  jsonb not null default '{"mon":{"open":"09:00","close":"17:00"},"tue":{"open":"09:00","close":"17:00"},"wed":{"open":"09:00","close":"17:00"},"thu":{"open":"09:00","close":"17:00"},"fri":{"open":"09:00","close":"17:00"}}',
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plan_limits (
  plan               plan_tier primary key,
  max_appointments_monthly integer not null,
  max_locations      integer not null,
  sms_enabled        boolean not null,
  email_enabled      boolean not null,
  custom_branding    boolean not null,
  cancellation_capture boolean not null
);

insert into public.plan_limits values
  ('starter', 100,  1, true, true, false, false),
  ('growth',  400,  1, true, true, true,  true),
  ('pro',     9999, 3, true, true, true,  true);

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_accounts
  before update on public.accounts
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_appointments
  before update on public.appointments
  for each row execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  new_account_id uuid;
begin
  insert into public.accounts (owner_id, business_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'business_name', 'My Business')
  )
  returning id into new_account_id;
  
  insert into public.account_settings (account_id)
  values (new_account_id);
  
  insert into public.widget_configs (account_id)
  values (new_account_id);
  
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.my_account_id()
returns uuid language sql security definer stable as $$
  select id from public.accounts where owner_id = auth.uid()
$$;

alter table public.accounts           enable row level security;
alter table public.customers          enable row level security;
alter table public.appointments       enable row level security;
alter table public.reminder_logs      enable row level security;
alter table public.account_settings   enable row level security;
alter table public.widget_configs     enable row level security;
alter table public.plan_limits        enable row level security;

create policy "owners can view their own account"
  on public.accounts for select
  using (owner_id = auth.uid());

create policy "owners can update their own account"
  on public.accounts for update
  using (owner_id = auth.uid());

create policy "owners can manage their customers"
  on public.customers for all
  using (account_id = public.my_account_id());

create policy "owners can manage their appointments"
  on public.appointments for all
  using (account_id = public.my_account_id());

create policy "owners can view their reminder logs"
  on public.reminder_logs for select
  using (account_id = public.my_account_id());

create policy "owners can manage their settings"
  on public.account_settings for all
  using (account_id = public.my_account_id());

create policy "owners can manage their widget config"
  on public.widget_configs for all
  using (account_id = public.my_account_id());

create policy "plan limits are publicly readable"
  on public.plan_limits for select
  using (true);