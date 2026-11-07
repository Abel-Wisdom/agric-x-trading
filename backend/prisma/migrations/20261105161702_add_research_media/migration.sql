-- CreateTable
CREATE TABLE "ResearchMedia" (
    "id" SERIAL NOT NULL,
    "researchReportId" INTEGER NOT NULL,
    "mediaAssetId" INTEGER NOT NULL,
    "mediaType" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResearchMedia_researchReportId_sortOrder_idx" ON "ResearchMedia"("researchReportId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchMedia_researchReportId_mediaAssetId_key" ON "ResearchMedia"("researchReportId", "mediaAssetId");

-- AddForeignKey
ALTER TABLE "ResearchMedia" ADD CONSTRAINT "ResearchMedia_researchReportId_fkey" FOREIGN KEY ("researchReportId") REFERENCES "ResearchReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchMedia" ADD CONSTRAINT "ResearchMedia_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
