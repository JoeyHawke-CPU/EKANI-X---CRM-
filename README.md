# EKANI CRM

**EKANI CRM** is a custom customer relationship management platform designed to help businesses manage leads, clients, follow-ups, appointments, sales pipelines, and internal workflows from one centralized system.

The project is built for businesses that need a practical, lightweight, and customizable CRM instead of relying on complicated enterprise tools.

---

## Overview

EKANI CRM is designed to support business operations by giving teams a clear system to track inquiries, manage customer relationships, monitor sales activity, and organize daily follow-ups.

The platform focuses on simplicity, usability, and practical business workflows.

It can be used by service businesses, consultants, agencies, training institutes, clinics, salons, real estate teams, and SMEs that need better visibility over leads and customer communication.

---

## Purpose

The purpose of EKANI CRM is to help businesses:

* Capture and organize leads
* Track customer interactions
* Manage sales opportunities
* Follow up with prospects
* Monitor team activity
* Improve response times
* Reduce manual tracking
* Centralize customer data
* Improve business visibility

---

## Key Features

* Lead management
* Customer database
* Sales pipeline tracking
* Follow-up management
* Contact history
* Task and reminder tracking
* Appointment or inquiry management
* Status-based lead filtering
* Dashboard overview
* Search and filtering
* Notes and activity logs
* User-friendly CRM interface
* Responsive layout for desktop and mobile
* Custom workflow-ready structure

---

## Main Modules

The CRM may include the following modules:

1. Dashboard
2. Leads
3. Customers
4. Deals / Opportunities
5. Follow-ups
6. Tasks
7. Appointments
8. Notes
9. Reports
10. Team Members
11. Settings

---

## CRM Workflow

A typical workflow inside EKANI CRM:

1. A new inquiry or lead is added.
2. The lead is assigned a status.
3. The team adds notes and follow-up actions.
4. The lead moves through the sales pipeline.
5. Tasks or reminders are created.
6. The customer is converted once the deal is closed.
7. Reports help track performance and pending actions.

---

## Possible Lead Statuses

The CRM can support statuses such as:

* New Lead
* Contacted
* Interested
* Follow-up Required
* Proposal Sent
* Negotiation
* Converted
* Lost
* Not Interested

---

## Possible Use Cases

EKANI CRM can be adapted for:

* AI consultancy lead management
* Website development inquiries
* Voice agent client onboarding
* Training institute admissions
* Sales pipeline tracking
* Customer support follow-ups
* Appointment-based businesses
* Real estate lead tracking
* Service provider CRM workflows
* SME customer management

---

## Technology Stack

This project may use:

* React
* Vite
* TypeScript
* Tailwind CSS
* shadcn/ui
* Supabase / Firebase / custom backend
* Responsive design
* Component-based architecture

> Update this section based on the actual project stack.

---

## Project Structure

```bash id="kut9wp"
ekani-crm/
├── public/
│   └── assets/
├── src/
│   ├── components/
│   ├── pages/
│   ├── data/
│   ├── hooks/
│   ├── lib/
│   └── App.tsx
├── package.json
├── README.md
└── vite.config.ts
```

---

## Getting Started

### 1. Clone the Repository

```bash id="l3pl28"
git clone https://github.com/JoeyHawke-CPU/ekani-crm.git
cd ekani-crm
```

### 2. Install Dependencies

```bash id="cnrr75"
npm install
```

### 3. Run the Development Server

```bash id="p2kh91"
npm run dev
```

The project should now run locally.

Default local URL:

```bash id="vezp4r"
http://localhost:5173
```

---

## Build for Production

To create a production-ready build:

```bash id="c6sh8m"
npm run build
```

To preview the production build locally:

```bash id="bnw1q3"
npm run preview
```

---

## Environment Variables

If the project uses a backend or database service, create a `.env` file in the root directory.

Example:

```env id="v98ova"
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=your_api_base_url
```

> Do not commit sensitive API keys or private credentials to GitHub.

---

## Design Direction

EKANI CRM follows a clean, modern, and practical interface style.

The design should feel:

* Simple
* Professional
* Fast
* Clean
* Business-friendly
* Easy to understand
* Useful for non-technical users

The goal is not to create an overloaded CRM. The goal is to create a CRM that businesses will actually use every day.

---

## Future Enhancements

Possible future improvements include:

* Authentication and role-based access
* Admin dashboard
* Team assignment
* WhatsApp integration
* Email integration
* AI follow-up suggestions
* AI lead scoring
* Automated reminders
* Proposal generation
* Invoice management
* Customer support ticketing
* Sales reports
* Analytics dashboard
* CSV import/export
* Mobile app version
* Multi-language support
* Dark mode

---

## Deployment

This project can be deployed using:

* Vercel
* Netlify
* Cloudflare Pages
* GitHub Pages
* Custom VPS hosting

For Vercel deployment, connect this GitHub repository and deploy the production build.

---

## Maintainer

Developed and maintained by:

**Josseph John**
GM / CTO
EKANI AI Consultancy

Website: [www.ekani.ai](https://www.ekani.ai)
Portfolio: [www.jossephjohn.com](https://www.jossephjohn.com)
Email: [hello@ekani.ai](mailto:hello@ekani.ai)

---

## License

This project is proprietary and intended for EKANI AI Consultancy and approved client use.

All rights reserved.

Unauthorized copying, distribution, modification, or commercial use of this project without written permission is strictly prohibited.
