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

module.exports = {
  searchParamsSchema,
  paginationOnlySchema,
  idParamSchema,
  nameParamSchema,
  yearParamSchema,
  emailSchema,
  verifyOtpSchema,
  draftReviewSendSchema,
};
