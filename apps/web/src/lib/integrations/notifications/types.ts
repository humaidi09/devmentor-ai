export interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  type: string;
  read_at: string | null;
  action_url: string | null;
  created_at: string;
}
export interface ReminderItem {
  id: string;
  title: string;
  module: string;
  recurrence: string;
  scheduled_for: string | null;
  timezone: string;
  enabled: boolean;
  action_step_id: string | null;
  deadline_id: string | null;
}
export interface NotificationData {
  notifications: NotificationItem[];
  reminders: ReminderItem[];
  preferences: {
    in_app_enabled: boolean;
    preview_details: boolean;
    support_enabled: boolean;
    academic_enabled: boolean;
    cp_enabled: boolean;
    developer_enabled: boolean;
    quiet_hours_enabled: boolean;
  } | null;
}
export function quietHours(
  now: Date,
  zone: string,
  start: string,
  end: string,
  enabled: boolean,
) {
  if (!enabled) return false;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return (
    start === end ||
    (start < end
      ? parts >= start && parts < end
      : parts >= start || parts < end)
  );
}
