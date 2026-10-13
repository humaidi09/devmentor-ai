export type VerificationState =
  | "verified"
  | "needs_review"
  | "unverified"
  | "expired"
  | "archived"
  | "draft";

export interface ResourceSource {
  label: string;
  url: string;
}

export interface SupportResource {
  id: string;
  campusId: string;
  category: string;
  name: string;
  description: string;
  eligibility: string;
  cost: string | null;
  location: string;
  officialContact: string | null;
  source: ResourceSource;
  verification: VerificationState;
  lastCheckedAt: string | null;
  nextReviewAt: string | null;
  timeSensitiveDate?: string | null;
  isDemo?: boolean;
}

export type StepStatus =
  | "not_started"
  | "in_progress"
  | "waiting"
  | "completed"
  | "not_relevant";

export type StepSource = "verified" | "ai_suggestion" | "manual";

export interface NextStep {
  id: string;
  title: string;
  detail?: string;
  status: StepStatus;
  source: StepSource;
  resourceId?: string;
}

export type ActionKind =
  | "save"
  | "checklist"
  | "human"
  | "continue"
  | "open_resource";

export interface SuggestedAction {
  label: string;
  kind: ActionKind;
  resourceId?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SupportResource[];
  uncertain?: boolean;
  suggestedActions?: SuggestedAction[];
  provider?: "mock" | "gemini";
  state?: "success" | "clarification" | "no_resource" | "error" | "offline";
  humanSupportAvailable?: boolean;
  modulePath?: string;
  draft?: { resourceId: string; title: string; steps: string[] };
}

export interface SupportCategory {
  id: string;
  label: string;
  labelBn: string;
}

export interface Campus {
  id: string;
  name: string;
  isDemo?: boolean;
}
