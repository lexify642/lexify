-- LEXIFYI — Phase 5 migration: Draft Editor + Review, Clause Workspace
-- (per-user collections/saved/recent-use), and the Partnership Deed
-- Engine's config. Run after 0001–0004.

-- =============================================================================
-- drafts / draft_versions
-- =============================================================================
create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text,
  matter_id uuid references public.matters (id) on delete set null,
  client_name text,
  description text,
  header_html text,
  footer_html text,
  layout jsonb not null default '{}'::jsonb,
  design jsonb not null default '{}'::jsonb,
  -- Not FK-enforced on purpose: draft_versions.draft_id already FKs back to
  -- this row, so a circular FK here would just add ordering ceremony for no
  -- real integrity gain — an orphaned pointer is harmless (the app always
  -- resolves it against the same draft's own versions list).
  active_version_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists drafts_matter_id_idx on public.drafts (matter_id);

alter table public.drafts enable row level security;
create policy "drafts_select_staff" on public.drafts for select using (public.is_active_staff());
create policy "drafts_insert_staff" on public.drafts for insert with check (public.is_active_staff());
create policy "drafts_update_staff" on public.drafts for update using (public.is_active_staff());
create policy "drafts_delete_manager" on public.drafts for delete using (public.is_manager());

drop trigger if exists set_updated_at on public.drafts;
create trigger set_updated_at before update on public.drafts for each row execute function public.set_updated_at();

create table if not exists public.draft_versions (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.drafts (id) on delete cascade,
  number integer not null,
  label text,
  content_json jsonb not null,
  content_text text,
  action text,
  status text not null default 'Active',
  created_by_name text,
  created_at timestamptz not null default now()
);

create index if not exists draft_versions_draft_id_idx on public.draft_versions (draft_id, created_at);

alter table public.draft_versions enable row level security;
create policy "draft_versions_select_staff" on public.draft_versions for select using (public.is_active_staff());
create policy "draft_versions_insert_staff" on public.draft_versions for insert with check (public.is_active_staff());

-- =============================================================================
-- draft_comments (threads) / draft_comment_replies
-- =============================================================================
create table if not exists public.draft_comments (
  -- Client-supplied id (not gen_random_uuid()'s default) — the same id is
  -- embedded in the document's own CommentMark the instant a comment is
  -- created (see components/draft/editor/ribbon/InsertTab.jsx), so it has
  -- to be known synchronously client-side, before any round trip.
  id uuid primary key,
  draft_id uuid not null references public.drafts (id) on delete cascade,
  quoted_text text,
  status text not null default 'Open' check (status in ('Open', 'Resolved')),
  author_name text,
  author_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists draft_comments_draft_id_idx on public.draft_comments (draft_id);

alter table public.draft_comments enable row level security;
create policy "draft_comments_select_staff" on public.draft_comments for select using (public.is_active_staff());
create policy "draft_comments_insert_staff" on public.draft_comments for insert with check (public.is_active_staff());
create policy "draft_comments_update_staff" on public.draft_comments for update using (public.is_active_staff());
-- Matches canDeleteComment(): manager, or the thread's own author.
create policy "draft_comments_delete_own_or_manager" on public.draft_comments for delete
  using (public.is_manager() or author_id = auth.uid());

create table if not exists public.draft_comment_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.draft_comments (id) on delete cascade,
  author_name text,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists draft_comment_replies_thread_id_idx on public.draft_comment_replies (thread_id);

alter table public.draft_comment_replies enable row level security;
create policy "draft_comment_replies_select_staff" on public.draft_comment_replies for select using (public.is_active_staff());
create policy "draft_comment_replies_insert_staff" on public.draft_comment_replies for insert with check (public.is_active_staff());

-- =============================================================================
-- draft_review_requests — this is the fix for the trust gap the audit
-- found: app/api/draft-review/send previously only sent an email; the DB
-- row was written client-side afterward, so a network hiccup between the
-- two calls (or a client that just never made the second call) meant an
-- email could go out with no record of it ever existing. The route now
-- creates this row itself, in the same request that sends the email.
-- =============================================================================
create table if not exists public.draft_review_requests (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references public.drafts (id) on delete set null,
  version_id uuid,
  matter_id uuid references public.matters (id) on delete set null,
  sender_id uuid references public.profiles (id) on delete set null,
  sender_name text,
  recipients jsonb not null default '[]'::jsonb,
  cc text[] not null default '{}',
  bcc text[] not null default '{}',
  subject text,
  message text,
  format text,
  deadline date,
  instructions text,
  allow_comments boolean not null default false,
  allow_track_changes boolean not null default false,
  allow_editing boolean not null default false,
  require_approval boolean not null default false,
  status text not null default 'Sent'
    check (status in ('Sent', 'Opened', 'Under Review', 'Changes Requested', 'Changes Received', 'Approved', 'Rejected', 'Expired')),
  sent_at timestamptz not null default now()
);

create index if not exists draft_review_requests_draft_id_idx on public.draft_review_requests (draft_id);

alter table public.draft_review_requests enable row level security;
create policy "draft_review_requests_select_staff" on public.draft_review_requests for select using (public.is_active_staff());
create policy "draft_review_requests_insert_staff" on public.draft_review_requests for insert with check (public.is_active_staff());
create policy "draft_review_requests_update_staff" on public.draft_review_requests for update using (public.is_active_staff());

-- =============================================================================
-- clause_collections (shared team artifacts, like matters/tasks — anyone
-- can see and add to any collection) / clause_saved + clause_recent_use
-- (genuinely personal — a bookmark list and a usage log only make sense
-- scoped to their own owner).
-- =============================================================================
create table if not exists public.clause_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  linked_matter_id uuid references public.matters (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_by_name text,
  status text not null default 'Active',
  clause_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clause_collections enable row level security;
create policy "clause_collections_select_staff" on public.clause_collections for select using (public.is_active_staff());
create policy "clause_collections_insert_staff" on public.clause_collections for insert with check (public.is_active_staff());
create policy "clause_collections_update_staff" on public.clause_collections for update using (public.is_active_staff());
create policy "clause_collections_delete_manager" on public.clause_collections for delete using (public.is_manager());

drop trigger if exists set_updated_at on public.clause_collections;
create trigger set_updated_at before update on public.clause_collections for each row execute function public.set_updated_at();

create table if not exists public.clause_saved (
  user_id uuid not null references public.profiles (id) on delete cascade,
  clause_id text not null references public.clauses (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, clause_id)
);

alter table public.clause_saved enable row level security;
create policy "clause_saved_own" on public.clause_saved for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.clause_recent_use (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  clause_id text not null references public.clauses (id) on delete cascade,
  action text,
  created_at timestamptz not null default now()
);

create index if not exists clause_recent_use_user_id_idx on public.clause_recent_use (user_id, created_at desc);

alter table public.clause_recent_use enable row level security;
create policy "clause_recent_use_own" on public.clause_recent_use for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =============================================================================
-- Partnership Deed Engine config — data/partnershipDeed.js's CLAUSES had a
-- `buildText(optionLabel, extraValue) => string` function per clause; every
-- one of the 10 is pure string interpolation (verified, no branching), so
-- it converts cleanly to a stored template with {{optionLabel}}/
-- {{extraValue}} placeholders + a small interpolate() helper — the function
-- itself becomes data, not a rewrite of the wizard's logic.
-- =============================================================================
create table if not exists public.deed_clause_options (
  id text primary key,
  number integer not null,
  jump_label text,
  title text,
  description text,
  heading text,
  options jsonb not null default '[]'::jsonb,
  extra_field jsonb,
  text_template text,
  -- Folded in from data/partnershipDeed.js's separate PLAYBOOK array (1:1
  -- by clause id, nullable since the "identity" clause has no entry there
  -- today) rather than a second table for 9 rows.
  playbook_impact text,
  playbook_guidance text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deed_clause_options enable row level security;
create policy "deed_clause_options_select_staff" on public.deed_clause_options for select using (public.is_active_staff());
create policy "deed_clause_options_write_manager" on public.deed_clause_options for all
  using (public.is_manager()) with check (public.is_manager());

drop trigger if exists set_updated_at on public.deed_clause_options;
create trigger set_updated_at before update on public.deed_clause_options for each row execute function public.set_updated_at();

create table if not exists public.deed_presets (
  id text primary key,
  posture text,
  interest_path text,
  voting_lock text,
  friction text,
  guidelines text,
  selections jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.deed_presets enable row level security;
create policy "deed_presets_select_staff" on public.deed_presets for select using (public.is_active_staff());
create policy "deed_presets_write_manager" on public.deed_presets for all
  using (public.is_manager()) with check (public.is_manager());

-- Single-row config: DEFAULT_SELECTIONS/DEFAULT_EXTRA_VALUES (the wizard's
-- starting state) + the fixed RECITALS_HTML/CLOSING_HTML boilerplate that
-- wraps every generated deed.
create table if not exists public.deed_settings (
  id boolean primary key default true check (id),
  default_selections jsonb not null default '{}'::jsonb,
  default_extra_values jsonb not null default '{}'::jsonb,
  recitals_html text,
  closing_html text,
  updated_at timestamptz not null default now()
);

alter table public.deed_settings enable row level security;
create policy "deed_settings_select_staff" on public.deed_settings for select using (public.is_active_staff());
create policy "deed_settings_write_manager" on public.deed_settings for all
  using (public.is_manager()) with check (public.is_manager());

drop trigger if exists set_updated_at on public.deed_settings;
create trigger set_updated_at before update on public.deed_settings for each row execute function public.set_updated_at();
