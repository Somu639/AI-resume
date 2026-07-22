# ResumeAI Data Model

Prisma lives at `apps/api/prisma/schema.prisma`.

## Entity Relationship

```
User 1──* Resume
User 1──* JobDescription
User 1──* Analysis
User 1──* CoverLetter

Resume 1──* ResumeVersion
ResumeVersion *──1 ResumeVersion (parentVersion)   # lineage

JobDescription 1──* Analysis
Resume 1──* Analysis

Analysis 1──0..1 OptimizedResume
OptimizedResume *──1 ResumeVersion
OptimizedResume *──1 JobDescription

CoverLetter *──1 Resume
CoverLetter *──1 JobDescription
```

## Core Tables

### User
- id, email, passwordHash?, name, avatarUrl?
- googleId?, provider (`email` | `google`)
- createdAt, updatedAt

### Resume
- id, userId, title, originalFileName, mimeType
- s3Key, extractedText?, status (`processing` | `ready` | `failed`)
- createdAt, updatedAt, deletedAt?

### ResumeVersion
- id, resumeId, parentVersionId?, versionNumber
- label?, contentText, contentJson?
- s3KeyPdf?, s3KeyDocx?
- changesJson?   # array of { type, before, after, section }
- source (`upload` | `ai_optimize`)
- createdAt

### JobDescription
- id, userId, title, company?, rawText
- sourceFileName?, s3Key?
- keywordsJson?  # skills, responsibilities, tools, softSkills
- createdAt, updatedAt

### Analysis
- id, userId, resumeId, jobDescriptionId, resumeVersionId?
- atsScore, keywordMatchPercent, formattingScore
- matchedKeywordsJson, missingSkillsJson, missingResponsibilitiesJson
- detailsJson?, summary?
- createdAt

### OptimizedResume
- id, userId, analysisId, resumeId, jobDescriptionId, resumeVersionId
- status (`pending` | `completed` | `failed`)
- createdAt, updatedAt

### CoverLetter
- id, userId, resumeId, jobDescriptionId
- content, s3KeyPdf?, s3KeyDocx?
- createdAt, updatedAt

## Indexes (planned)

- `User.email` unique
- `User.googleId` unique (nullable)
- `Resume(userId, createdAt)`
- `ResumeVersion(resumeId, versionNumber)` unique
- `Analysis(userId, createdAt)`
- `JobDescription(userId, createdAt)`
