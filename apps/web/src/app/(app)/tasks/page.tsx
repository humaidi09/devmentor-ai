"use client";

import { CalendarRange, Plus, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { FocusTimer } from "@/components/focus-timer";
import { PageHeader } from "@/components/page-header";
import { TaskRow } from "@/components/tasks/task-row";
import { useToast } from "@/components/toast";
import { Spinner } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import type { Page, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "pending", "completed", "skipped"] as const;
type Filter = (typeof FILTERS)[number];

export default function TasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [showFocus, setShowFocus] = useState(false);

  const [form, setForm] = useState({
    title: "",
    task_type: "study",
    topic: "",
    estimated_minutes: 60,
    priority: 3,
    scheduled_start: "",
  });

  const load = useCallback(async () => {
    try {
      const data = await api.get<Page<Task>>("/api/tasks?limit=100");
      setTasks(data.items);
    } catch {
      toast("Could not load tasks.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function generate(kind: "daily" | "weekly-plan") {
    setBusy(true);
    try {
      await api.post(`/api/tasks/generate-${kind}`, { replace_existing: false });
      toast(`Generated ${kind === "daily" ? "today's" : "this week's"} plan.`, "success");
      await load();
    } catch {
      toast("Could not generate plan.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function createTask() {
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      await api.post("/api/tasks", {
        title: form.title,
        task_type: form.task_type,
        topic: form.topic || null,
        estimated_minutes: Number(form.estimated_minutes),
        priority: Number(form.priority),
        scheduled_start: form.scheduled_start
          ? new Date(form.scheduled_start).toISOString()
          : null,
      });
      toast("Task created.", "success");
      setModal(false);
      setForm({ ...form, title: "", topic: "" });
      await load();
    } catch {
      toast("Could not create task.", "error");
    } finally {
      setBusy(false);
    }
  }

  const filtered = tasks.filter((t) => filter === "all" || t.status === filter);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Tasks & plan" subtitle="Your schedule — fully editable.">
        <Button variant="outline" onClick={() => generate("daily")} disabled={busy}>
          <Sparkles className="h-4 w-4" /> Daily
        </Button>
        <Button variant="outline" onClick={() => generate("weekly-plan")} disabled={busy}>
          <CalendarRange className="h-4 w-4" /> Weekly
        </Button>
        <Button onClick={() => setModal(true)}>
          <Plus className="h-4 w-4" /> New task
        </Button>
      </PageHeader>

      <div className="mb-4 flex gap-1 rounded-md bg-muted p-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex-1 rounded px-3 py-1.5 text-sm font-medium capitalize",
              filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Spinner className="h-6 w-6" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No {filter !== "all" ? filter : ""} tasks yet. Generate a plan or add one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onChanged={load}
              manage
              onFocus={(task) => {
                setFocusTask(task);
                setShowFocus(true);
              }}
            />
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="New task">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Review graph traversal"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.task_type}
                onChange={(e) => setForm({ ...form, task_type: e.target.value })}
              >
                <option value="study">Study</option>
                <option value="cp">Codeforces</option>
                <option value="revision">Revision</option>
                <option value="quiz">Quiz</option>
                <option value="project">Project</option>
                <option value="rest">Rest</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Topic</Label>
              <Input
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="optional"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estimated minutes</Label>
              <Input
                type="number"
                value={form.estimated_minutes}
                onChange={(e) =>
                  setForm({ ...form, estimated_minutes: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priority (1–5)</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Start (optional)</Label>
            <Input
              type="datetime-local"
              value={form.scheduled_start}
              onChange={(e) => setForm({ ...form, scheduled_start: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button onClick={createTask} disabled={busy || !form.title.trim()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {showFocus && (
        <FocusTimer
          task={focusTask}
          onClose={() => setShowFocus(false)}
          onCompleted={load}
        />
      )}
    </div>
  );
}
