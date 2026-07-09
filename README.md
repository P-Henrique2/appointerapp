# AppointerApp

A SaaS appointment reminder web app for small businesses. Business owners can manage appointments, customers, and automatically send email reminders to reduce no-shows.

**Live demo:** https://appointerapp.vercel.app

## Features

- 📅 Appointment management — create, confirm, and cancel appointments
- 👥 Customer management — add and search customers
- 📧 Automated email reminders — sends 24h and 2h before appointments automatically
- 🔧 Embeddable booking widget — businesses paste one script tag on their website
- ⚙️ Customizable settings — reminder templates, business info, notification preferences

## Tech stack

- **Frontend:** React, TypeScript, Vite, TanStack Query
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **Email:** Resend API
- **Hosting:** Vercel
- **Scheduling:** Supabase pg_cron (runs every 15 minutes)

## Architecture

React Dashboard (Vercel)
↓
Supabase (Database + Auth + Edge Functions)
↓
Resend API (Email reminders)

## Running locally

### Prerequisites
- Node.js 20+
- Docker Desktop
- Supabase CLI

### Setup

1. Clone the repo
```bash
git clone https://github.com/P-Henrique2/remindly.git
cd remindly
```

2. Install dependencies
```bash
npm install
```

3. Start local Supabase
```bash
supabase start --ignore-health-check
```

4. Apply database migrations
```bash
supabase db push
```

5. Create environment file
```bash
# Create apps/dashboard/.env.local with:
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
VITE_APP_URL=http://localhost:5173
VITE_WIDGET_URL=http://localhost:5174
```

6. Start the dashboard
```bash
npm run dev:dashboard
```

Open http://localhost:5173

## Project structure

remindly/
├── apps/
│   ├── dashboard/     # React frontend (business owner dashboard)
│   └── widget/        # Embeddable vanilla JS booking widget
├── packages/
│   └── shared/        # Shared TypeScript types
├── supabase/
│   ├── migrations/    # Database schema and RLS policies
│   └── functions/     # Edge Functions (email reminders)
└── docs/              # Setup documentation

## Author

Made by [Pedro Henrique](https://github.com/P-Henrique2) with help of AI