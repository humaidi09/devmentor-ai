import type { Preferences } from "./preferences";
import type { NextStep } from "./types";
export interface Profile {
  id: string;
  display_name: string | null;
  preferred_language: string;
  campus_id: string | null;
  timezone: string;
  onboarding_completed: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}
export interface Consent {
  id: string;
  consent_type: string;
  granted: boolean;
  created_at: string;
}
export interface Plan {
  id: string;
  title: string;
  status: string;
  related_resource_id: string | null;
}
export interface AccountData {
  profile: Profile;
  preferences: Preferences;
  savedIds: string[];
  plans: Plan[];
  steps: (NextStep & { planId: string; position: number })[];
  reminders: string[];
  consents: Consent[];
  roles: { campus_id: string; role: string }[];
  developerDone: Record<string, boolean>;
  cpStatus: Record<string, string>;
  cpHandle: string;
  cpConnected: boolean;
  learningProgress: {
    kind: "visual" | "project";
    topic_key: string;
    status: string;
    position: number;
    updated_at: string;
  }[];
}
