-- PlaceOn (IU Jaipur Placement Monitor) - Supabase Database Schema
-- Run this entire script in your Supabase SQL Editor.

-- 1. Extensions
create extension if not exists "pgcrypto";

-- 2. Admin Whitelist Table
create table if not exists public.admin_whitelist (
  email text primary key,
  added_by text,
  created_at timestamptz not null default now()
);

-- Optional: Seed initial admin email(s) directly in SQL as well (or set ADMIN_EMAILS in .env.local / Vercel)
-- insert into public.admin_whitelist (email, added_by) values ('placement.head@iujaipur.edu.in', 'seed') on conflict do nothing;

-- Helper function to check if the current authenticated user is an admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_whitelist
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- 3. Students Table
create table if not exists public.students (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null default '',
  course text not null default 'B.Tech',
  branch text not null default '',
  current_year int not null default 1 check (current_year between 1 and 4),
  current_semester int not null default 1 check (current_semester between 1 and 8),
  score_type text not null default 'CGPA' check (score_type in ('CGPA', 'PERCENTAGE')),
  semester_scores jsonb not null default '[]'::jsonb,
  tenth_percentage numeric(5,2) not null default 0 check (tenth_percentage between 0 and 100),
  twelfth_percentage numeric(5,2) not null default 0 check (twelfth_percentage between 0 and 100),
  achievements_till_12th text default '',
  resume_path text,
  resume_filename text,
  profile_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Companies Table
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  package_ctc text not null,
  location text not null default 'On-site / Remote',
  description text not null,
  deadline timestamptz not null,
  allowed_courses text[] not null default '{}',
  min_tenth_percentage numeric(5,2),
  min_twelfth_percentage numeric(5,2),
  min_sem_cgpa numeric(4,2),
  created_by text not null,
  email_sent_count int not null default 0,
  created_at timestamptz not null default now()
);

-- 5. Company Responses Table (Interested / Not Interested)
create table if not exists public.company_responses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null check (status in ('interested', 'not_interested')),
  updated_at timestamptz not null default now(),
  unique (company_id, student_id)
);

-- 6. Updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_students_updated_at on public.students;
create trigger trg_students_updated_at
before update on public.students
for each row execute function public.set_updated_at();

drop trigger if exists trg_company_responses_updated_at on public.company_responses;
create trigger trg_company_responses_updated_at
before update on public.company_responses
for each row execute function public.set_updated_at();

-- 7. Row Level Security (RLS)
alter table public.admin_whitelist enable row level security;
alter table public.students enable row level security;
alter table public.companies enable row level security;
alter table public.company_responses enable row level security;

-- admin_whitelist policies
drop policy if exists "Admins can view whitelist" on public.admin_whitelist;
create policy "Admins can view whitelist"
on public.admin_whitelist for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert whitelist" on public.admin_whitelist;
create policy "Admins can insert whitelist"
on public.admin_whitelist for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can delete whitelist" on public.admin_whitelist;
create policy "Admins can delete whitelist"
on public.admin_whitelist for delete
to authenticated
using (public.is_admin());

-- students policies
drop policy if exists "Students can view own profile" on public.students;
create policy "Students can view own profile"
on public.students for select
to authenticated
using (auth.uid() = id or public.is_admin());

drop policy if exists "Students can insert own profile" on public.students;
create policy "Students can insert own profile"
on public.students for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Students can update own profile" on public.students;
create policy "Students can update own profile"
on public.students for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- companies policies
drop policy if exists "Authenticated users can view companies" on public.companies;
create policy "Authenticated users can view companies"
on public.companies for select
to authenticated
using (true);

drop policy if exists "Admins can insert companies" on public.companies;
create policy "Admins can insert companies"
on public.companies for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update companies" on public.companies;
create policy "Admins can update companies"
on public.companies for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete companies" on public.companies;
create policy "Admins can delete companies"
on public.companies for delete
to authenticated
using (public.is_admin());

-- company_responses policies
drop policy if exists "Students and admins can view responses" on public.company_responses;
create policy "Students and admins can view responses"
on public.company_responses for select
to authenticated
using (auth.uid() = student_id or public.is_admin());

drop policy if exists "Students can insert own response" on public.company_responses;
create policy "Students can insert own response"
on public.company_responses for insert
to authenticated
with check (auth.uid() = student_id);

drop policy if exists "Students can update own response" on public.company_responses;
create policy "Students can update own response"
on public.company_responses for update
to authenticated
using (auth.uid() = student_id)
with check (auth.uid() = student_id);

-- 8. Private Storage Bucket for Resumes/CVs
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

drop policy if exists "Students can upload own resume" on storage.objects;
create policy "Students can upload own resume"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Students can update own resume" on storage.objects;
create policy "Students can update own resume"
on storage.objects for update
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Students and admins can view resumes" on storage.objects;
create policy "Students and admins can view resumes"
on storage.objects for select
to authenticated
using (
  bucket_id = 'resumes'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);

drop policy if exists "Students can delete own resume" on storage.objects;
create policy "Students can delete own resume"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 9. Explicit Schema & Table Grants (RLS still enforces row-level access)
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on table public.admin_whitelist to authenticated, service_role;
grant select, insert, update on table public.students to authenticated;
grant all on table public.students to service_role;
grant select, insert, update, delete on table public.companies to authenticated, service_role;
grant select, insert, update on table public.company_responses to authenticated;
grant all on table public.company_responses to service_role;
grant execute on function public.is_admin() to authenticated, service_role;
