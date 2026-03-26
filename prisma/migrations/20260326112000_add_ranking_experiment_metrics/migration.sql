-- CreateTable
CREATE TABLE "RankingExperimentMetric" (
    "id" TEXT NOT NULL,
    "experimentKey" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "query" TEXT,
    "categoryId" TEXT,
    "sortMode" TEXT,
    "resultCount" INTEGER,
    "productId" TEXT,
    "orderId" TEXT,
    "conversionValue" DECIMAL(12,2),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RankingExperimentMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RankingExperimentMetric_experimentKey_variant_createdAt_idx" ON "RankingExperimentMetric"("experimentKey", "variant", "createdAt");

-- CreateIndex
CREATE INDEX "RankingExperimentMetric_endpoint_createdAt_idx" ON "RankingExperimentMetric"("endpoint", "createdAt");

-- CreateIndex
CREATE INDEX "RankingExperimentMetric_eventType_createdAt_idx" ON "RankingExperimentMetric"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "RankingExperimentMetric_userId_createdAt_idx" ON "RankingExperimentMetric"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RankingExperimentMetric_sessionId_createdAt_idx" ON "RankingExperimentMetric"("sessionId", "createdAt");
