-- LEXIFYI — Phase 2 migration: Tasks + Calendar/Appointments.
-- Run after 0001_foundation.sql. Same conventions: RLS on every table,
-- is_active_staff()/is_manager() helper functions from 0001.
--
-- The Calendar page itself stays a pure client-side join of matters +
-- appointments + tasks (components/calendar/eventAggregation.js) — no
-- separate "calendar_events" table, matching how it already worked against
-- in-memory data.

-- =============================================================================
-- tasks
-- =============================================================================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  matter_id uuid references public.matters (id) on delete set null,
  client_name text,
  -- Denormalized name/role text, not profile FKs — matches how this data has
  -- always been modeled (the assignee picker sources live profiles now, but
  -- a task only ever stored the resulting name/role strings, no id). Kept
  -- this way rather than adding FKs so a task's history stays legible even
  -- if the assignee's profile is later removed.
  assigned_by_name text,
  assigned_by_role text,
  assigned_to_name text,
  assigned_to_role text,
  assigned_at timestamptz not null default now(),
  priority text,
  due_date date,
  due_time text,
  status text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Waiting for Review', 'Completed', 'Cancelled')),
  reminder text,
  custom_reminder_minutes integer,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_matter_id_idx on public.tasks (matter_id);
create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists tasks_due_date_idx on public.tasks (due_date);
create index if not exists tasks_assigned_to_idx on public.tasks (assigned_to_name);

alter table public.tasks enable row level security;

create policy "tasks_select_staff" on public.tasks for select using (public.is_active_staff());
create policy "tasks_insert_staff" on public.tasks for insert with check (public.is_active_staff());
create policy "tasks_update_staff" on public.tasks for update using (public.is_active_staff());
-- Matches TaskDetailsWorkspace.jsx: only canManageTask() (Admin/Senior
-- Advocate) sees the Delete button.
create policy "tasks_delete_manager" on public.tasks for delete using (public.is_manager());

drop trigger if exists set_updated_at on public.tasks;
create trigger set_updated_at before update on public.tasks for each row execute function public.set_updated_at();

-- =============================================================================
-- task_comments / task_attachments / task_activity
-- =============================================================================
create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists task_comments_task_id_idx on public.task_comments (task_id);

alter table public.task_comments enable row level security;
create policy "task_comments_select_staff" on public.task_comments for select using (public.is_active_staff());
create policy "task_comments_insert_staff" on public.task_comments for insert with check (public.is_active_staff());
create policy "task_comments_delete_manager" on public.task_comments for delete using (public.is_manager());

create table if not exists public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  -- Filename only for now, same fidelity as today's demo attach flow — real
  -- Storage-backed uploads land with the rest of the file-handling work in
  -- Phase 3.
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists task_attachments_task_id_idx on public.task_attachments (task_id);

alter table public.task_attachments enable row level security;
create policy "task_attachments_select_staff" on public.task_attachments for select using (public.is_active_staff());
create policy "task_attachments_insert_staff" on public.task_attachments for insert with check (public.is_active_staff());
create policy "task_attachments_delete_manager" on public.task_attachments for delete using (public.is_manager());

create table if not exists public.task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  status_to text not null,
  note text,
  actor_name text,
  created_at timestamptz not null default now()
);

create index if not exists task_activity_task_id_idx on public.task_activity (task_id);

alter table public.task_activity enable row level security;
create policy "task_activity_select_staff" on public.task_activity for select using (public.is_active_staff());
create policy "task_activity_insert_staff" on public.task_activity for insert with check (public.is_active_staff());

-- =============================================================================
-- appointments — first-class, standalone (not derived from tasks/matters).
-- Optional matter_id link; independent events keep a freeform client_name.
-- =============================================================================
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_type text,
  event_date date,
  event_time text,
  location text,
  matter_id uuid references public.matters (id) on delete set null,
  client_name text,
  notes text,
  assigned_to_name text,
  assigned_to_role text,
  reminder text,
  custom_reminder_minutes integer,
  status text default 'Scheduled' check (status in ('Scheduled', 'Completed', 'Adjourned', 'Cancelled', 'Missed')),
  priority text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_matter_id_idx on public.appointments (matter_id);
create index if not exists appointments_event_date_idx on public.appointments (event_date);

alter table public.appointments enable row level security;

-- No manager-only restriction on delete here: the existing Appointment
-- Details page lets any signed-in staff member delete an appointment (no
-- canManageX check in the UI), so RLS mirrors that rather than introducing
-- a new restriction the app never had.
create policy "appointments_select_staff" on public.appointments for select using (public.is_active_staff());
create policy "appointments_insert_staff" on public.appointments for insert with check (public.is_active_staff());
create policy "appointments_update_staff" on public.appointments for update using (public.is_active_staff());
create policy "appointments_delete_staff" on public.appointments for delete using (public.is_active_staff());

drop trigger if exists set_updated_at on public.appointments;
create trigger set_updated_at before update on public.appointments for each row execute function public.set_updated_at();
