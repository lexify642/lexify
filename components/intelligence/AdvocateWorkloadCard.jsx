"use client";

import { useCases } from "@/components/cases/CasesContext";
import { useTasks } from "@/components/tasks/TasksContext";
import { computeAdvocateWorkload, toneForWorkload } from "./workload";

export default function AdvocateWorkloadCard() {
  const { cases } = useCases();
  const { tasks } = useTasks();

  const rows = computeAdvocateWorkload({ tasks, cases });

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
