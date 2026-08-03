import { dueCategory } from "@/data/tasks";
import { TODAY } from "@/data/cases";
import { computeClientFollowUps } from "./reminders";

// Aggregated "gaps" across the whole practice, each pointing at the real
// filtered view it's counting (clicking an item opens exactly what it
// counted — no separate filtering logic duplicated here).
export function computeAttentionItems({ cases = [], tasks = [], attachments = [], messages = [] }) {
  const items = [];

  const noNotes = cases.filter((c) => (c.notes?.length || 0) === 0);
  if (noNotes.length) {
    items.push({ id: "att-no-notes", label: `${noNotes.length} matter${noNotes.length === 1 ? " has" : "s have"} not been updated recently`, count: noNotes.length, href: "/cases" });
  }

  const noHearingNotes = cases.filter((c) => c.previousDates?.length > 0 && !c.previousDates[0].fullNotes?.trim());
  if (noHearingNotes.length) {
    items.push({ id: "att-no-hearing-notes", label: `${noHearingNotes.length} hearing${noHearingNotes.length === 1 ? "" : "s"} have no notes`, count: noHearingNotes.length, href: "/cases" });
  }

  const noDocs = cases.filter((c) => (c.docs?.length || 0) === 0 && !attachments.some((a) => a.linkedCaseNo === c.no));
  if (noDocs.length) {
    items.push({ id: "att-no-docs", label: `${noDocs.length} case${noDocs.length === 1 ? "" : "s"} have no documents on file`, count: noDocs.length, href: "/cases" });
  }

  const overdueTasks = tasks.filter((t) => dueCategory(t) === "overdue");
  if (overdueTasks.length) {
    items.push({ id: "att-overdue-tasks", label: `${overdueTasks.length} task${overdueTasks.length === 1 ? " is" : "s are"} overdue`, count: overdueTasks.length, href: "/tasks?due=overdue" });
  }

  const dueSoon = tasks.filter((t) => dueCategory(t) === "today" || dueCategory(t) === "upcoming");
  if (dueSoon.length) {
    items.push({ id: "att-deadlines", label: `${dueSoon.length} deadline${dueSoon.length === 1 ? "" : "s"} approaching`, count: dueSoon.length, href: "/tasks?due=today" });
  }

  const followUps = computeClientFollowUps({ cases, messages });
  if (followUps.length) {
    items.push({ id: "att-follow-up", label: `${followUps.length} client${followUps.length === 1 ? "" : "s"} awaiting a reply`, count: followUps.length, href: "/clients" });
  }

  const feesPending = cases.filter((c) => c.caseDetails?.civil && !c.caseDetails.civil.courtFeePaid);
  if (feesPending.length) {
    items.push({ id: "att-fees", label: `${feesPending.length} case${feesPending.length === 1 ? " has" : "s have"} court fees pending`, count: feesPending.length, href: "/cases" });
  }

  const noNextHearing = cases.filter((c) => !c.date || c.date < TODAY);
  if (noNextHearing.length) {
    items.push({ id: "att-no-hearing", label: `${noNextHearing.length} case${noNextHearing.length === 1 ? " has" : "s have"} no upcoming hearing date`, count: noNextHearing.length, href: "/cases" });
  }

  const noAdvocate = cases.filter((c) => !c.caseDetails?.assignedAdvocate);
  if (noAdvocate.length) {
    items.push({ id: "att-no-advocate", label: `${noAdvocate.length} case${noAdvocate.length === 1 ? " has" : "s have"} no assigned advocate`, count: noAdvocate.length, href: "/cases" });
  }

  return items;
}
