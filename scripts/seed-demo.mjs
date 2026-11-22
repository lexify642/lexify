// Demo data for every feature: cases (with hearing history, notes and
// limitation dates), clients, tasks (with comments/activity/attachments),
// calendar events, chats (groups, direct, case rooms, client chats),
// documents (real small PDFs in Storage), drafts (versions, comments,
// review requests) and clause collections.
//
// Dates are relative to the day you run it — some in the past, some today,
// some upcoming — plus a few on 21 Jul 2026, the fixed "today" that the
// Case Diary / Tasks / Calendar pages still use (data/cases.js TODAY).
//
//   node scripts/seed-demo.mjs
//
// Then run `npm run drafting-library:seed` and `npm run partnership-deed:seed`
// for the Legal Drafts, Clause Bank and Partnership Deed content.
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Refuses to
// run if any matters already exist, so it can't create duplicates.

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file not present — fine if the vars are already in the environment
  }
}

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.");
  process.exit(1);
}
const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

// ---------------------------------------------------------------- dates
const APP_TODAY = "2026-07-21";
const base = new Date();
base.setHours(12, 0, 0, 0);

function iso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
// Day offset from today → "YYYY-MM-DD".
function day(offset) {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return iso(d);
}
// Human display date ("16 Apr 2026") — the format matter_previous_dates and
// registered_on are stored in.
function display(isoDate) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
// Timestamp on a given ISO date at local (IST) time.
function at(isoDate, time = "10:00") {
  return new Date(`${isoDate}T${time}:00+05:30`).toISOString();
}

// ---------------------------------------------------------------- people
const { data: profiles, error: profileError } = await supabase.from("profiles").select("id, full_name, role").eq("is_active", true);
if (profileError) throw profileError;
const me = profiles.find((p) => p.role === "admin") || profiles[0];
if (!me) throw new Error("No active profile found — log in once before seeding.");
const ME = me.full_name || "Lexify";

const TEAM = {
  [ME]: { role: "Admin", dbRole: "admin" },
  "John Anderson": { role: "Senior Advocate", dbRole: "senior_advocate" },
  "R. Sharma": { role: "Junior Advocate", dbRole: "junior_advocate" },
  "K. Verma": { role: "Junior Advocate", dbRole: "junior_advocate" },
  "P. Iyer": { role: "Clerk", dbRole: "clerk" },
  "S. Nair": { role: "Staff", dbRole: "staff" },
};

const { count: existingMatters } = await supabase.from("matters").select("*", { count: "exact", head: true });
if (existingMatters > 0) {
  console.error(`There are already ${existingMatters} matter(s) — demo seed skipped to avoid duplicates.`);
  process.exit(1);
}

// ---------------------------------------------------------------- matters
function prev(offset, court, stage, purpose, outcome, advocate, fullNotes) {
  return { date: display(day(offset)), court, stage, purpose, outcome, advocate, full_notes: fullNotes };
}

