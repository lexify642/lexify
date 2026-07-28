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

module.exports = { searchParamsSchema, paginationOnlySchema, idParamSchema, nameParamSchema, yearParamSchema };
