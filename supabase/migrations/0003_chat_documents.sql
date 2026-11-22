-- LEXIFYI — Phase 3 migration: Chat (Communication Hub) + Documents/Storage.
-- Run after 0001_foundation.sql and 0002_tasks_appointments.sql.
--
-- Case Discussion Rooms and Client Chats stay virtual/derived (from
-- matters + client_chat_assignments), exactly like before — only Groups,
-- Direct Messages, and Messages themselves become real, persisted rows.
-- `messages.conversation_id` stays plain text (not an FK): it can point at
-- a real groups/direct_conversations row, or at a synthetic "case-<no>" /
-- "client-<name>" id that's never itself stored, matching the app's
-- existing polymorphic-id design (see components/chat/ChatContext.jsx).

-- SECURITY DEFINER so RLS policies can check the caller's own display name
-- without recursing through profiles' own SELECT policy.
create or replace function public.current_full_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select full_name from public.profiles where id = auth.uid();
$$;

-- =============================================================================
-- groups / direct_conversations
-- =============================================================================
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Plain names, not member-id FKs — consistent with how tasks/appointments
  -- already model "who's involved" throughout this codebase, and matches
  -- today's UI (no membership-based access filtering exists anywhere in
  -- buildConversations()/ChatSidebarList — any signed-in staff member sees
  -- every group, same as this migration's broad RLS below).
  member_names text[] not null default '{}',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;
create policy "groups_select_staff" on public.groups for select using (public.is_active_staff());
create policy "groups_insert_staff" on public.groups for insert with check (public.is_active_staff());
create policy "groups_delete_manager" on public.groups for delete using (public.is_manager());

create table if not exists public.direct_conversations (
  -- Deterministic id ("dm-<sorted names>") from directConversationId() in
  -- ChatContext.jsx, not a generated uuid — starting a DM with the same
  -- person twice must resolve to the same conversation.
  id text primary key,
  member_names text[] not null,
  created_at timestamptz not null default now()
);

alter table public.direct_conversations enable row level security;
create policy "direct_conversations_select_staff" on public.direct_conversations for select using (public.is_active_staff());
create policy "direct_conversations_insert_staff" on public.direct_conversations for insert with check (public.is_active_staff());

-- =============================================================================
-- messages
-- =============================================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null,
  sender_id uuid references public.profiles (id) on delete set null,
  sender_name text not null,
  sender_role text,
  text text,
  attachment_ids uuid[] not null default '{}',
  reply_to_id uuid,
  forwarded_from_id uuid,
  edited boolean not null default false,
  deleted boolean not null default false,
  pinned_by text[] not null default '{}',
  starred_by text[] not null default '{}',
  mentions text[] not null default '{}',
  -- Always 'sent' once actually persisted — the "delivered"/"seen" ticks
  -- and "X is typing…" indicator stay a client-side, session-local
  -- simulation (per ChatContext.jsx's own comment: no real presence/
  -- delivery-receipt infra exists), not something this migration invents
  -- a backend for.
  status text not null default 'sent',
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx on public.messages (conversation_id, created_at);
create index if not exists messages_mentions_idx on public.messages using gin (mentions);

alter table public.messages enable row level security;
create policy "messages_select_staff" on public.messages for select using (public.is_active_staff());
create policy "messages_insert_staff" on public.messages for insert with check (public.is_active_staff() and sender_id = auth.uid());
-- Covers both editMessage() and the soft-delete deleteMessage() performs
-- (an UPDATE setting deleted=true, not a real DELETE) — matches
-- canDeleteMessage()'s own rule (manager, or your own message).
create policy "messages_update_own_or_manager" on public.messages for update
  using (public.is_manager() or sender_name = public.current_full_name());

-- Live updates for the Communication Hub — ChatContext subscribes to this.
alter publication supabase_realtime add table public.messages;

-- =============================================================================
-- message_reads — per-user last-read timestamp per conversation, replacing
-- the in-memory readState used for unread-count badges.
-- =============================================================================
create table if not exists public.message_reads (
  conversation_id text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table public.message_reads enable row level security;
create policy "message_reads_select_own" on public.message_reads for select using (user_id = auth.uid() or public.is_admin());
create policy "message_reads_upsert_own" on public.message_reads for insert with check (user_id = auth.uid());
create policy "message_reads_update_own" on public.message_reads for update using (user_id = auth.uid());

-- =============================================================================
-- client_chat_assignments — "who's handling this client's chat", keyed by
-- client name (same denormalized-by-name convention clientDirectory.js
-- already uses for everything client-related).
-- =============================================================================
create table if not exists public.client_chat_assignments (
  client_name text primary key,
  assigned_to_name text,
  assigned_to_role text,
  updated_at timestamptz not null default now()
);

alter table public.client_chat_assignments enable row level security;
create policy "client_chat_assignments_select_staff" on public.client_chat_assignments for select using (public.is_active_staff());
create policy "client_chat_assignments_upsert_manager" on public.client_chat_assignments for insert with check (public.is_manager());
create policy "client_chat_assignments_update_manager" on public.client_chat_assignments for update using (public.is_manager());

drop trigger if exists set_updated_at on public.client_chat_assignments;
create trigger set_updated_at before update on public.client_chat_assignments for each row execute function public.set_updated_at();

-- =============================================================================
-- attachments — the Document Library's single source of truth, and the
-- backing store for every chat/task/matter file. Real Storage-backed:
-- storage_path points into the firm-files bucket (private; access only via
-- signed URLs generated server-side).
-- =============================================================================
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mime_category text,
  size bigint,
  storage_path text not null,
  uploaded_by uuid references public.profiles (id) on delete set null,
  uploaded_by_name text,
  uploaded_at timestamptz not null default now(),
  source_conversation_id text,
  source_message_id uuid,
  category text,
  description text,
  tags text[] not null default '{}',
  linked_matter_id uuid references public.matters (id) on delete set null,
  linked_client_name text,
  linked_task_id uuid references public.tasks (id) on delete set null,
  linked_appointment_id uuid references public.appointments (id) on delete set null,
  linked_draft_slug text
);

create index if not exists attachments_source_conversation_idx on public.attachments (source_conversation_id);
create index if not exists attachments_linked_matter_idx on public.attachments (linked_matter_id);

alter table public.attachments enable row level security;
create policy "attachments_select_staff" on public.attachments for select using (public.is_active_staff());
create policy "attachments_insert_staff" on public.attachments for insert with check (public.is_active_staff());
create policy "attachments_update_staff" on public.attachments for update using (public.is_active_staff());
-- Matches AttachFileMenu.jsx's canDelete: manager, or whoever uploaded it.
create policy "attachments_delete_own_or_manager" on public.attachments for delete
  using (public.is_manager() or uploaded_by = auth.uid());

-- =============================================================================
-- Storage bucket + policies
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('firm-files', 'firm-files', false)
on conflict (id) do nothing;

create policy "firm_files_select_staff" on storage.objects for select
  using (bucket_id = 'firm-files' and public.is_active_staff());
create policy "firm_files_insert_staff" on storage.objects for insert
  with check (bucket_id = 'firm-files' and public.is_active_staff());
create policy "firm_files_delete_staff" on storage.objects for delete
  using (bucket_id = 'firm-files' and public.is_active_staff());