const MATTERS = [
  {
    no: "01", number: "WP/890/2025", court: "High Court", city: "Bombay", room: "Courtroom 24", judge: "Justice A. Deshmukh",
    parties: "Chevron Inc. vs. State of California", date: day(0), time: "10:30 AM", stage: "Admission", tone: "blue",
    activity: "Affidavit in reply received", registered: day(-330), filing: "Writ Petition",
    client: { name: "Chevron Inc.", phone: "+91 98200 11223", address: "Nariman Point, Mumbai 400021" },
    caseDetails: {
      itemNo: "14", courtComplex: "Bombay High Court, Fort", bench: "Division Bench", caseCategory: "Writ Petition", caseType: "Constitutional Writ",
      practiceArea: "Constitutional Law", jurisdiction: "Writ", cnrNumber: "MHHC010012342025", dateOfInstitution: day(-330), dateOfRegistration: day(-330),
      caseStatus: "Active", priorityLevel: "High", assignedAdvocate: ME, opposingCounsel: "Adv. K. Mehra", tags: "Writ, High Priority",
      writ: { governmentDepartment: "Dept. of Environmental Regulation", constitutionalArticles: "Article 226, Article 14", publicAuthority: "State", reliefSought: "Quashing of the impugned regulatory order." },
    },
    docs: ["Writ Petition.pdf", "Affidavit in Reply.pdf"],
    previousDates: [
      prev(-28, "High Court, Bombay", "Admission", "Reply filed", "Respondent filed affidavit in reply; rejoinder permitted.", "John Anderson", "Respondent placed its affidavit in reply on record. Petitioner granted two weeks for rejoinder."),
      prev(-90, "High Court, Bombay", "Notice Stage", "Directions", "Respondent directed to file reply.", "R. Sharma", "Three weeks granted to the respondent to file its affidavit in reply."),
      prev(-330, "High Court, Bombay", "Institution", "Petition registered", "Notice issued.", ME, "Writ petition numbered; notice returnable in four weeks."),
    ],
    notes: [
      { text: "Carry two sets of the compilation for the bench.", is_reminder: true, due_date: day(0) },
      { text: "Client wants an update call after the hearing.", is_reminder: false },
    ],
  },
  {
    no: "02", number: "CS/1245/2024", court: "Supreme Court", city: "New Delhi", room: "Courtroom 3", judge: "Justice S. Kaul",
    parties: "ABC Corp. vs. XYZ Ltd.", date: day(0), time: "12:00 PM", stage: "Final Hearing", tone: "orange",
    activity: "Written submissions filed", registered: day(-610), filing: "Civil Suit",
    client: { name: "ABC Corp.", phone: "+91 98111 22334", address: "Connaught Place, New Delhi 110001" },
    caseDetails: {
      itemNo: "7", caseCategory: "Civil", caseType: "Commercial Suit", practiceArea: "Commercial Litigation", jurisdiction: "Original",
      dateOfInstitution: day(-610), dateOfRegistration: day(-610), caseStatus: "Active", priorityLevel: "High", assignedAdvocate: "John Anderson",
      opposingCounsel: "Adv. P. Singhania", tags: "Commercial, High Value",
      civil: { suitValuation: "4,50,00,000", reliefClaimed: "Recovery of dues with interest", natureOfSuit: "Money Suit", limitationDate: day(5), courtFeePaid: "2,15,000", valuationMethod: "Ad Valorem" },
    },
    docs: ["Plaint.pdf", "Written Submissions.pdf"],
    previousDates: [
      prev(-21, "Supreme Court", "Arguments", "Part-heard", "Arguments continued; listed for final hearing.", "John Anderson", "Final arguments commenced; matter part-heard and directed to be listed for continuation."),
      prev(-75, "Supreme Court", "Arguments", "Arguments", "Petitioner's arguments concluded.", "John Anderson", "Petitioner concluded arguments on limitation and quantum."),
    ],
    notes: [{ text: "Focus next hearing on limitation.", is_reminder: true, due_date: day(-1) }],
  },
  {
    no: "03", number: "SC/456/2025", court: "City Civil & Sessions Court", city: "Mumbai", room: "Room 12", judge: "Judge M. Pathak",
    parties: "State vs. R. Khanna", date: day(0), time: "02:15 PM", stage: "Evidence", tone: "orange",
    activity: "Witness list filed", registered: day(-260), filing: "Sessions Case",
    client: { name: "R. Khanna", phone: "+91 99300 44556", address: "Andheri West, Mumbai 400058" },
    caseDetails: {
      itemNo: "31", caseCategory: "Criminal", caseType: "Sessions Trial", practiceArea: "Criminal Law", jurisdiction: "Original",
      dateOfInstitution: day(-260), dateOfRegistration: day(-260), caseStatus: "Active", priorityLevel: "Medium", assignedAdvocate: "R. Sharma",
      criminal: { firNumber: "112/2025", firDate: day(-300), policeStation: "Andheri PS", sections: "BNS 318, 316", bailStatus: "Granted", custodyStatus: "On Bail" },
    },
    docs: ["Charge Sheet.pdf"],
    previousDates: [prev(-35, "Sessions Court, Mumbai", "Evidence", "PW-2 examined", "Cross-examination deferred.", "R. Sharma", "")],
    notes: [],
  },
  {
    no: "04", number: "CP(IB)/77/2025", court: "NCLT", city: "Mumbai", room: "Courtroom 1", judge: "Member (J) V. Rao",
    parties: "Mehta Industries vs. Union of India", date: day(1), time: "11:00 AM", stage: "Arguments", tone: "blue",
    activity: "Rejoinder filed", registered: day(-200), filing: "Company Petition",
    client: { name: "Mehta Industries", phone: "+91 98670 77889", address: "Lower Parel, Mumbai 400013" },
    caseDetails: {
      itemNo: "5", caseCategory: "Company / NCLT", caseStatus: "Active", priorityLevel: "High", assignedAdvocate: ME, dateOfRegistration: day(-200),
      company: { companyName: "Mehta Industries Pvt. Ltd.", petitionNumber: "CP(IB)/77/2025", creditorType: "Operational Creditor" },
    },
    docs: ["Company Petition.pdf"],
    previousDates: [prev(-14, "NCLT, Mumbai", "Reply", "Rejoinder", "Rejoinder taken on record.", ME, "")],
    notes: [],
  },
  {
    no: "05", number: "ARBP/310/2025", court: "High Court", city: "Bombay", room: "Courtroom 18", judge: "Justice N. Kulkarni",
    parties: "Orion Logistics vs. Prime Warehousing", date: day(3), time: "11:30 AM", stage: "Notice Stage", tone: "blue",
    activity: "Notice served", registered: day(-95), filing: "Arbitration Petition",
    client: { name: "Orion Logistics", phone: "+91 98190 55667", address: "Bhiwandi, Thane 421302" },
    caseDetails: {
      itemNo: "22", caseCategory: "Arbitration", caseStatus: "Active", priorityLevel: "Medium", assignedAdvocate: "K. Verma", dateOfRegistration: day(-95),
      arbitration: { clauseReference: "Clause 18 of the Warehousing Agreement", tribunalType: "Sole Arbitrator", seat: "Mumbai" },
    },
    docs: [],
    previousDates: [prev(-40, "High Court, Bombay", "Notice Stage", "First listing", "Notice issued.", "K. Verma", "")],
    notes: [],
  },
  {
    no: "06", number: "LCS/2210/2025", court: "City Civil Court", city: "Mumbai", room: "Room 7", judge: "Judge A. Joshi",
    parties: "Sunrise Developers vs. Municipal Corporation", date: day(7), time: "11:00 AM", stage: "Written Statement", tone: "blue",
    activity: "Draft written statement under review", registered: day(-60), filing: "Civil Suit",
    client: { name: "Sunrise Developers", phone: "+91 98330 12121", address: "Powai, Mumbai 400076" },
    caseDetails: {
      itemNo: "9", caseCategory: "Civil", caseStatus: "Active", priorityLevel: "Medium", assignedAdvocate: ME, dateOfRegistration: day(-60),
      civil: { suitValuation: "1,20,00,000", natureOfSuit: "Declaration & Injunction", limitationDate: day(12), courtFeePaid: "" },
    },
    docs: [],
    previousDates: [prev(-20, "City Civil Court, Mumbai", "Notice Stage", "Appearance", "Defendant appeared; time for WS.", ME, "")],
    notes: [{ text: "Court fee balance to be paid before next date.", is_reminder: true, due_date: day(2) }],
  },
  {
    no: "07", number: "PA/1102/2025", court: "Family Court", city: "Bandra", room: "Court No. 4", judge: "Judge S. Menon",
    parties: "Priya Malhotra vs. Arjun Malhotra", date: day(10), time: "03:00 PM", stage: "Evidence", tone: "orange",
    activity: "Mediation report received", registered: day(-180), filing: "Petition",
    client: { name: "Priya Malhotra", phone: "+91 98201 33445", address: "Bandra West, Mumbai 400050" },
    caseDetails: {
      itemNo: "18", caseCategory: "Family", caseStatus: "Active", priorityLevel: "Medium", assignedAdvocate: "R. Sharma", dateOfRegistration: day(-180),
      family: { marriageDate: "2016-02-14", divorcePetitionType: "Contested", maintenanceClaimed: "75,000 per month" },
    },
    docs: [],
    previousDates: [prev(-30, "Family Court, Bandra", "Mediation", "Mediation failed", "Matter sent back for trial.", "R. Sharma", "")],
    notes: [],
  },
  {
    no: "08", number: "CC/88/2026", court: "District Consumer Commission", city: "Mumbai Suburban", room: "Bench 2", judge: "President R. Kapoor",
    parties: "Kavita Rao vs. HomeCraft Appliances", date: day(14), time: "11:00 AM", stage: "Institution", tone: "blue",
    activity: "Complaint filed", registered: day(-3), filing: "Consumer Complaint",
    client: { name: "Kavita Rao", phone: "+91 99870 12345", address: "Goregaon East, Mumbai 400063" },
    caseDetails: { itemNo: "", caseCategory: "Consumer", caseStatus: "Active", priorityLevel: "Low", assignedAdvocate: "", dateOfRegistration: day(-3), consumer: { complaintValue: "1,85,000", productOrService: "Refrigerator", consumerCommission: "District" } },
    docs: [],
    previousDates: [],
    notes: [],
  },
  {
    no: "09", number: "SCS/412/2026", court: "City Civil Court", city: "Mumbai", room: "Room 3", judge: "Judge P. Kale",
    parties: "Rakesh Malhotra vs. Shree Estates", date: day(21), time: "11:00 AM", stage: "Institution", tone: "blue",
    activity: "Suit filed", registered: day(-1), filing: "Civil Suit",
    client: { name: "Rakesh Malhotra", phone: "+91 98925 67890", address: "Chembur, Mumbai 400071" },
    caseDetails: {
      itemNo: "", caseCategory: "Property", caseStatus: "Active", priorityLevel: "Medium", assignedAdvocate: "", dateOfRegistration: day(-1),
      civil: { natureOfSuit: "Specific Performance", limitationDate: day(25), suitValuation: "85,00,000" },
    },
    docs: [],
    previousDates: [],
    notes: [],
  },
  {
    no: "10", number: "IDA/56/2026", court: "Industrial Tribunal", city: "Mumbai", room: "Court 2", judge: "Presiding Officer D. Gokhale",
    parties: "Nexa Software vs. Labour Commissioner", date: day(30), time: "02:30 PM", stage: "Reply", tone: "blue",
    activity: "Reply to be filed", registered: day(-45), filing: "Reference",
    client: { name: "Nexa Software", phone: "+91 98450 11122", address: "Malad West, Mumbai 400064" },
    caseDetails: { itemNo: "11", caseCategory: "Labour & Employment", caseStatus: "Active", priorityLevel: "Low", assignedAdvocate: "K. Verma", dateOfRegistration: day(-45) },
    docs: [],
    previousDates: [prev(-12, "Industrial Tribunal, Mumbai", "Notice Stage", "Appearance", "Time granted for reply.", "K. Verma", "")],
    notes: [],
  },
  {
    no: "11", number: "ITA/905/2026", court: "ITAT", city: "Mumbai", room: "Bench C", judge: "Members A. Iyer & B. Shah",
    parties: "Global Traders vs. Income Tax Officer", date: day(18), time: "10:30 AM", stage: "Institution", tone: "blue",
    activity: "Appeal filed", registered: day(-5), filing: "Tax Appeal",
    client: { name: "Global Traders", phone: "+91 98200 99887", address: "Masjid Bunder, Mumbai 400003" },
    caseDetails: { itemNo: "", caseCategory: "Tax", caseStatus: "Active", priorityLevel: "Medium", assignedAdvocate: "", dateOfRegistration: day(-5), tax: { assessmentYear: "2023-24", taxDemand: "38,40,000" } },
    docs: [],
    previousDates: [],
    notes: [],
  },
  {
    no: "12", number: "COMS/77/2025", court: "High Court", city: "Bombay", room: "Courtroom 31", judge: "Justice R. Iyer",
    parties: "Bluewave Shipping vs. Coastal Ports Ltd.", date: day(45), time: "11:00 AM", stage: "Written Statement", tone: "red",
    activity: "Counter-claim being prepared", registered: day(-150), filing: "Commercial Suit",
    client: { name: "Bluewave Shipping", phone: "+91 98210 44001", address: "Ballard Estate, Mumbai 400001" },
    caseDetails: {
      itemNo: "40", caseCategory: "Civil", caseStatus: "Active", priorityLevel: "High", assignedAdvocate: "John Anderson", dateOfRegistration: day(-150),
      civil: { natureOfSuit: "Damages", limitationDate: day(-2), suitValuation: "2,75,00,000", courtFeePaid: "1,10,000" },
    },
    docs: [],
    previousDates: [prev(-25, "High Court, Bombay", "Written Statement", "WS filed", "Counter-claim liberty reserved.", "John Anderson", "")],
    notes: [],
  },
  {
    no: "13", number: "BA/1290/2026", court: "Sessions Court", city: "Thane", room: "Court 6", judge: "Judge V. Bhosale",
    parties: "State vs. Imran Shaikh", date: day(0), time: "04:00 PM", stage: "Arguments", tone: "orange",
    activity: "Bail application listed", registered: day(-8), filing: "Bail Application",
    client: { name: "Imran Shaikh", phone: "+91 97690 22110", address: "Mumbra, Thane 400612" },
    caseDetails: { itemNo: "52", caseCategory: "Criminal", caseStatus: "Active", priorityLevel: "High", assignedAdvocate: ME, dateOfRegistration: day(-8), criminal: { firNumber: "301/2026", policeStation: "Mumbra PS", bailStatus: "Applied", custodyStatus: "Judicial Custody" } },
    docs: [],
    previousDates: [prev(-4, "Sessions Court, Thane", "Arguments", "Say of prosecution", "Prosecution sought time.", ME, "")],
    notes: [],
  },
  {
    no: "14", number: "SS/1500/2025", court: "High Court", city: "Bombay", room: "Courtroom 9", judge: "Justice G. Patel",
    parties: "Desai Textiles vs. Hindustan Bank", date: day(60), time: "11:00 AM", stage: "Evidence", tone: "blue",
    activity: "Affidavit of evidence filed", registered: day(-400), filing: "Summary Suit",
    client: { name: "Desai Textiles", phone: "+91 98190 66554", address: "Bhiwandi, Thane 421302" },
    caseDetails: { itemNo: "3", caseCategory: "Civil", caseStatus: "Active", priorityLevel: "Low", assignedAdvocate: "K. Verma", dateOfRegistration: day(-400), civil: { limitationDate: day(60), natureOfSuit: "Recovery" } },
    docs: [],
    previousDates: [prev(-50, "High Court, Bombay", "Evidence", "Evidence", "Affidavit of evidence taken on record.", "K. Verma", "")],
    notes: [],
  },
  // Two concluded matters whose last date is 21 Jul 2026 — the date the
  // Case Diary's "Today" button still points to.
  {
    no: "15", number: "WP/455/2026", court: "High Court", city: "Bombay", room: "Courtroom 12", judge: "Justice A. Deshmukh",
    parties: "Anand Kumar vs. State of Maharashtra", date: APP_TODAY, time: "11:00 AM", stage: "Judgment", tone: "green",
    activity: "Petition allowed", registered: "2026-02-10", filing: "Writ Petition",
    client: { name: "Anand Kumar", phone: "+91 99200 33221", address: "Dadar, Mumbai 400014" },
    caseDetails: { itemNo: "8", caseCategory: "Writ Petition", caseStatus: "Disposed", priorityLevel: "Low", assignedAdvocate: "John Anderson", dateOfRegistration: "2026-02-10" },
    docs: [],
    previousDates: [{ date: display("2026-06-10"), court: "High Court, Bombay", stage: "Arguments", purpose: "Final arguments", outcome: "Judgment reserved.", advocate: "John Anderson", full_notes: "" }],
    notes: [],
  },
  {
    no: "16", number: "PA/320/2025", court: "Family Court", city: "Bandra", room: "Court No. 2", judge: "Judge S. Menon",
    parties: "Neha Fernandes vs. Carl Fernandes", date: APP_TODAY, time: "02:30 PM", stage: "Judgment", tone: "green",
    activity: "Decree by mutual consent", registered: "2025-11-05", filing: "Petition",
    client: { name: "Neha Fernandes", phone: "+91 98201 77665", address: "Santacruz, Mumbai 400054" },
    caseDetails: { itemNo: "15", caseCategory: "Family", caseStatus: "Closed", priorityLevel: "Low", assignedAdvocate: "R. Sharma", dateOfRegistration: "2025-11-05", family: { divorcePetitionType: "Mutual Consent" } },
    docs: [],
    previousDates: [],
    notes: [],
  },
];

