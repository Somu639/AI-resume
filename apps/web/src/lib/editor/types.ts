export type ChangeStatus = "pending" | "accepted" | "rejected";

export type EditorChange = {
  id: string;
  section: string;
  type: "added" | "removed" | "modified";
  before?: string;
  after?: string;
  reason?: string;
  status: ChangeStatus;
};

export type EditorVersion = {
  id: string;
  label: string;
  html: string;
  createdAt: string;
  source: "original" | "ai" | "manual" | "restore";
};

export type AtsLiveResult = {
  atsScore: number;
  missingKeywords: string[];
  suggestions: string[];
  strengths: string[];
};
