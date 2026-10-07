"use client";

import { useEffect, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { useToast } from "@/components/toast";
import { Spinner } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import type { Profile } from "@/lib/types";

interface Prefs {
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  daily_summary: boolean;
  weekly_summary: boolean;
  cp_reminders: boolean;
  max_per_day: number;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Profile>("/api/me"),
      api.get<Prefs>("/api/notifications/preferences"),
    ])
      .then(([p, pr]) => {
        setProfile(p);
        setPrefs(pr);
      })
      .catch(() => toast("Could not load settings.", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  async function saveProfile() {
    if (!profile) return;
    setBusy(true);
    try {
      await api.patch("/api/me", {
        display_name: profile.display_name,
        preferred_language: profile.preferred_language,
        timezone: profile.timezone,
        current_level: profile.current_level,
        weekly_study_goal_minutes: profile.weekly_study_goal_minutes,
        codeforces_handle: profile.codeforces_handle,
        quiet_hours_start: profile.quiet_hours_start || null,
        quiet_hours_end: profile.quiet_hours_end || null,
      });
      toast("Profile saved.", "success");
    } catch {
      toast("Could not save profile.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function savePrefs() {
    if (!prefs) return;
    setBusy(true);
    try {
      await api.patch("/api/notifications/preferences", prefs);
      toast("Notification preferences saved.", "success");
    } catch {
      toast("Could not save preferences.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteData() {
    setBusy(true);
    try {
      await api.del("/api/me?confirm=true");
      toast("All your data was deleted.", "success");
      setConfirmDelete(false);
    } catch {
      toast("Could not delete data.", "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !profile || !prefs) {
    return (
      <div className="grid place-items-center py-20 text-muted-foreground">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Settings" subtitle="Your profile, notifications, and data." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={profile.display_name ?? ""}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Language</Label>
            <Select
              value={profile.preferred_language}
              onChange={(e) =>
                setProfile({ ...profile, preferred_language: e.target.value as Profile["preferred_language"] })
              }
            >
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
              <option value="bilingual">Bilingual</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Input
              value={profile.timezone}
              onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Level</Label>
            <Select
              value={profile.current_level}
              onChange={(e) =>
                setProfile({ ...profile, current_level: e.target.value as Profile["current_level"] })
              }
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Weekly goal (minutes)</Label>
            <Input
              type="number"
              value={profile.weekly_study_goal_minutes}
              onChange={(e) =>
                setProfile({ ...profile, weekly_study_goal_minutes: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Codeforces handle</Label>
            <Input
              value={profile.codeforces_handle ?? ""}
              onChange={(e) => setProfile({ ...profile, codeforces_handle: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Quiet hours start</Label>
            <Input
              type="time"
              value={profile.quiet_hours_start ?? ""}
              onChange={(e) => setProfile({ ...profile, quiet_hours_start: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Quiet hours end</Label>
            <Input
              type="time"
              value={profile.quiet_hours_end ?? ""}
              onChange={(e) => setProfile({ ...profile, quiet_hours_end: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={saveProfile} disabled={busy}>Save profile</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {([
            ["in_app_enabled", "In-app notifications"],
            ["email_enabled", "Email (requires Resend setup)"],
            ["push_enabled", "Web push (requires Firebase setup)"],
            ["daily_summary", "Daily summary"],
            ["weekly_summary", "Weekly summary"],
            ["cp_reminders", "Codeforces session reminders"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={prefs[key] as boolean}
                onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
          <div className="max-w-[200px] space-y-1.5">
            <Label>Max notifications/day</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={prefs.max_per_day}
              onChange={(e) => setPrefs({ ...prefs, max_per_day: Number(e.target.value) })}
            />
          </div>
          <Button onClick={savePrefs} disabled={busy}>Save notifications</Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Permanently delete all your tasks, courses, snippets, and preferences.
          </p>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            Delete my data
          </Button>
        </CardContent>
      </Card>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Are you sure?">
        <p className="text-sm text-muted-foreground">
          This cannot be undone. All your personal data will be erased.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button variant="destructive" onClick={deleteData} disabled={busy}>
            Yes, delete everything
          </Button>
        </div>
      </Modal>
    </div>
  );
}