const matterIdByNo = new Map();
for (const m of MATTERS) {
  // clients is unique on lower(name), so look up before inserting.
  let { data: client, error: clientError } = await supabase.from("clients").select("id").ilike("name", m.client.name).maybeSingle();
  if (clientError) throw clientError;
  if (!client) {
    ({ data: client, error: clientError } = await supabase
      .from("clients")
      .insert({ name: m.client.name, phone: m.client.phone, address: m.client.address })
      .select("id")
      .single());
    if (clientError) throw clientError;
  }

  const details = Object.fromEntries(Object.entries(m.caseDetails).filter(([, v]) => v !== undefined));
  const { data: matter, error } = await supabase
    .from("matters")
    .insert({
      display_no: m.no, number: m.number, court: m.court, city: m.city, room: m.room, judge: m.judge, parties: m.parties,
      hearing_date: m.date, hearing_time: m.time, stage: m.stage, tone: m.tone, activity_summary: m.activity,
      registered_on: display(m.registered), filing_type: m.filing, client_id: client.id, case_details: details, docs: m.docs,
      created_by: me.id,
    })
    .select("id")
    .single();
  if (error) throw error;
  matterIdByNo.set(m.no, matter.id);

  if (m.previousDates.length) {
    const rows = m.previousDates.map((p, i) => ({ matter_id: matter.id, ...p, created_at: at(day(-400 + (m.previousDates.length - i) * 10)) }));
    const { error: e } = await supabase.from("matter_previous_dates").insert(rows);
    if (e) throw e;
  }
  if (m.notes.length) {
    const { error: e } = await supabase.from("matter_notes").insert(
      m.notes.map((n, i) => ({ matter_id: matter.id, text: n.text, is_reminder: !!n.is_reminder, due_date: n.due_date || null, completed: false, created_by: me.id, created_at: at(day(-3 - i)) }))
    );
    if (e) throw e;
  }
}
console.log(`Matters: ${MATTERS.length} (with clients, hearing history and notes)`);

