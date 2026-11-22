-- LEXIFYI — Phase 0/1 foundation migration.
-- Run this in the Supabase SQL Editor (or `supabase db push`) against the
-- project already used by SUPABASE_URL/SUPABASE_ANON_KEY.
--
-- Does NOT touch the existing legal_cases / legal_case_ai_analysis /
-- legal_case_citations (case-law research feature) or login_otps
-- (OTP codes) tables — those stay exactly as they are.
--
-- Creates: profiles, clients, matters, matter_previous_dates, matter_notes,
-- audit_log, plus role-check helper functions and RLS policies for all of
-- the above. See docs/database-schema.md for the full reference once it's
-- written (Phase 7).

create extension if not exists pgcrypto;

-- =============================================================================
-- profiles — one row per staff member, keyed to auth.users. There is no
-- public sign-up: a row here (created by an admin) is what makes the OTP
-- login flow work at all (see lib/auth/otp.js + app/api/auth/*).
-- =============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null check (role in ('admin', 'senior_advocate', 'junior_advocate', 'clerk', 'staff', 'client')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

-- SECURITY DEFINER so these can be called from any RLS policy (including
-- profiles' own) without re-triggering profiles' SELECT policy recursively.
create or replace function public.current_role_value()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'admin', false);
$$;

-- Mirrors components/*/permissions.js's MANAGER_ROLES ("Senior Advocate"/"Admin").
create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) in ('admin', 'senior_advocate'), false);
$$;

-- Any active, non-client staff member — the baseline for "signed-in firm user".
create or replace function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_active from public.profiles where id = auth.uid()) is true
    and (select role from public.profiles where id = auth.uid()) in ('admin', 'senior_advocate', 'junior_advocate', 'clerk', 'staff'),
    false
  );
$$;

alter table public.profiles enable row level security;

create policy "profiles_select_self_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles_insert_admin_only" on public.profiles
  for insert with check (public.is_admin());

create policy "profiles_update_admin_only" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- A signed-in user may touch their own row, but only if `role` doesn't
-- change — combined with the admin policy above (multiple permissive
-- policies OR together), so only an admin can actually change a role.
create policy "profiles_update_self_name" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_role_value());

-- =============================================================================
-- clients
-- =============================================================================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists clients_name_lower_idx on public.clients (lower(name));

alter table public.clients enable row level security;

create policy "clients_select_staff" on public.clients for select using (public.is_active_staff());
create policy "clients_insert_staff" on public.clients for insert with check (public.is_active_staff());
create policy "clients_update_staff" on public.clients for update using (public.is_active_staff());
create policy "clients_delete_manager" on public.clients for delete using (public.is_manager());

