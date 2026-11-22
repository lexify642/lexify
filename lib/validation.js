// Shared zod schemas for the Cases REST API — every route validates its
// input through one of these before touching Prisma, so malformed input is
// rejected with a 400 instead of reaching the database layer.
const { z } = require("zod");

const searchParamsSchema = z.object({
  q: z.string().trim().max(200).optional(),
  court: z.string().trim().max(200).optional(),
  judge: z.string().trim().max(200).optional(),
  year: z.coerce.number().int().min(1000).max(2100).optional(),
  act: z.string().trim().max(200).optional(),
  section: z.string().trim().max(100).optional(),
  citation: z.string().trim().max(200).optional(),
  sort: z.enum(["relevance", "latest"]).optional(),
  page: z.coerce.number().int().min(1).max(1_000_000).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const paginationOnlySchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const idParamSchema = z.string().trim().min(1).max(64);
const nameParamSchema = z.string().trim().min(1).max(200);
const yearParamSchema = z.coerce.number().int().min(1000).max(2100);

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
});
const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

const draftReviewSendSchema = z.object({
  to: z.array(z.string().trim().toLowerCase().email()).min(1).max(20),
  cc: z.array(z.string().trim().toLowerCase().email()).max(20).optional(),
  bcc: z.array(z.string().trim().toLowerCase().email()).max(20).optional(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().max(4000).optional(),
  instructions: z.string().trim().max(2000).optional(),
  format: z.enum(["editable", "pdf", "both"]),
  draftTitle: z.string().trim().min(1).max(200),
  senderName: z.string().trim().max(200).optional(),
  deadline: z.string().trim().max(60).optional(),
  pdfBase64: z.string().max(15_000_000).optional(),
  wordHtml: z.string().max(5_000_000).optional(),
});

const matterNoteSchema = z.object({
  id: z.string().max(64).optional(),
  text: z.string().trim().min(1).max(4000),
  isReminder: z.boolean().optional().default(false),
  dueDate: z.string().max(20).nullable().optional(),
  completed: z.boolean().optional().default(false),
});

const matterPreviousDateSchema = z.object({
  id: z.string().max(64).optional(),
  date: z.string().max(20).optional(),
  court: z.string().max(300).optional(),
  stage: z.string().max(200).optional(),
  purpose: z.string().max(1000).optional(),
  outcome: z.string().max(4000).optional(),
  advocate: z.string().max(200).optional(),
  fullNotes: z.string().max(8000).optional(),
});

const matterClientSchema = z
  .object({
    name: z.string().trim().min(1).max(300),
    phone: z.string().max(100).optional(),
    address: z.string().max(1000).optional(),
  })
  .nullable();

const matterSyncSchema = z.object({
  number: z.string().max(200).optional(),
  court: z.string().max(300).optional(),
  city: z.string().max(200).optional(),
  room: z.string().max(200).optional(),
  judge: z.string().max(200).optional(),
  parties: z.string().trim().min(1).max(500),
  date: z.string().max(20).nullable().optional(),
  time: z.string().max(50).optional(),
  stage: z.string().max(200).optional(),
  tone: z.string().max(50).optional(),
  activity: z.string().max(500).optional(),
  registered: z.string().max(200).optional(),
  filing: z.string().max(500).optional(),
  caseDetails: z.record(z.string(), z.any()).optional().default({}),
  docs: z.array(z.string().max(300)).optional().default([]),
  client: matterClientSchema.optional(),
  notes: z.array(matterNoteSchema).optional().default([]),
  previousDates: z.array(matterPreviousDateSchema).optional().default([]),
});

const matterCreateSchema = matterSyncSchema.extend({
  no: z.string().trim().max(20).optional(),
});

const taskCreateSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().max(4000).optional().default(""),
  caseNo: z.string().max(20).nullable().optional(),
  clientName: z.string().max(300).optional().default(""),
  assignedByName: z.string().max(200).nullable().optional(),
  assignedByRole: z.string().max(100).nullable().optional(),
  assignedToName: z.string().max(200).nullable().optional(),
  assignedToRole: z.string().max(100).nullable().optional(),
  priority: z.string().max(50).optional().default("Medium"),
  dueDate: z.string().max(20).optional(),
  dueTime: z.string().max(50).optional().default(""),
  reminder: z.string().max(50).optional().default("None"),
  customReminderMinutes: z.number().int().positive().nullable().optional(),
  notes: z.string().max(4000).optional().default(""),
  attachments: z.array(z.object({ id: z.string().max(64).optional(), name: z.string().max(300) })).optional().default([]),
});