// ---------------------------------------------------------------- tasks
function task(title, caseNo, assignedTo, dueOffsetOrDate, status, priority, extra = {}) {
  const dueDate = typeof dueOffsetOrDate === "string" ? dueOffsetOrDate : day(dueOffsetOrDate);
  return { title, caseNo, assignedTo, dueDate, status, priority, ...extra };
}

const TASKS = [
  // overdue
  task("Draft rejoinder to affidavit in reply", "01", ME, -3, "In Progress", "High", { comments: ["First draft shared on email.", "Please add the 2019 notification as Annexure P-7."] }),
  task("Collect signed vakalatnama from client", "05", "P. Iyer", -2, "Pending", "Medium"),
  task("File inspection application for seized documents", "03", "R. Sharma", -1, "Waiting for Review", "High"),
  task("Send fee invoice for September", null, ME, -6, "Pending", "Low", { clientName: "Mehta Industries" }),
  // due today
  task("Prepare compilation for today's hearing", "01", ME, 0, "In Progress", "High", { dueTime: "09:30 AM", attachments: ["Compilation Vol I.pdf"] }),
  task("Brief senior counsel on limitation point", "02", "John Anderson", 0, "Pending", "High", { dueTime: "11:00 AM" }),
  task("Arrange surety for bail hearing", "13", ME, 0, "Pending", "High"),
  task("Update client on evidence stage", "03", "R. Sharma", 0, "Pending", "Medium"),
  // upcoming
  task("File written submissions in NCLT", "04", ME, 1, "In Progress", "High"),
  task("Prepare list of dates for arbitration petition", "05", "K. Verma", 2, "Pending", "Medium"),
  task("Finalise written statement", "06", ME, 4, "Pending", "High", { comments: ["Client has approved paras 1–12."] }),
  task("Draft mediation settlement terms", "07", "R. Sharma", 6, "Pending", "Medium"),
  task("Conflict check for new consumer matter", "08", "S. Nair", 3, "Pending", "Low"),
  task("Compute limitation for specific performance suit", "09", "John Anderson", 5, "Pending", "Medium"),
  task("Prepare reply to the reference", "10", "K. Verma", 12, "Pending", "Low"),
  // completed
  task("File court fee receipt", "02", "P. Iyer", -2, "Completed", "Medium", { completedOn: day(-2) }),
  task("Serve notice on respondent", "05", "K. Verma", -5, "Completed", "Medium", { completedOn: day(-4) }),
  task("Obtain certified copy of order", "04", ME, 0, "Completed", "Low", { completedOn: day(0) }),
  task("Index documents for appeal", "11", "S. Nair", -1, "Completed", "Low", { completedOn: day(-1) }),
  // around 21 Jul 2026 (the Tasks page's fixed "today")
  task("Collect certified copy of judgment", "15", "P. Iyer", APP_TODAY, "Completed", "Medium", { completedOn: APP_TODAY }),
  task("Close file and return original documents", "16", "S. Nair", APP_TODAY, "Pending", "Low"),
];

