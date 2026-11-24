# PlaceOn — Campus Placement Monitor (IU Jaipur)

A full-stack placement monitoring platform built with **Next.js (App Router)**, **Tailwind CSS**, **Supabase** (Google OAuth, PostgreSQL, Row-Level Security, Storage), **Resend** (automated drive alert emails), and **jsPDF** (PDF shortlist export with clickable CV links).

---

## Features

- **Role Selection Portal (`/`)**: Separate entry points for **Students** and **Admins**.
- **Constrained Google OAuth**:
  - **Student Login (`/login/student`)**: Restricted to `@iujaipur.edu.in` Google accounts.
  - **Admin Login (`/login/admin`)**: Restricted to whitelisted admin emails (`ADMIN_EMAILS` env variable + `admin_whitelist` table).
- **Student Dashboard (`/student`)**:
  - Editable academic profile: Full Name, Course (`B.Tech`, `M.Tech`, `BCA`, `MCA`, `BBA`, `MBA`), Branch/Specialization, Current Year, Current Semester.
  - Dynamic past semester score fields (for Semester `N`, generates inputs for Semesters `1..N-1`) with a `CGPA (0-10)` / `Percentage (%)` toggle.
  - Class 10th & Class 12th scores, Educational Achievements (up to Class 12th), and PDF CV/Resume upload to a private Supabase Storage bucket.
  - Live company drives list with eligibility checks and **Interested / Not Interested** toggle until the deadline.
- **Admin Dashboard (`/admin`)**:
  - Post new company drives with optional eligibility filters (allowed courses, min 10th/12th/CGPA).
  - Automatically emails all registered students via **Resend** when a new company is listed.
  - View **Interested Students** per company and download the shortlist as a formatted landscape **PDF** containing academic details and clickable CV links.
  - Searchable **All Registered Students** directory with CV downloads and **Admin Whitelist** management.

---

## Setup Guide

### 1. Supabase Project Setup
1. Create a project on [Supabase](https://supabase.com).
2. Open the **SQL Editor** and run the entire contents of [`supabase/schema.sql`](./supabase/schema.sql).
3. Go to **Authentication -> Providers -> Google**, enable it, and add your Google Cloud OAuth Client ID & Client Secret.
4. Under **Authentication -> URL Configuration**, add your Redirect URLs:
   - Local: `http://localhost:3000/auth/callback`
   - Production (Vercel): `https://your-vercel-domain.vercel.app/auth/callback`

### 2. Resend Setup (Automated Emails)
1. Create an account at [Resend](https://resend.com) and generate an API key (`RESEND_API_KEY`).
2. Verify your sending domain in Resend (or use `onboarding@resend.dev` for testing with your Resend account email).

### 3. Environment Variables
Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Key variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_ALLOWED_STUDENT_DOMAIN=iujaipur.edu.in`
- `ADMIN_EMAILS=admin1@iujaipur.edu.in,admin2@gmail.com`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_APP_URL`

### 4. Run Locally

```bash
npm install
npm run dev
```

### 5. Deploy on Vercel
1. Push this repository to GitHub/GitLab/Bitbucket.
2. Import the project in **Vercel**, add all environment variables from `.env.example` (set `NEXT_PUBLIC_APP_URL` to your production URL), and deploy.
