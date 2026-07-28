-- CreateEnum
CREATE TYPE "AiAnalysisStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'SKIPPED_NO_TEXT');

-- CreateEnum
CREATE TYPE "CaseCitationRelationType" AS ENUM ('CITES', 'CITED_BY', 'SIMILAR', 'RELATED');

-- CreateTable
CREATE TABLE "legal_cases" (
    "id" TEXT NOT NULL,
    "sourceId" INTEGER,
    "datasetSource" TEXT NOT NULL,
    "caseMetadataId" TEXT,
    "parserRecordId" TEXT NOT NULL,
    "ingestionSplit" TEXT,
    "caseTitle" TEXT NOT NULL,
    "partyPetitioner" TEXT,
    "partyRespondent" TEXT,
    "partyCaption" TEXT,
    "docketNumber" TEXT,
    "cnrNumber" TEXT,
    "neutralCitation" TEXT,
    "lawReportCitation" TEXT,
    "courtName" TEXT NOT NULL,
    "courtCode" TEXT,
    "benchName" TEXT,
    "presidingJudge" TEXT,
    "coramMembers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "coramMembersText" TEXT,
    "decisionDate" TIMESTAMP(3),
    "registrationDate" TIMESTAMP(3),
    "citationYear" INTEGER,
    "decisionYear" INTEGER,
    "dispositionText" TEXT,
    "sourceRelativePath" TEXT,
    "sourcePathYear" TEXT,
    "sourcePathCourtCode" TEXT,
    "sourcePathBench" TEXT,
    "sourceFilename" TEXT,
    "sourcePdfS3Url" TEXT,
    "sourceJsonS3Url" TEXT,
    "languageCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "indexableText" TEXT,
    "headnoteText" TEXT,
    "fullJudgmentText" TEXT,
    "referencedActs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "referencedSections" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "normalizedRecordJson" JSONB,
    "parserJson" JSONB,
    "qualityJson" JSONB,
    "sourceCreatedAt" TIMESTAMP(3),
    "sourceUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_case_ai_analysis" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "summary" TEXT,
    "facts" TEXT,
    "issues" TEXT,
    "argumentsPetitioner" TEXT,
    "argumentsRespondent" TEXT,
    "decision" TEXT,
    "ratioDecidendi" TEXT,
    "obiterDicta" TEXT,
    "keyTakeaways" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "importantParagraphs" JSONB,
    "aiKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "readingTimeMinutes" INTEGER,
    "status" "AiAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "modelProvider" TEXT,
    "modelName" TEXT,
    "promptVersion" INTEGER NOT NULL DEFAULT 1,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_case_ai_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_case_citations" (
    "id" TEXT NOT NULL,
    "fromCaseId" TEXT NOT NULL,
    "toCaseId" TEXT,
    "citationTextRaw" TEXT NOT NULL,
    "relationType" "CaseCitationRelationType" NOT NULL DEFAULT 'CITES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_case_citations_pkey" PRIMARY KEY ("id")
);

-- Full-text search: a tsvector column combining every field a user can search
-- (title/parties/judge/court/docket/CNR/citations/acts/sections/keywords/index
-- text), kept in sync automatically by a trigger on every insert/update.
-- (Postgres GENERATED ALWAYS AS ... STORED cannot be used here because
-- to_tsvector(regconfig, text) is STABLE, not IMMUTABLE — a trigger is the
-- standard, documented workaround.) This is the extension point for
-- semantic/vector search later.
ALTER TABLE "legal_cases" ADD COLUMN "searchVector" tsvector;

CREATE OR REPLACE FUNCTION legal_cases_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    to_tsvector('english',
      coalesce(NEW."caseTitle", '') || ' ' ||
      coalesce(NEW."partyPetitioner", '') || ' ' ||
      coalesce(NEW."partyRespondent", '') || ' ' ||
      coalesce(NEW."presidingJudge", '') || ' ' ||
      coalesce(NEW."courtName", '') || ' ' ||
      coalesce(NEW."docketNumber", '') || ' ' ||
      coalesce(NEW."cnrNumber", '') || ' ' ||
      coalesce(NEW."neutralCitation", '') || ' ' ||
      coalesce(NEW."lawReportCitation", '') || ' ' ||
      coalesce(array_to_string(NEW."referencedActs", ' '), '') || ' ' ||
      coalesce(array_to_string(NEW."referencedSections", ' '), '') || ' ' ||
      coalesce(array_to_string(NEW."keywords", ' '), '') || ' ' ||
      coalesce(NEW."indexableText", '') || ' ' ||
      coalesce(NEW."headnoteText", '')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER legal_cases_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "legal_cases"
  FOR EACH ROW EXECUTE FUNCTION legal_cases_search_vector_update();

CREATE INDEX "legal_cases_search_vector_idx" ON "legal_cases" USING GIN ("searchVector");

-- CreateIndex
CREATE INDEX "legal_cases_courtName_idx" ON "legal_cases"("courtName");

-- CreateIndex
CREATE INDEX "legal_cases_presidingJudge_idx" ON "legal_cases"("presidingJudge");

-- CreateIndex
CREATE INDEX "legal_cases_citationYear_idx" ON "legal_cases"("citationYear");

-- CreateIndex
CREATE INDEX "legal_cases_decisionYear_idx" ON "legal_cases"("decisionYear");

-- CreateIndex
CREATE INDEX "legal_cases_docketNumber_idx" ON "legal_cases"("docketNumber");

-- CreateIndex
CREATE INDEX "legal_cases_cnrNumber_idx" ON "legal_cases"("cnrNumber");

-- CreateIndex
CREATE INDEX "legal_cases_datasetSource_idx" ON "legal_cases"("datasetSource");

-- CreateIndex
CREATE INDEX "legal_cases_decisionDate_idx" ON "legal_cases"("decisionDate");

-- CreateIndex
CREATE UNIQUE INDEX "legal_cases_datasetSource_parserRecordId_key" ON "legal_cases"("datasetSource", "parserRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "legal_case_ai_analysis_caseId_key" ON "legal_case_ai_analysis"("caseId");

-- CreateIndex
CREATE INDEX "legal_case_ai_analysis_status_idx" ON "legal_case_ai_analysis"("status");

-- CreateIndex
CREATE INDEX "legal_case_citations_fromCaseId_idx" ON "legal_case_citations"("fromCaseId");

-- CreateIndex
CREATE INDEX "legal_case_citations_toCaseId_idx" ON "legal_case_citations"("toCaseId");

-- AddForeignKey
ALTER TABLE "legal_case_ai_analysis" ADD CONSTRAINT "legal_case_ai_analysis_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "legal_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_case_citations" ADD CONSTRAINT "legal_case_citations_fromCaseId_fkey" FOREIGN KEY ("fromCaseId") REFERENCES "legal_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_case_citations" ADD CONSTRAINT "legal_case_citations_toCaseId_fkey" FOREIGN KEY ("toCaseId") REFERENCES "legal_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