const taskIds = [];
for (const t of TASKS) {
  const assignedBy = t.assignedTo === ME ? "John Anderson" : ME;
  const assignedAt = at(t.dueDate < day(0) ? t.dueDate : day(-7), "09:00");
  const createdAt = new Date(Math.min(new Date(assignedAt), new Date(at(t.dueDate, "09:00")) - 5 * 86400000)).toISOString();
  const { data: row, error } = await supabase
    .from("tasks")
    .insert({
      title: t.title, matter_id: t.caseNo ? matterIdByNo.get(t.caseNo) : null, client_name: t.clientName || null,
      assigned_by_name: assignedBy, assigned_by_role: TEAM[assignedBy].role, assigned_to_name: t.assignedTo, assigned_to_role: TEAM[t.assignedTo].role,
      assigned_at: createdAt, priority: t.priority, due_date: t.dueDate, due_time: t.dueTime || null, status: t.status,
      reminder: "1 Day Before", created_by: me.id, created_at: createdAt,
    })
    .select("id")
    .single();
  if (error) throw error;
  taskIds.push(row.id);

  const activity = [{ task_id: row.id, status_to: "Pending", note: "Task created and assigned.", actor_name: assignedBy, created_at: createdAt }];
  if (t.status !== "Pending") {
    activity.push({ task_id: row.id, status_to: "In Progress", note: "Started work.", actor_name: t.assignedTo, created_at: new Date(new Date(createdAt).getTime() + 86400000).toISOString() });
  }
  if (t.status === "Waiting for Review" || t.status === "Completed") {
    activity.push({ task_id: row.id, status_to: t.status, note: t.status === "Completed" ? "Done." : "Sent for review.", actor_name: t.assignedTo, created_at: at(t.completedOn || day(-1), "16:30") });
  }
  const { error: ae } = await supabase.from("task_activity").insert(activity);
  if (ae) throw ae;

  if (t.comments?.length) {
    const { error: ce } = await supabase.from("task_comments").insert(t.comments.map((body, i) => ({ task_id: row.id, author_name: i % 2 ? assignedBy : t.assignedTo, body, created_at: at(day(-2 + i), "15:00") })));
    if (ce) throw ce;
  }
  if (t.attachments?.length) {
    const { error: te } = await supabase.from("task_attachments").insert(t.attachments.map((name) => ({ task_id: row.id, name })));
    if (te) throw te;
  }
}
console.log(`Tasks: ${TASKS.length} (overdue, due today, upcoming, completed)`);

