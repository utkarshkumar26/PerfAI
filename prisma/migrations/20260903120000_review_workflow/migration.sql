-- AlterTable
ALTER TABLE "Review"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ADD COLUMN "comments" JSONB,
  ADD COLUMN "annualPerformance" TEXT,
  ADD COLUMN "overallPerformanceFeedback" TEXT,
  ADD COLUMN "finalAppraisal" TEXT,
  ADD COLUMN "incrementEligibility" TEXT,
  ADD COLUMN "performanceEligibility" TEXT;

-- CreateIndex
CREATE INDEX "Review_status_createdAt_idx" ON "Review"("status", "createdAt");