-- =============================================================================
-- matters — the firm's own case/matter records. Named "matters" (not
-- "cases") specifically to avoid colliding with the existing `legal_cases`
-- case-law research table, which is a separate, unrelated dataset.
-- =============================================================================
create table if not exists public.matters (
  id uuid primary key default gen_random_uuid(),
  display_no text not null unique,
  number text,
  court text,
  city text,
  room text,
  judge text,
  parties text not null,
  hearing_date date,
  hearing_time text,
  stage text,
  tone text,
  activity_summary text,
  registered_on text,
  filing_type text,
  client_id uuid references public.clients (id) on delete set null,
  assigned_advocate_id uuid references public.profiles (id) on delete set null,
  -- Deliberately jsonb: per-matter-type fields (writ/civil/criminal/
  -- arbitration specifics) vary in shape and would over-normalize a
  -- genuinely schema-less bag into a wide, mostly-null table.
  case_details jsonb not null default '{}'::jsonb,
  -- Filenames only for now (matches today's fidelity); becomes real
  -- `attachments` rows once Storage is wired up in a later phase.
  docs text[] not null default '{}',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists matters_client_id_idx on public.matters (client_id);
create index if not exists matters_hearing_date_idx on public.matters (hearing_date);
create index if not exists matters_stage_idx on public.matters (stage);

alter table public.matters enable row level security;

create policy "matters_select_staff" on public.matters for select using (public.is_active_staff());
create policy "matters_insert_staff" on public.matters for insert with check (public.is_active_staff());
create policy "matters_update_staff" on public.matters for update using (public.is_active_staff());
create policy "matters_delete_manager" on public.matters for delete using (public.is_manager());

-- =============================================================================
-- matter_previous_dates
-- =============================================================================
create table if not exists public.matter_previous_dates (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters (id) on delete cascade,
  -- text, not `date`: the client already renders this as a display string
  -- ("16 Apr 2026") before it reaches the API, matching how the existing
  -- Case Diary UI has always stored it.
  date text,
  court text,
  stage text,
  purpose text,
  outcome text,
  -- Plain name, not a profiles FK: today's data (and the Edit/Add Previous
  -- Date form) freely accepts any advocate name string, not necessarily one
  -- that maps to a staff profile.
  advocate text,
  full_notes text,
  created_at timestamptz not null default now()
);

create index if not exists matter_previous_dates_matter_id_idx on public.matter_previous_dates (matter_id);

alter table public.matter_previous_dates enable row level security;

create policy "matter_previous_dates_select_staff" on public.matter_previous_dates for select using (public.is_active_staff());
create policy "matter_previous_dates_insert_staff" on public.matter_previous_dates for insert with check (public.is_active_staff());
create policy "matter_previous_dates_update_staff" on public.matter_previous_dates for update using (public.is_active_staff());
create policy "matter_previous_dates_delete_manager" on public.matter_previous_dates for delete using (public.is_manager());

-- =============================================================================
-- matter_notes
-- =============================================================================
create table if not exists public.matter_notes (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters (id) on delete cascade,
  text text not null,
  is_reminder boolean not null default false,
  due_date date,
  completed boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists matter_notes_matter_id_idx on public.matter_notes (matter_id);
create index if not exists matter_notes_reminder_idx on public.matter_notes (due_date) where is_reminder and not completed;

alter table public.matter_notes enable row level security;

create policy "matter_notes_select_staff" on public.matter_notes for select using (public.is_active_staff());
create policy "matter_notes_insert_staff" on public.matter_notes for insert with check (public.is_active_staff());
create policy "matter_notes_update_staff" on public.matter_notes for update using (public.is_active_staff());
create policy "matter_notes_delete_manager" on public.matter_notes for delete using (public.is_manager());

-- =============================================================================
-- audit_log — cross-cutting admin/security activity trail. Populated by
-- explicit inserts in Route Handlers (app-level logging), not triggers.
-- =============================================================================
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  summary text,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
create index if not exists audit_log_entity_idx on public.audit_log (entity_type, entity_id);

alter table public.audit_log enable row level security;

-- Reading the log is an admin-only, security-sensitive action; any active
-- staff member may insert an entry, but only attributed to themselves.
create policy "audit_log_select_admin" on public.audit_log for select using (public.is_admin());
create policy "audit_log_insert_staff" on public.audit_log for insert with check (public.is_active_staff() and actor_id = auth.uid());

-- =============================================================================
-- updated_at maintenance
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.clients;
create trigger set_updated_at before update on public.clients for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.matters;
create trigger set_updated_at before update on public.matters for each row execute function public.set_updated_at();

-- =============================================================================
-- Bootstrap: there is no way to create the FIRST admin through the app (by
-- design — no public admin registration, and profiles.id has a hard FK to
-- auth.users so a profile can't be inserted before the auth user exists).
--
-- 1. Supabase Dashboard → Authentication → Users → Add user → create a user
--    with lexify642@gmail.com (any temp password; this app never uses
--    passwords, only OTP, so it's never used again). Copy the generated
--    User UID.
-- 2. Run this, substituting the UID from step 1:
--
-- insert into public.profiles (id, email, full_name, role)
-- values ('<the User UID from step 1>', 'lexify642@gmail.com', 'Your Name', 'admin');
--
-- 3. From then on, sign in normally at /login — the OTP flow works for any
--    email that already has a profiles row, and Admin → Users can invite
--    everyone else from inside the app.
--
-- No one else can ever become admin except by an existing admin granting it
-- (Admin → Users, or another manual bootstrap like this one) — the
-- profiles_insert_admin_only / profiles_update_admin_only RLS policies
-- above make this the ONLY path to the 'admin' role at the database level,
-- not just an app-level convention. Until step 2 is run, ZERO accounts have
-- admin access, including this one.
-- =============================================================================
