// Standalone appointments/meetings module. No such concept existed elsewhere
// in the app before the Calendar feature — this is a fixed in-memory demo
// dataset, same convention as data/team.js.
export const APPOINTMENT_TYPES = ["Client Meeting", "Consultation", "Deposition", "Conference Call", "Court Filing", "Other"];

export const initialAppointments = [
  {
    id: "appt-1",
    title: "Client briefing — Chevron Inc.",
    type: "Client Meeting",
    date: "2026-07-22",
    time: "03:00 PM",
    location: "Chambers, Room 3",
    caseNo: "01",
    clientName: "Chevron Inc.",
    notes: "Review upcoming affidavit strategy ahead of the next hearing.",
  },
  {
    id: "appt-2",
    title: "Consultation — new matter intake",
    type: "Consultation",
    date: "2026-07-23",
    time: "11:30 AM",
    location: "Chambers, Room 1",
    caseNo: null,
    clientName: "Rakesh Malhotra",
    notes: "Prospective client, property dispute.",
  },
  {
    id: "appt-3",
    title: "Deposition — opposing witness",
    type: "Deposition",
    date: "2026-07-24",
    time: "10:00 AM",
    location: "Court Complex, Room 12",
    caseNo: "02",
    clientName: null,
    notes: "",
  },
  {
    id: "appt-4",
    title: "Conference call with co-counsel",
    type: "Conference Call",
    date: "2026-07-27",
    time: "05:00 PM",
    location: "Video Call",
    caseNo: "01",
    clientName: null,
    notes: "Coordinate on writ petition draft revisions.",
  },
  {
    id: "appt-5",
    title: "Court filing submission",
    type: "Court Filing",
    date: "2026-07-21",
    time: "09:30 AM",
    location: "High Court Registry",
    caseNo: null,
    clientName: null,
    notes: "Submit compilation of annexures.",
  },
];