const taskUpdateSchema = taskCreateSchema.partial().extend({ title: z.string().trim().min(1).max(300).optional() });

const taskStatusSchema = z.object({
  status: z.enum(["Pending", "In Progress", "Waiting for Review", "Completed", "Cancelled"]),
  note: z.string().max(2000).optional().default(""),
});

const taskCommentSchema = z.object({
  text: z.string().trim().min(1).max(4000),
});

const taskAttachmentSchema = z.object({
  name: z.string().trim().min(1).max(300),
});

const appointmentSchema = z.object({
  title: z.string().trim().min(1).max(300),
  eventType: z.string().max(100).optional(),
  date: z.string().max(20).optional(),
  time: z.string().max(50).optional(),
  location: z.string().max(300).optional().default(""),
  caseNo: z.string().max(20).nullable().optional(),
  clientName: z.string().max(300).nullable().optional(),
  notes: z.string().max(4000).optional().default(""),
  assignedToName: z.string().max(200).nullable().optional(),
  assignedToRole: z.string().max(100).nullable().optional(),
  reminder: z.string().max(50).optional().default("None"),
  customReminderMinutes: z.number().int().positive().nullable().optional(),
  status: z.string().max(50).optional().default("Scheduled"),
  priority: z.string().max(50).optional().default("Medium"),
});

const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(200),
  memberNames: z.array(z.string().trim().min(1).max(200)).min(1).max(100),
});

const startDirectSchema = z.object({
  id: z.string().trim().min(1).max(300),
  memberNames: z.array(z.string().trim().min(1).max(200)).length(2),
});

const sendMessageSchema = z.object({
  conversationId: z.string().trim().min(1).max(300),
  text: z.string().max(8000).optional().default(""),
  attachmentIds: z.array(z.string().uuid()).optional().default([]),
  replyToId: z.string().uuid().nullable().optional(),
  forwardedFromId: z.string().uuid().nullable().optional(),
  mentions: z.array(z.string().max(200)).optional().default([]),
});

const updateMessageSchema = z.object({
  text: z.string().max(8000).optional(),
  edited: z.boolean().optional(),
  deleted: z.boolean().optional(),
  pinnedBy: z.array(z.string().max(200)).optional(),
  starredBy: z.array(z.string().max(200)).optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
});

const markReadSchema = z.object({
  conversationId: z.string().trim().min(1).max(300),
});

const reassignClientChatSchema = z.object({
  clientName: z.string().trim().min(1).max(300),
  assignedToName: z.string().trim().min(1).max(200),
  assignedToRole: z.string().trim().min(1).max(100),
});

const attachmentMetaSchema = z.object({
  sourceConversationId: z.string().max(300).nullable().optional(),
  sourceMessageId: z.string().uuid().nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().max(100)).optional(),
  linkedCaseNo: z.string().max(20).nullable().optional(),
  linkedClientName: z.string().max(300).nullable().optional(),
  linkedTaskId: z.string().uuid().nullable().optional(),
  linkedAppointmentId: z.string().uuid().nullable().optional(),
  linkedDraftSlug: z.string().max(200).nullable().optional(),
});

const attachmentUpdateSchema = attachmentMetaSchema.partial();

const translationEntrySchema = z.object({
  name: z.string().trim().min(1).max(300),
  description: z.string().max(2000).optional(),
});

const legalDraftCategorySchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only.")
    .min(1)
    .max(150),
  practiceArea: z.string().trim().max(200).optional(),
  languages: z.array(z.enum(["english", "hindi", "marathi", "gujarati"])).min(1),
  filePath: z.string().max(500).nullable().optional(),
  translations: z.record(z.string(), translationEntrySchema),
  searchPlaceholder: z.record(z.string(), z.string().max(300)).optional(),
  sortOrder: z.number().int().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

const legalDraftCategoryUpdateSchema = legalDraftCategorySchema.partial();

const legalDraftSubtypeSchema = z.object({
  subtypeKey: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only.")
    .min(1)
    .max(150),
  translations: z.record(z.string(), z.object({ name: z.string().trim().min(1).max(300) })),
  filePath: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

const legalDraftSubtypeUpdateSchema = legalDraftSubtypeSchema.partial();

const clauseSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]+$/, "Letters, numbers and hyphens only.")
    .min(1)
    .max(64),
  category: z.string().trim().max(200).optional(),
  type: z.string().trim().max(300).optional(),
  name: z.string().max(300).nullable().optional(),
  position: z.string().max(500).optional(),
  domain: z.string().max(200).nullable().optional(),
  text: z.string().max(20000).optional(),
  version: z.string().max(100).optional(),
  risk: z.enum(["N/A", "LOW", "MEDIUM", "HIGH"]).optional(),
  favorability: z.string().max(200).optional(),
  negotiation: z.string().max(2000).optional(),
  frequency: z.string().max(200).optional(),
  caseLaw: z.string().max(300).nullable().optional(),
  status: z.enum(["APPROVED", "DRAFT", "PENDING", "DEPRECATED", "REJECTED"]).optional(),
  isPublished: z.boolean().optional(),
});

const clauseUpdateSchema = clauseSchema.partial().extend({ id: z.string().optional() });

const draftCreateSchema = z.object({
  id: z.string().uuid().optional(),
  versionId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(300),
  type: z.string().max(100).optional(),
  caseNo: z.string().max(20).nullable().optional(),
  clientName: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  contentJson: z.any().optional(),
});

const draftMetaUpdateSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  type: z.string().max(100).nullable().optional(),
  caseNo: z.string().max(20).nullable().optional(),
  clientName: z.string().max(300).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  headerHtml: z.string().max(20000).nullable().optional(),
  footerHtml: z.string().max(20000).nullable().optional(),
  layout: z.record(z.string(), z.any()).optional(),
  design: z.record(z.string(), z.any()).optional(),
  activeVersionId: z.string().uuid().nullable().optional(),
});

const draftVersionCreateSchema = z.object({
  id: z.string().uuid().optional(),
  contentJson: z.any(),
  action: z.string().max(200).optional(),
  label: z.string().max(100).optional(),
});

const draftVersionRestoreSchema = z.object({
  id: z.string().uuid().optional(),
});

const draftCommentCreateSchema = z.object({
  id: z.string().uuid(),
  quotedText: z.string().max(4000).optional(),
  body: z.string().trim().min(1).max(4000),
});

const draftCommentReplySchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

const draftCommentStatusSchema = z.object({
  status: z.enum(["Open", "Resolved"]),
});

const reviewRequestSchema = draftReviewSendSchema.extend({
  draftId: z.string().uuid().optional(),
  versionId: z.string().uuid().optional(),
  caseNo: z.string().max(20).nullable().optional(),
  // Optional: Mail Merge (MailMergeDialog.jsx) sends personalized copies to
  // many people via this same endpoint without creating a formal "review
  // request" record for each one — only present when the caller actually
  // wants a draft_review_requests row created (see the route).
  recipients: z
    .array(z.object({ type: z.string().max(50), name: z.string().max(300), email: z.string().email() }))
    .min(1)
    .optional(),
  allowComments: z.boolean().optional(),
  allowTrackChanges: z.boolean().optional(),
  allowEditing: z.boolean().optional(),
  requireApproval: z.boolean().optional(),
});

const reviewStatusUpdateSchema = z.object({
  status: z.enum(["Sent", "Opened", "Under Review", "Changes Requested", "Changes Received", "Approved", "Rejected", "Expired"]),
});

const clauseCollectionCreateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(300),
  description: z.string().max(2000).optional(),
  linkedCaseNo: z.string().max(20).nullable().optional(),
  clauseIds: z.array(z.string().max(64)).optional().default([]),
});

const clauseCollectionAddClausesSchema = z.object({
  clauseIds: z.array(z.string().max(64)).min(1),
});

const clauseIdSchema = z.object({
  clauseId: z.string().max(64),
});

const clauseRecentUseSchema = z.object({
  clauseId: z.string().max(64),
  action: z.string().max(100).optional(),
});

const deedClauseOptionSchema = z.object({
  id: z.string().trim().min(1).max(64).optional(),
  number: z.number().int().optional(),
  jumpLabel: z.string().max(200).optional(),
  title: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  heading: z.string().max(300).optional(),
  options: z.array(z.object({ id: z.string().max(100), label: z.string().max(300) })).optional(),
  extraField: z.object({ name: z.string().max(100), label: z.string().max(300), default: z.string().max(300).optional() }).nullable().optional(),
  textTemplate: z.string().max(4000).optional(),
  playbook: z.object({ impact: z.string().max(2000).optional(), guidance: z.string().max(2000).optional() }).nullable().optional(),
});

const deedPresetSchema = z.object({
  pathId: z.string().trim().min(1).max(64).optional(),
  posture: z.string().max(300).optional(),
  interestPath: z.string().max(300).optional(),
  votingLock: z.string().max(300).optional(),
  friction: z.string().max(300).optional(),
  guidelines: z.string().max(2000).optional(),
  selections: z.record(z.string(), z.string()).optional(),
  sortOrder: z.number().int().optional(),
});

const deedSettingsSchema = z.object({
  defaultSelections: z.record(z.string(), z.string()).optional(),
  defaultExtraValues: z.record(z.string(), z.string()).optional(),
  recitalsHtml: z.string().max(10000).optional(),
  closingHtml: z.string().max(10000).optional(),
});

const inviteUserSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  fullName: z.string().trim().min(1).max(200),
  role: z.enum(["admin", "senior_advocate", "junior_advocate", "clerk", "staff"]),
});

const updateUserSchema = z.object({
  role: z.enum(["admin", "senior_advocate", "junior_advocate", "clerk", "staff"]).optional(),
  isActive: z.boolean().optional(),
  fullName: z.string().trim().min(1).max(200).optional(),
});

module.exports = {
  searchParamsSchema,
  paginationOnlySchema,
  idParamSchema,
  nameParamSchema,
  yearParamSchema,
  emailSchema,
  verifyOtpSchema,
  draftReviewSendSchema,
  matterSyncSchema,
  matterCreateSchema,
  inviteUserSchema,
  updateUserSchema,
  taskCreateSchema,
  taskUpdateSchema,
  taskStatusSchema,
  taskCommentSchema,
  taskAttachmentSchema,
  appointmentSchema,
  createGroupSchema,
  startDirectSchema,
  sendMessageSchema,
  updateMessageSchema,
  markReadSchema,
  reassignClientChatSchema,
  attachmentMetaSchema,
  attachmentUpdateSchema,
  legalDraftCategorySchema,
  legalDraftCategoryUpdateSchema,
  legalDraftSubtypeSchema,
  legalDraftSubtypeUpdateSchema,
  clauseSchema,
  clauseUpdateSchema,
  draftCreateSchema,
  draftMetaUpdateSchema,
  draftVersionCreateSchema,
  draftVersionRestoreSchema,
  draftCommentCreateSchema,
  draftCommentReplySchema,
  draftCommentStatusSchema,
  reviewRequestSchema,
  reviewStatusUpdateSchema,
  clauseCollectionCreateSchema,
  clauseCollectionAddClausesSchema,
  clauseIdSchema,
  clauseRecentUseSchema,
  deedClauseOptionSchema,
  deedPresetSchema,
  deedSettingsSchema,
};
