// Shared types mirroring the FastAPI schemas.

export interface Page<T> {
  items: T[];
  limit: number;
  offset: number;
  count: number;
}

export interface Profile {
  id: string;
  display_name: string | null;
  preferred_language: "en" | "bn" | "bilingual";
  timezone: string;
  current_level: "beginner" | "intermediate" | "advanced";
  weekly_study_goal_minutes: number;
  available_schedule: Record<string, { start: string; end: string }[]>;
  interests: string[];
  goals: string[];
  codeforces_handle: string | null;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  onboarding_completed: boolean;
}

export type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "skipped"
  | "rescheduled";

export interface Task {
  id: string;
  course_id: string | null;
  deadline_id: string | null;
  title: string;
  description: string | null;
  task_type: "study" | "cp" | "revision" | "quiz" | "project" | "focus" | "rest";
  topic: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  priority: number;
  status: TaskStatus;
  completion_note: string | null;
  skip_reason: string | null;
  metadata: Record<string, unknown>;
}

export interface Course {
  id: string;
  title: string;
  code: string | null;
  difficulty: "easy" | "medium" | "hard" | null;
  color: string | null;
  active: boolean;
}

export interface Deadline {
  id: string;
  course_id: string | null;
  title: string;
  type: "exam" | "assignment" | "quiz" | "project" | "interview";
  due_at: string;
  priority: number;
  notes: string | null;
  status: string;
}

export interface Snippet {
  id: string;
  owner_id: string | null;
  visibility: "public" | "private";
  title: string;
  description: string | null;
  language: string;
  category: string;
  code: string;
  notes: string | null;
  tags: string[];
  usage_count: number;
  is_owner: boolean;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  channel: string;
  status: string;
  read_at: string | null;
  created_at: string | null;
}

export interface CPRecommendation {
  id: string;
  session: "morning" | "evening" | "contest_upsolve";
  problem_name: string | null;
  problem_rating: number | null;
  tags: string[];
  problem_url: string | null;
  status: "suggested" | "started" | "attempted" | "solved" | "skipped";
  source_reason: string | null;
}

export interface DashboardData {
  today: string;
  timezone: string | null;
  tasks: Task[];
  task_summary: {
    planned: number;
    completed: number;
    skipped: number;
    completion_rate: number;
  };
  upcoming_deadlines: Deadline[];
  study_minutes_today: number;
  study_minutes_week: number;
  weekly_goal_minutes: number;
  cp_progress: { planned: number; completed: number };
  streak_days: number;
  weak_areas: string[];
  recommended_snippet: Snippet | null;
}
