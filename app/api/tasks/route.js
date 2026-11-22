import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { taskCreateSchema } from "@/lib/validation";
import { serializeTask, groupBy } from "@/lib/tasks/serialize";

export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  try {
    const [tasksRes, commentsRes, attachmentsRes, activityRes, mattersRes] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("task_comments").select("*"),
      supabase.from("task_attachments").select("*"),
      supabase.from("task_activity").select("*"),
      supabase.from("matters").select("id, display_no"),
    ]);
    if (tasksRes.error) throw tasksRes.error;
    if (commentsRes.error) throw commentsRes.error;
    if (attachmentsRes.error) throw attachmentsRes.error;
    if (activityRes.error) throw activityRes.error;
    if (mattersRes.error) throw mattersRes.error;

    const matterDisplayNoById = new Map((mattersRes.data ?? []).map((m) => [m.id, m.display_no]));
    const commentsByTask = groupBy(commentsRes.data ?? [], "task_id");
    const attachmentsByTask = groupBy(attachmentsRes.data ?? [], "task_id");
    const activityByTask = groupBy(activityRes.data ?? [], "task_id");

    const result = (tasksRes.data ?? []).map((row) =>
      serializeTask(row, {
        comments: commentsByTask.get(row.id) ?? [],
        attachments: attachmentsByTask.get(row.id) ?? [],
        activity: activityByTask.get(row.id) ?? [],
        matterDisplayNo: row.matter_id ? (matterDisplayNoById.get(row.matter_id) ?? null) : null,
      })
    );

    return jsonOk(result);
  } catch (err) {
    console.error("[api/tasks GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading tasks.");
  }
}

export async function POST(request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const body = await request.json().catch(() => null);
  const parsed = taskCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid task.", 400, parsed.error.flatten());
  }

  try {
    const data = parsed.data;
    let matterId = null;
    if (data.caseNo) {
      const { data: matter, error } = await supabase.from("matters").select("id").eq("display_no", data.caseNo).maybeSingle();
      if (error) throw error;
      matterId = matter?.id ?? null;
    }

    const insertPayload = {
      title: data.title,
      description: data.description,
      matter_id: matterId,
      client_name: data.clientName,
      assigned_by_name: data.assignedByName,
      assigned_by_role: data.assignedByRole,
      assigned_to_name: data.assignedToName,
      assigned_to_role: data.assignedToRole,
      priority: data.priority,
      due_date: data.dueDate || null,
      due_time: data.dueTime,
      reminder: data.reminder,
      custom_reminder_minutes: data.customReminderMinutes,
      notes: data.notes,
      status: "Pending",
      created_by: user.id,
    };

    const { data: created, error: insertError } = await supabase.from("tasks").insert(insertPayload).select("*").single();
    if (insertError) throw insertError;

    await supabase.from("task_activity").insert({
      task_id: created.id,
      status_to: "Pending",
      note: "Task created and assigned.",
      actor_name: data.assignedByName || null,
    });

    if (data.attachments?.length) {
      const { error: attError } = await supabase
        .from("task_attachments")
        .insert(data.attachments.map((a) => ({ task_id: created.id, name: a.name })));
      if (attError) throw attError;
    }

    const [{ data: activity }, { data: attachments }] = await Promise.all([
      supabase.from("task_activity").select("*").eq("task_id", created.id),
      supabase.from("task_attachments").select("*").eq("task_id", created.id),
    ]);

    return jsonOk(
      serializeTask(created, {
        comments: [],
        attachments: attachments ?? [],
        activity: activity ?? [],
        matterDisplayNo: data.caseNo || null,
      })
    );
  } catch (err) {
    console.error("[api/tasks POST]", err);
    return jsonErrorFromException(err, "Something went wrong while creating the task.");
  }
}
