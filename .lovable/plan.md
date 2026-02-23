

# EKANI Sales CRM — Implementation Plan

## Phase 1: Foundation (Core)

### 1. Supabase Setup & Authentication
- Connect Supabase and configure Google OAuth
- Create the full database schema: `sales_executives` table, `leads` table, enums (`user_role`, `lead_status`), generated columns (days_to_close, commission_eligible, commission_amount), indexes, and `updated_at` triggers
- Create the `is_admin()` helper function and all RLS policies (reps see own data, admins see all)
- Create export views (`v_my_leads_export`, `v_admin_leads_export`, `v_commission_payout_report`)
- Auto-create a `sales_executives` record on first Google sign-in; first-ever signup gets `admin` role

### 2. Login & Role Routing
- Google sign-in page with clean, white SaaS design and teal/cyan accents
- After login, route to Sales Rep Dashboard or Super Admin Dashboard based on role
- Protected routes — unauthenticated users redirected to login

### 3. Sales Rep Dashboard
- **KPI Cards**: Total Leads, Active Pipeline, Closed–Delivered, Paid–In Production, Revenue Closed (KD), Total Commissions (KD), Overdue Follow-Ups
- **Status Breakdown Chart** (bar or donut)
- **Follow-Ups Panel**: Due Today + Overdue (red highlight)
- **"My Profile" Card**: name, civil ID, contact, email, date joined, commission %, clients visited, clients closed, revenue, commissions
- **Lead Table**: searchable, filterable by status/lead source/solution/date, sortable columns, inline quick-edit for key fields

### 4. Lead Create / Edit Form (Step-Based)
- **Step 1 — Client Info**: business name, contact person, phone, WhatsApp, email, governorate → area (hierarchical dropdown with Kuwait governorates & areas), full address
- **Step 2 — Qualification**: lead source (controlled dropdown), domain status, decision maker confirmed, budget confirmed, timeline days
- **Step 3 — Financials**: solution selected (dropdown: Webbex, Bolloh, Marketing Package, WhatsApp Business API, AI UGC Ads, Other), add-ons (multi-select: Maintenance, SEO-AEO, Marketing, Extra Pages, E-Commerce), quoted amount, final agreed amount, commission %
- **Step 4 — Delivery & Tracking**: intake form, payment link sent, payment received, invoice generated, production deadline, preview sent, go-live date, 7-day follow-up, refund/cancellation, escalation, follow-up due date, remarks, status
- All dropdowns are controlled (no free-text) to maintain data integrity

### 5. Super Admin Dashboard
- **Global KPI Cards**: total leads, total revenue, pipeline value, total commissions liability, active reps, overdue follow-ups, conversion rate, avg days to close
- **Sales Rep Performance Table**: each rep's leads, meetings scheduled, deals confirmed, closed delivered, revenue, commission, conversion rate, avg days to close — click row to drill down into that rep's leads
- **Admin Lead Management**: view/edit any lead, override commission %, lock closed deals

---

## Phase 2: Analytics & Reports

### 6. Admin Analytics Charts
- Monthly revenue trend line chart
- Monthly commission trend line chart
- Lead source breakdown (pie/bar)
- Solution/package breakdown
- Average deal size
- Refund rate
- Close rate by rep

### 7. Reporting Module — Sales Rep
- **Performance Summary Report** (PDF via jsPDF + CSV): header with rep info & date range, KPI summary block, clean deal summary table (Lead ID, Date, Client, Source, Solution, Amount, Status, Payment, Commission)
- **Detailed CRM Export** (CSV only): all lead columns except internal timestamps
- Filters: date range, status, solution, lead source, payment received

### 8. Reporting Module — Super Admin
- **Global Sales Performance Report** (PDF + CSV): date range header, totals, per-rep performance table
- **Commission Payout Report** (PDF + CSV): rep name/email, lead details, commission calculations — default filtered to payment received + commission eligible
- **Full CRM Master Export** (CSV): all data, no restrictions
- Smart toggles: "Include Only Commission Eligible", "Include Only Paid Deals", "Include Closed Delivered Only"
- Filters: date range, rep selection, status, lead source, payment received, commission eligible

### 9. Activity Log (Admin)
- Track key actions (lead created, status changed, commission overridden) with timestamps and actor

---

## Design & UX Notes
- Clean white SaaS UI with teal/cyan accents on buttons, toggles, tags, and active states
- Fast data-entry UX: tab-friendly forms, smart defaults, auto-populated fields
- Responsive layout optimized for desktop use
- All computed fields (days to close, commission eligibility, commission amount) calculated at the database level via generated columns

