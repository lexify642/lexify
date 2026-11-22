-- LEXIFYI — Phase 4 migration: Drafting Library admin content
-- (Legal Draft categories/sub-types + the Clause corpus).
-- Run after 0001–0003.
--
-- This is reference/config content the firm publishes to its own staff —
-- there is still no public tier in this app, so "publish" here means
-- "visible to signed-in staff", not "visible to the internet". Write
-- access is manager-only (Admin/Senior Advocate), matching how this
-- content is actually curated today (a firm-controlled document/clause
-- library, not something every user edits).

-- =============================================================================
-- legal_draft_categories / legal_draft_subtypes
-- =============================================================================
create table if not exists public.legal_draft_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  practice_area text,
  languages text[] not null default '{}',
  -- Real fields in the original data too: downloadUrl and previewUrl were
  -- always identical across all 46 sampled entries (verified) — one file,
  -- two UI actions on it — so this is a single storage path, not two.
  file_path text,
  -- Genuinely variable per-language bag (today: english/hindi/marathi/
  -- gujarati name+description) — jsonb, same reasoning as matters.case_details.
  translations jsonb not null default '{}'::jsonb,
  search_placeholder jsonb,
  sort_order integer not null default 0,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists legal_draft_categories_status_idx on public.legal_draft_categories (status);

alter table public.legal_draft_categories enable row level security;

-- Regular staff only see published categories; managers (who curate this
-- library) can also see drafts, so the admin screen can list/edit them.
create policy "legal_draft_categories_select" on public.legal_draft_categories
  for select using (public.is_active_staff() and (status = 'published' or public.is_manager()));
create policy "legal_draft_categories_write" on public.legal_draft_categories
  for all using (public.is_manager()) with check (public.is_manager());

drop trigger if exists set_updated_at on public.legal_draft_categories;
create trigger set_updated_at before update on public.legal_draft_categories for each row execute function public.set_updated_at();

create table if not exists public.legal_draft_subtypes (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.legal_draft_categories (id) on delete cascade,
  subtype_key text not null,
  translations jsonb not null default '{}'::jsonb,
  file_path text,
  sort_order integer not null default 0,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, subtype_key)
);

create index if not exists legal_draft_subtypes_category_id_idx on public.legal_draft_subtypes (category_id);

alter table public.legal_draft_subtypes enable row level security;
create policy "legal_draft_subtypes_select" on public.legal_draft_subtypes
  for select using (public.is_active_staff() and (status = 'published' or public.is_manager()));
create policy "legal_draft_subtypes_write" on public.legal_draft_subtypes
  for all using (public.is_manager()) with check (public.is_manager());

drop trigger if exists set_updated_at on public.legal_draft_subtypes;
create trigger set_updated_at before update on public.legal_draft_subtypes for each row execute function public.set_updated_at();

-- =============================================================================
-- clauses — the 254-entry reference corpus (data/clauses.json). `id` is
-- the existing business key (e.g. "INT-TIT--001"), kept as the primary key
-- rather than adding a surrogate uuid, since it's already a stable,
-- meaningful identifier admins will keep authoring by the same convention.
-- `status` is the clause's own legal-review state (Approved/Draft/
-- Deprecated/...) — a distinct concept from `is_published`, which is the
-- admin visibility gate this migration adds.
-- =============================================================================
create table if not exists public.clauses (
  id text primary key,
  category text,
  type text,
  name text,
  position text,
  domain text,
  text text,
  version text,
  risk text,
  favorability text,
  negotiation text,
  frequency text,
  case_law text,
  status text not null default 'APPROVED',
  is_published boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clauses_category_idx on public.clauses (category);
create index if not exists clauses_is_published_idx on public.clauses (is_published);

alter table public.clauses enable row level security;
create policy "clauses_select" on public.clauses for select using (public.is_active_staff() and (is_published or public.is_manager()));
create policy "clauses_write" on public.clauses for all using (public.is_manager()) with check (public.is_manager());

drop trigger if exists set_updated_at on public.clauses;
create trigger set_updated_at before update on public.clauses for each row execute function public.set_updated_at();

-- =============================================================================
-- Storage: legal-drafts bucket — the actual PDF files for categories/
-- sub-types. Private; read for any staff member, write for managers only
-- (matches the table RLS above — regular staff browse and download, only
-- Admin/Senior Advocate curate the library).
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('legal-drafts', 'legal-drafts', false)
on conflict (id) do nothing;

create policy "legal_drafts_select_staff" on storage.objects for select
  using (bucket_id = 'legal-drafts' and public.is_active_staff());
create policy "legal_drafts_write_manager" on storage.objects for insert
  with check (bucket_id = 'legal-drafts' and public.is_manager());
create policy "legal_drafts_update_manager" on storage.objects for update
  using (bucket_id = 'legal-drafts' and public.is_manager());
create policy "legal_drafts_delete_manager" on storage.objects for delete
  using (bucket_id = 'legal-drafts' and public.is_manager());
