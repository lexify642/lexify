"use client";

import { useCases } from "@/components/cases/CasesContext";
import { useTasks } from "@/components/tasks/TasksContext";
import { useStaffDirectory } from "@/components/staff/StaffDirectoryContext";
import { ROLE_LABELS } from "@/lib/roles";
import { computeAdvocateWorkload, toneForWorkload } from "./workload";

export default function AdvocateWorkloadCard() {
  const { cases } = useCases();
  const { tasks } = useTasks();
  const { staff } = useStaffDirectory();

  const members = staff.map((p) => ({ name: p.full_name, role: ROLE_LABELS[p.role] || p.role }));
  const rows = computeAdvocateWorkload({ tasks, cases, members });

  return (
    <section className="card">
      <div className="section-head">
        <h2 className="section-title">Advocate Workload</h2>
      </div>
      {rows.map((r) => (
        <div className="list-item" key={r.name}>
          <div className="item-main">
            <strong>{r.name}</strong>
            <span>
              {r.pendingTasks} Tasks · {r.hearingsToday} Hearing{r.hearingsToday === 1 ? "" : "s"} Today · {r.pendingDrafts} Draft
              {r.pendingDrafts === 1 ? "" : "s"} Pending
            </span>
          </div>
          <span className={`badge ${toneForWorkload(r.workloadLevel)}`}>{r.workloadLevel}</span>
        </div>
      ))}
    </section>
  );
}
