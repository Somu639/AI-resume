-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('email', 'google');

-- CreateEnum
CREATE TYPE "ResumeStatus" AS ENUM ('processing', 'ready', 'failed');

-- CreateEnum
CREATE TYPE "VersionSource" AS ENUM ('upload', 'ai_optimize', 'manual');

-- CreateEnum
CREATE TYPE "OptimizeStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('free', 'pro', 'business');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('inactive', 'trialing', 'active', 'past_due', 'canceled');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "avatarUrl" TEXT,
    "googleId" TEXT,
    "provider" "AuthProvider" NOT NULL DEFAULT 'email',
    "stripeCustomerId" TEXT,
    "plan" "PlanTier" NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'inactive',
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "extractedText" TEXT,
    "parsedJson" JSONB,
    "status" "ResumeStatus" NOT NULL DEFAULT 'processing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeVersion" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "parentVersionId" TEXT,
    "versionNumber" INTEGER NOT NULL,
    "label" TEXT,
    "contentText" TEXT NOT NULL,
    "contentJson" JSONB,
    "s3KeyPdf" TEXT,
    "s3KeyDocx" TEXT,
    "changesJson" JSONB,
    "source" "VersionSource" NOT NULL DEFAULT 'upload',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobDescription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "rawText" TEXT NOT NULL,
    "sourceFileName" TEXT,
    "s3Key" TEXT,
    "keywordsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobDescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "jobDescriptionId" TEXT NOT NULL,
    "resumeVersionId" TEXT,
    "atsScore" INTEGER NOT NULL,
    "keywordMatchPercent" INTEGER NOT NULL,
    "formattingScore" INTEGER NOT NULL,
    "matchedKeywordsJson" JSONB NOT NULL,
    "missingSkillsJson" JSONB NOT NULL,
    "missingResponsibilitiesJson" JSONB NOT NULL,
    "detailsJson" JSONB,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizedResume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "jobDescriptionId" TEXT NOT NULL,
    "resumeVersionId" TEXT NOT NULL,
    "status" "OptimizeStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptimizedResume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverLetter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "jobDescriptionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "greeting" TEXT,
    "closing" TEXT,
    "s3KeyPdf" TEXT,
    "s3KeyDocx" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoverLetter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "UsageEvent_userId_type_createdAt_idx" ON "UsageEvent"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Resume_userId_createdAt_idx" ON "Resume"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ResumeVersion_resumeId_idx" ON "ResumeVersion"("resumeId");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeVersion_resumeId_versionNumber_key" ON "ResumeVersion"("resumeId", "versionNumber");

-- CreateIndex
CREATE INDEX "JobDescription_userId_createdAt_idx" ON "JobDescription"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Analysis_userId_createdAt_idx" ON "Analysis"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OptimizedResume_analysisId_key" ON "OptimizedResume"("analysisId");

-- CreateIndex
CREATE INDEX "OptimizedResume_userId_createdAt_idx" ON "OptimizedResume"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CoverLetter_userId_createdAt_idx" ON "CoverLetter"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "ResumeVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDescription" ADD CONSTRAINT "JobDescription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_jobDescriptionId_fkey" FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "ResumeVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizedResume" ADD CONSTRAINT "OptimizedResume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizedResume" ADD CONSTRAINT "OptimizedResume_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizedResume" ADD CONSTRAINT "OptimizedResume_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizedResume" ADD CONSTRAINT "OptimizedResume_jobDescriptionId_fkey" FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizedResume" ADD CONSTRAINT "OptimizedResume_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "ResumeVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverLetter" ADD CONSTRAINT "CoverLetter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverLetter" ADD CONSTRAINT "CoverLetter_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverLetter" ADD CONSTRAINT "CoverLetter_jobDescriptionId_fkey" FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