// ---------------------------------------------------------------- calendar
const EVENTS = [
  { title: "Client briefing — Chevron Inc.", type: "Appointment", date: day(0), time: "05:30 PM", location: "Chambers, Room 3", caseNo: "01", assignedTo: ME, priority: "High" },
  { title: "Consultation — Rakesh Malhotra", type: "Appointment", date: day(1), time: "11:30 AM", location: "Chambers, Room 1", client: "Rakesh Malhotra", assignedTo: ME, priority: "Medium" },
  { title: "Conference with senior counsel — ABC Corp.", type: "Appointment", date: day(2), time: "06:00 PM", location: "Video call", caseNo: "02", assignedTo: "John Anderson", priority: "High" },
  { title: "Settlement meeting — Malhotra", type: "Appointment", date: day(5), time: "04:00 PM", location: "Chambers, Room 2", caseNo: "07", assignedTo: "R. Sharma", priority: "Medium" },
  { title: "Client meeting — Sunrise Developers", type: "Appointment", date: day(-2), time: "03:00 PM", location: "Client office, Powai", caseNo: "06", assignedTo: ME, priority: "Medium", status: "Completed" },
  { title: "Witness conference — R. Khanna", type: "Appointment", date: day(-5), time: "05:00 PM", location: "Chambers, Room 3", caseNo: "03", assignedTo: "R. Sharma", priority: "Medium", status: "Missed" },
  { title: "File vakalatnama in consumer complaint", type: "Deadline", date: day(0), time: "05:00 PM", caseNo: "08", assignedTo: "P. Iyer", priority: "High" },
  { title: "Last date to file written statement", type: "Deadline", date: day(1), time: "05:00 PM", caseNo: "02", assignedTo: "John Anderson", priority: "High" },
  { title: "Rejoinder due — arbitration petition", type: "Deadline", date: day(4), time: "05:00 PM", caseNo: "05", assignedTo: "K. Verma", priority: "Medium" },
  { title: "Deposit 20% of demand with appeal", type: "Deadline", date: day(9), time: "05:00 PM", caseNo: "11", assignedTo: ME, priority: "High" },
  { title: "Reply in NCLT — extended date", type: "Deadline", date: day(-1), time: "05:00 PM", caseNo: "04", assignedTo: ME, priority: "High" },
  { title: "Annual return of chamber accounts", type: "Deadline", date: day(40), time: "05:00 PM", assignedTo: "S. Nair", priority: "Low" },
  { title: "Renew Bar Council membership", type: "Reminder", date: day(3), time: "10:00 AM", assignedTo: ME, priority: "Low" },
  { title: "Follow up on certified copy", type: "Reminder", date: day(-1), time: "10:00 AM", caseNo: "04", assignedTo: "P. Iyer", priority: "Low", status: "Completed" },
  { title: "Bar association meeting", type: "Other", date: day(8), time: "06:30 PM", location: "Bar Library", assignedTo: ME, priority: "Low" },
  { title: "Judgment pronouncement — Anand Kumar", type: "Appointment", date: APP_TODAY, time: "11:00 AM", location: "High Court, Courtroom 12", caseNo: "15", assignedTo: "John Anderson", priority: "Medium", status: "Completed" },
  { title: "Return original documents — Fernandes", type: "Deadline", date: APP_TODAY, time: "05:00 PM", caseNo: "16", assignedTo: "S. Nair", priority: "Low" },
];
const { data: eventRows, error: eventError } = await supabase
  .from("appointments")
  .insert(
    EVENTS.map((e) => ({
      title: e.title, event_type: e.type, event_date: e.date, event_time: e.time, location: e.location || null,
      matter_id: e.caseNo ? matterIdByNo.get(e.caseNo) : null, client_name: e.client || null, notes: null,
      assigned_to_name: e.assignedTo, assigned_to_role: TEAM[e.assignedTo].role, reminder: "1 Hour Before",
      status: e.status || "Scheduled", priority: e.priority, created_by: me.id,
    }))
  )
  .select("id");
if (eventError) throw eventError;
console.log(`Calendar events: ${EVENTS.length}`);

// ---------------------------------------------------------------- chat
const { data: groups, error: groupError } = await supabase
  .from("groups")
  .insert([
    { name: "Litigation Team", member_names: [ME, "John Anderson", "R. Sharma", "K. Verma"], created_by: me.id },
    { name: "Chambers Admin", member_names: [ME, "P. Iyer", "S. Nair"], created_by: me.id },
  ])
  .select("id, name");
if (groupError) throw groupError;
const groupId = Object.fromEntries(groups.map((g) => [g.name, g.id]));

const dm = (a, b) => `dm-${[a, b].sort().join("__")}`;
const { error: dmError } = await supabase.from("direct_conversations").insert([
  { id: dm(ME, "John Anderson"), member_names: [ME, "John Anderson"] },
  { id: dm(ME, "R. Sharma"), member_names: [ME, "R. Sharma"] },
]);
if (dmError) throw dmError;

// [conversationId, senderName, text, isoDate, time]. Client senders have no
// role (they aren't staff), which is how the Dashboard spots clients still
// waiting on a reply.
const staff = (name) => ({ name, role: TEAM[name].dbRole });
const client = (name) => ({ name, role: null });
const MESSAGES = [
  [groupId["Litigation Team"], staff("John Anderson"), "Today's board: Chevron at 10:30, ABC Corp. at 12, Khanna at 2:15, Shaikh bail at 4.", day(0), "08:45"],
  [groupId["Litigation Team"], staff("R. Sharma"), "Witness for Khanna confirmed for 2:15.", day(0), "09:05"],
  [groupId["Litigation Team"], staff(ME), "Thanks. I'll take Chevron and the bail matter.", day(0), "09:10"],
  [groupId["Litigation Team"], staff("K. Verma"), "Orion notice is served — affidavit of service ready.", day(-1), "17:20"],
  [groupId["Chambers Admin"], staff("P. Iyer"), "Court fee receipt for ABC Corp. filed.", day(-2), "13:00"],
  [groupId["Chambers Admin"], staff("S. Nair"), "September invoices are pending your approval.", day(-1), "11:30"],
  [dm(ME, "John Anderson"), staff("John Anderson"), "Can you look at the limitation note before 11?", day(0), "08:30"],
  [dm(ME, "John Anderson"), staff(ME), "Yes, sending comments in 20 minutes.", day(0), "08:40"],
  [dm(ME, "R. Sharma"), staff("R. Sharma"), "Inspection application is ready for your review.", day(-1), "18:10"],
  ["case-01", staff(ME), "Compilation Vol I is uploaded to the file.", day(-1), "19:00"],
  ["case-01", staff("John Anderson"), "Good. Flag the 2019 notification for the bench.", day(-1), "19:20"],
  ["case-02", staff("John Anderson"), "Senior counsel conference fixed for day after tomorrow.", day(0), "10:00"],
  // client chats
  [`client-Chevron Inc.`, staff(ME), "Your matter is listed today at 10:30 AM, item 14.", day(-1), "18:00"],
  [`client-Chevron Inc.`, client("Chevron Inc."), "Thank you. Should our compliance head attend?", day(0), "08:15"],
  [`client-ABC Corp.`, staff("John Anderson"), "Written submissions have been filed.", day(-4), "16:00"],
  [`client-ABC Corp.`, client("ABC Corp."), "Please share the filed copy and the next steps.", day(-2), "11:20"],
  [`client-Priya Malhotra`, client("Priya Malhotra"), "Is the settlement meeting still on? I may be travelling.", day(-1), "21:05"],
  [`client-R. Khanna`, client("R. Khanna"), "What time should I reach court?", day(-1), "20:00"],
  [`client-R. Khanna`, staff("R. Sharma"), "Please be there by 1:45 PM, Room 12.", day(-1), "20:30"],
  [`client-Kavita Rao`, client("Kavita Rao"), "I have uploaded the invoice and warranty card.", day(-3), "12:00"],
  [`client-Kavita Rao`, staff("S. Nair"), "Received, thank you. We'll file this week.", day(-3), "12:40"],
  [`client-Rakesh Malhotra`, client("Rakesh Malhotra"), "Has the suit been numbered yet?", day(0), "09:40"],
];
const { data: messageRows, error: messageError } = await supabase
  .from("messages")
  .insert(
    MESSAGES.map(([conversationId, sender, text, date, time]) => ({
      conversation_id: conversationId, sender_name: sender.name, sender_role: sender.role, sender_id: sender.name === ME ? me.id : null,
      text, created_at: at(date, time), status: "sent",
    }))
  )
  .select("id, conversation_id");
