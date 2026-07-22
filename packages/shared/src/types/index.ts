export type PersonalInfo = {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  summary?: string;
};

export type ExperienceItem = {
  company: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
};

export type EducationItem = {
  institution: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  details?: string[];
};

export type ProjectItem = {
  name: string;
  description?: string;
  bullets: string[];
  technologies?: string[];
  url?: string;
};

export type CertificationItem = {
  name: string;
  issuer?: string;
  date?: string;
};

export type ResumeJson = {
  personalInfo: PersonalInfo;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
};

export type ResumeModification = {
  type: "added" | "removed" | "modified";
  section: string;
  before?: string;
  after?: string;
  reason?: string;
};

export type ResumeOptimizationResult = {
  optimizedResume: ResumeJson;
  modifications: ResumeModification[];
  atsImprovementScore: number;
  beforeAtsScore: number;
  afterAtsScore: number;
};

export type JobDescriptionAnalysis = {
  requiredSkills: string[];
  preferredSkills: string[];
  tools: string[];
  responsibilities: string[];
  keywords: string[];
  seniority: string;
  experience: string;
};

export type AtsScoreBreakdown = {
  keywordMatching: number;
  skillMatching: number;
  experienceRelevance: number;
  resumeFormatting: number;
  projectRelevance: number;
};

export type AtsScoreResult = {
  atsScore: number;
  missingKeywords: string[];
  suggestions: string[];
  strengths: string[];
  weakSections: string[];
  insights: string[];
  breakdown: AtsScoreBreakdown;
};

export type AnalysisScores = {
  atsScore: number;
  keywordMatchPercent: number;
  formattingScore: number;
  matchedKeywords: string[];
  missingSkills: string[];
  missingResponsibilities: string[];
  summary?: string;
};

export type ResumeChange = ResumeModification;

export type KeywordSet = {
  skills: string[];
  responsibilities: string[];
  tools: string[];
  softSkills: string[];
};

export type ExportFormat = "pdf" | "docx";
