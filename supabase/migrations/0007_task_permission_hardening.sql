-- Audit finding: tasks_update_staff (0002) let ANY active staff member update
-- ANY task row (reassign, reprioritize, change due date) via a direct
-- PostgREST/Supabase call, even though the app's own UI only exposes full
-- task editing to managers (components/tasks/permissions.js's
-- canManageTask()) and status-only changes to a task's own assignee
-- (canUpdateStatus()). The Next.js route handlers have been tightened to
-- match (app/api/tasks/[id]/route.js now requires a manager;
-- app/api/tasks/[id]/status/route.js now checks manager-or-assignee), but
-- RLS is the layer that actually stops a non-manager, non-assignee staff
-- member from bypassing the app entirely and modifying someone else's task
-- straight through Supabase.

drop policy if exists "tasks_update_staff" on public.tasks;

create policy "tasks_update_manager_or_assignee" on public.tasks
  for update
  using (public.is_manager() or assigned_to_name = public.current_full_name())
  with check (public.is_manager() or assigned_to_name = public.current_full_name());