if (messageError) throw messageError;

const { error: assignError } = await supabase.from("client_chat_assignments").upsert([
  { client_name: "Chevron Inc.", assigned_to_name: ME, assigned_to_role: TEAM[ME].role },
  { client_name: "ABC Corp.", assigned_to_name: "John Anderson", assigned_to_role: "Senior Advocate" },
  { client_name: "R. Khanna", assigned_to_name: "R. Sharma", assigned_to_role: "Junior Advocate" },
  { client_name: "Priya Malhotra", assigned_to_name: "R. Sharma", assigned_to_role: "Junior Advocate" },
]);
if (assignError) throw assignError;
console.log(`Chat: ${groups.length} groups, 2 direct chats, ${MESSAGES.length} messages (incl. 4 clients waiting for a reply)`);

// ---------------------------------------------------------------- documents
// Minimal one-page PDF with a title and a line of text, so Document Library
// previews/downloads open a real file.
function pdf(title, line) {
  const esc = (s) => s.replace(/[\\()]/g, (c) => `\\${c}`);
  const stream = `BT /F1 20 Tf 60 760 Td (${esc(title)}) Tj /F1 12 Tf 0 -30 Td (${esc(line)}) Tj 0 -18 Td (Demo document generated for Lexifyi.) Tj ET`;
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

const DOCS = [
  { name: "Writ Petition.pdf", caseNo: "01", category: "Pleading", by: ME, date: day(-330), tags: ["petition"] },
  { name: "Affidavit in Reply.pdf", caseNo: "01", category: "Pleading", by: "John Anderson", date: day(-28), tags: ["reply"] },
  { name: "Compilation Vol I.pdf", caseNo: "01", category: "Research", by: ME, date: day(0), tags: ["compilation"], taskIndex: 4, conversation: "case-01" },
  { name: "Plaint.pdf", caseNo: "02", category: "Pleading", by: "John Anderson", date: day(-610), tags: [] },
  { name: "Written Submissions.pdf", caseNo: "02", category: "Pleading", by: "John Anderson", date: day(-4), tags: ["submissions"] },
  { name: "Charge Sheet.pdf", caseNo: "03", category: "Evidence", by: "R. Sharma", date: day(-200), tags: ["evidence"] },
  { name: "Order dated last hearing.pdf", caseNo: "04", category: "Court Order", by: "P. Iyer", date: day(-14), tags: ["order"] },
  { name: "Warranty card and invoice.pdf", client: "Kavita Rao", category: "Evidence", by: "S. Nair", date: day(-3), tags: ["consumer"], conversation: "client-Kavita Rao" },
  { name: "Fee invoice September.pdf", client: "Mehta Industries", category: "Invoice", by: "S. Nair", date: day(-6), tags: ["billing"] },
  { name: "Unsorted scan.pdf", category: null, by: "P. Iyer", date: day(-1), tags: [] },
];
for (const d of DOCS) {
  const id = randomUUID();
  const file = pdf(d.name.replace(/\.pdf$/, ""), d.caseNo ? MATTERS.find((m) => m.no === d.caseNo).parties : d.client || "Chambers file");
  const storagePath = `${me.id}/demo-${id}-${d.name.replace(/[^\w.-]+/g, "_")}`;
  const { error: upError } = await supabase.storage.from("firm-files").upload(storagePath, file, { contentType: "application/pdf", upsert: true });
  if (upError) throw upError;
  const sourceMessage = d.conversation ? messageRows.find((m) => m.conversation_id === d.conversation) : null;
  const { error } = await supabase.from("attachments").insert({
    id, name: d.name, mime_category: "pdf", size: file.length, storage_path: storagePath, uploaded_by: d.by === ME ? me.id : null,
    uploaded_by_name: d.by, uploaded_at: at(d.date, "12:00"), source_conversation_id: d.conversation || null, source_message_id: sourceMessage?.id || null,
    category: d.category, description: "", tags: d.tags, linked_matter_id: d.caseNo ? matterIdByNo.get(d.caseNo) : null,
    linked_client_name: d.client || null, linked_task_id: d.taskIndex !== undefined ? taskIds[d.taskIndex] : null,
  });
  if (error) throw error;
  if (sourceMessage) {
    await supabase.from("messages").update({ attachment_ids: [id] }).eq("id", sourceMessage.id);
  }
}
console.log(`Documents: ${DOCS.length} PDFs uploaded to Storage`);

// ---------------------------------------------------------------- drafts
const p = (text, marks) => ({ type: "paragraph", content: [{ type: "text", text, ...(marks ? { marks } : {}) }] });
const h = (text, level = 2) => ({ type: "heading", attrs: { level }, content: [{ type: "text", text }] });
const docText = (doc) => doc.content.map((n) => (n.content || []).map((c) => c.text).join("")).join("\n");

const DRAFTS = [
  {
    title: "Legal Notice — Recovery of Dues", type: "Legal Notice", caseNo: "02", client: "ABC Corp.", description: "Pre-litigation notice demanding outstanding invoices.",
    versions: [
      { doc: { type: "doc", content: [h("LEGAL NOTICE", 1), p("To, XYZ Ltd., New Delhi."), p("Under instructions from our client ABC Corp., we hereby call upon you to pay the outstanding sum within 15 days.")] }, action: "Created", by: "John Anderson", date: day(-12) },
      { doc: { type: "doc", content: [h("LEGAL NOTICE", 1), p("To, XYZ Ltd., Connaught Place, New Delhi 110001."), p("Under instructions from our client ABC Corp., we hereby call upon you to pay the outstanding sum of Rs. 4,50,00,000 with interest at 18% p.a. within 15 days of receipt of this notice, failing which our client shall initiate proceedings at your risk as to costs.")] }, action: "Edited", by: ME, date: day(-2) },
    ],
  },
  {
    title: "Written Statement — Sunrise Developers", type: "Pleading", caseNo: "06", client: "Sunrise Developers", description: "Written statement on behalf of the defendant.",
    commentId: randomUUID(),
    versions: [
      { doc: null, action: "Created", by: ME, date: day(-5) },
    ],
  },
  {
    title: "Leave and Licence Agreement", type: "Agreement", caseNo: null, client: "Rakesh Malhotra", description: "Residential leave and licence for 11 months.",
    versions: [{ doc: { type: "doc", content: [h("LEAVE AND LICENCE AGREEMENT", 1), p("This agreement is made at Mumbai between the Licensor and the Licensee for a period of eleven months."), p("The licence fee shall be payable on or before the 5th of every month.")] }, action: "Created", by: ME, date: day(0) }],
  },
];
// Written statement doc carries a real comment anchor for its comment thread.
DRAFTS[1].versions[0].doc = {
  type: "doc",
  content: [
    h("IN THE CITY CIVIL COURT AT MUMBAI", 1),
    p("WRITTEN STATEMENT ON BEHALF OF THE DEFENDANT"),
    p("1. The suit is barred by limitation and deserves to be dismissed at the threshold.", [{ type: "comment", attrs: { commentId: DRAFTS[1].commentId } }]),
    p("2. The plaintiff has suppressed material facts regarding the sanctioned plan."),
  ],
};

for (const d of DRAFTS) {
  const { data: draft, error } = await supabase
    .from("drafts")
    .insert({ title: d.title, type: d.type, matter_id: d.caseNo ? matterIdByNo.get(d.caseNo) : null, client_name: d.client, description: d.description, design: { preset: d.type }, created_by: me.id, created_at: at(d.versions[0].date, "10:00"), updated_at: at(d.versions.at(-1).date, "18:00") })
    .select("id")
    .single();
  if (error) throw error;
  let activeVersionId = null;
  for (const [i, v] of d.versions.entries()) {
    const { data: version, error: ve } = await supabase
      .from("draft_versions")
      .insert({ draft_id: draft.id, number: i + 1, label: `v${i + 1}`, content_json: v.doc, content_text: docText(v.doc), action: v.action, status: "Active", created_by_name: v.by, created_at: at(v.date, "18:00") })
      .select("id")
      .single();
    if (ve) throw ve;
    activeVersionId = version.id;
  }
  await supabase.from("drafts").update({ active_version_id: activeVersionId }).eq("id", draft.id);

  if (d.commentId) {
    const { error: ce } = await supabase.from("draft_comments").insert({ id: d.commentId, draft_id: draft.id, quoted_text: "The suit is barred by limitation", status: "Open", author_name: "John Anderson", created_at: at(day(-1), "11:00") });
    if (ce) throw ce;
    await supabase.from("draft_comment_replies").insert([
      { thread_id: d.commentId, author_name: "John Anderson", body: "Cite the date of the cause of action here.", created_at: at(day(-1), "11:00") },
      { thread_id: d.commentId, author_name: ME, body: "Added in para 1 — please re-check.", created_at: at(day(0), "09:00") },
    ]);
  }
  if (d.type === "Legal Notice") {
    const { error: re } = await supabase.from("draft_review_requests").insert({
      draft_id: draft.id, version_id: activeVersionId, matter_id: matterIdByNo.get(d.caseNo), sender_id: me.id, sender_name: ME,
      recipients: [{ type: "client", name: "ABC Corp.", email: "legal@abccorp.example" }], subject: `Review Request: ${d.title}`,
      message: "Please review the notice before we dispatch it.", format: "PDF", deadline: day(3), instructions: "Confirm the outstanding amount.",
      allow_comments: true, require_approval: true, status: "Under Review", sent_at: at(day(-2), "18:30"),
    });
    if (re) throw re;
  }
}
console.log(`Drafts: ${DRAFTS.length} (with versions, a comment thread and a review request)`);

// ---------------------------------------------------------------- clause bank extras
const { data: clauses } = await supabase.from("clauses").select("id").limit(8);
if (clauses?.length) {
  const ids = clauses.map((c) => c.id);
  await supabase.from("clause_collections").insert([
    { name: "Commercial supply essentials", description: "Go-to clauses for supply agreements.", created_by: me.id, created_by_name: ME, clause_ids: ids.slice(0, 4) },
    { name: "Bluewave counter-claim", description: "Clauses referenced in the counter-claim.", linked_matter_id: matterIdByNo.get("12"), created_by: me.id, created_by_name: ME, clause_ids: ids.slice(4, 8) },
  ]);
  await supabase.from("clause_saved").insert(ids.slice(0, 3).map((clause_id) => ({ user_id: me.id, clause_id })));
  await supabase.from("clause_recent_use").insert(ids.slice(0, 5).map((clause_id, i) => ({ user_id: me.id, clause_id, action: i % 2 ? "Copied" : "Viewed", created_at: at(day(-i), "15:00") })));
  console.log("Clause Bank: 2 collections, saved and recently used clauses");
} else {
  console.log("Clause Bank: no clauses yet — run `npm run drafting-library:seed` first, then re-run only this section if you want collections.");
}

console.log("Done.");
