-- LEXIFYI — Phase 6 (audit) migration: real conversation-level access
-- control for Chat, replacing the previous "any signed-in staff member can
-- read any conversation" RLS on messages/groups/direct_conversations/
-- attachments. This ports components/chat/permissions.js's existing
-- canAccessCaseRoom()/accessListForCase() logic into the database — it was
-- already the app's real access rule (case rooms are open to the assigned
-- advocate + anyone with a task on that case + managers), just never
-- enforced server-side. Client-chat rooms stay open to all staff, exactly
-- as buildConversations() in conversationUtils.js already modeled them
-- (no access filter is applied there for client rooms, only case rooms).
-- Run after 0001–0005.

-- SECURITY DEFINER: needs to read matters/tasks/groups/direct_conversations
-- regardless of the calling policy context, without recursing through those
-- tables' own RLS.
create or replace function public.can_access_conversation(conv_id text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  case_no text;
  my_name text;
begin
  if public.is_manager() then
    return true;
  end if;

  my_name := public.current_full_name();
  if my_name is null then
    return false;
  end if;

  -- Case Discussion Room: "case-<display_no>" — open to the matter's
  -- assigned advocate (case_details->>'assignedAdvocate') plus anyone with
  -- a task linked to that matter, same as accessListForCase().
  if conv_id like 'case-%' then
    case_no := substring(conv_id from 6);
    return exists (
      select 1
      from public.matters m
      where m.display_no = case_no
        and (
          (m.case_details ->> 'assignedAdvocate') = my_name
          or exists (
            select 1 from public.tasks t
            where t.matter_id = m.id and t.assigned_to_name = my_name
          )
        )
    );
  end if;

  -- Client Chat: "client-<name>" — intentionally open to every active staff
  -- member, matching buildConversations()'s existing (unfiltered) behavior.
  if conv_id like 'client-%' then
    return true;
  end if;

  -- Group or Direct Message — real stored membership.
  return exists (
    select 1 from public.groups g
    where g.id::text = conv_id and my_name = any (g.member_names)
  ) or exists (
    select 1 from public.direct_conversations d
    where d.id = conv_id and my_name = any (d.member_names)
  );
end;
$$;

-- messages: was "any active staff" for select/insert — now scoped to
-- conversations the caller can actually access.
drop policy if exists "messages_select_staff" on public.messages;
create policy "messages_select_conversation_member" on public.messages
  for select using (public.is_active_staff() and public.can_access_conversation(conversation_id));

drop policy if exists "messages_insert_staff" on public.messages;
create policy "messages_insert_conversation_member" on public.messages
  for insert with check (public.is_active_staff() and sender_id = auth.uid() and public.can_access_conversation(conversation_id));

-- groups / direct_conversations: listing them (name, members) is now also
-- restricted to members + managers, not just message contents — otherwise
-- a non-member could still see a group exists and who's in it.
drop policy if exists "groups_select_staff" on public.groups;
create policy "groups_select_member" on public.groups
  for select using (public.is_active_staff() and (public.is_manager() or public.current_full_name() = any (member_names)));

drop policy if exists "direct_conversations_select_staff" on public.direct_conversations;
create policy "direct_conversations_select_member" on public.direct_conversations
  for select using (public.is_active_staff() and (public.is_manager() or public.current_full_name() = any (member_names)));

-- attachments: shared inside a specific conversation are now scoped to that
-- conversation's members; attachments not tied to a conversation (uploaded
-- directly against a matter/task, or via the Document Library) stay
-- staff-wide, matching every other matter/task record in this app.
drop policy if exists "attachments_select_staff" on public.attachments;
create policy "attachments_select_authorized" on public.attachments
  for select using (
    public.is_active_staff()
    and (source_conversation_id is null or public.can_access_conversation(source_conversation_id))
  );

-- Storage: the firm-files bucket now defers to the same rule via the
-- owning attachments row (matched by storage_path) — an object with no
-- matching row (shouldn't normally happen) fails open to "any active
-- staff" rather than fails closed, since that's the pre-existing behavior
-- for every non-conversation-linked file.
create or replace function public.can_access_storage_object(object_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select public.is_active_staff()
        and (a.source_conversation_id is null or public.can_access_conversation(a.source_conversation_id))
      from public.attachments a
      where a.storage_path = object_path
      limit 1
    ),
    public.is_active_staff()
  );
$$;

drop policy if exists "firm_files_select_staff" on storage.objects;
create policy "firm_files_select_authorized" on storage.objects
  for select using (bucket_id = 'firm-files' and public.can_access_storage_object(name));
