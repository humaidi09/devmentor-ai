"use client";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account";
import { useLanguage } from "@/lib/i18n";
import { Card } from "./ui/card";
import { Input, Select } from "./ui/input";
import { Button } from "./ui/button";
interface Study {
  courses: { id: string; title: string; code: string }[];
  deadlines: {
    id: string;
    title: string;
    due_at: string;
    status: string;
    course_id: string | null;
  }[];
  tasks: { id: string; title: string; completed: boolean }[];
}
export function AccountStudy() {
  const { request } = useAccount();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [data, setData] = useState<Study | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [course, setCourse] = useState("");
  const [code, setCode] = useState("");
  const [deadline, setDeadline] = useState("");
  const [courseId, setCourseId] = useState("");
  const [due, setDue] = useState("");
  const [task, setTask] = useState("");
  useEffect(() => {
    let active = true;
    void request<Study>("/api/data/study")
      .then((v) => {
        if (active) setData(v);
      })
      .catch(() => {
        if (active)
          setError(
            bn ? "তথ্য লোড করা যায়নি।" : "Study data could not be loaded.",
          );
      });
    return () => {
      active = false;
    };
  }, [request, bn]);
  async function write(kind: string, body: unknown, method = "POST") {
    setBusy(true);
    setError("");
    try {
      await request("/api/data/" + kind, body, method);
      setData(await request<Study>("/api/data/study"));
      return true;
    } catch {
      setError(bn ? "সংরক্ষণ করা যায়নি।" : "Unable to save study data.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">
        {bn ? "একাডেমিক স্টাডি" : "Academic Study"}
      </h1>
      <p className="text-sm">
        {bn
          ? "কোর্স ও ডেডলাইন আপনার অ্যাকাউন্টের ব্যক্তিগত তথ্য।"
          : "Courses and deadlines are private to your account."}
      </p>
      {!data && !error && (
        <p role="status">{bn ? "লোড হচ্ছে…" : "Loading study data…"}</p>
      )}
      {error && <p role="alert">{error}</p>}
      <Card className="space-y-3 p-4">
        <h2 className="font-bold">{bn ? "কোর্স" : "Courses"}</h2>
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await write("courses", { title: course, code })) {
              setCourse("");
              setCode("");
            }
          }}
        >
          <label htmlFor="course-name">
            {bn ? "কোর্সের নাম" : "Course name"}
          </label>
          <Input
            id="course-name"
            value={course}
            required
            maxLength={200}
            onChange={(e) => setCourse(e.target.value)}
          />
          <label htmlFor="course-code">
            {bn ? "কোড (ঐচ্ছিক)" : "Code (optional)"}
          </label>
          <Input
            id="course-code"
            value={code}
            maxLength={20}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button type="submit" disabled={busy}>
            {bn ? "কোর্স যোগ" : "Add course"}
          </Button>
        </form>
        {data?.courses.length === 0 && (
          <p>{bn ? "কোর্স নেই।" : "No courses yet."}</p>
        )}
        <ul className="space-y-2">
          {data?.courses.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3">
              <span>
                {c.code} {c.title}
              </span>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => void write("courses", { id: c.id }, "DELETE")}
              >
                {bn ? "মুছুন" : "Delete course"}
              </Button>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="space-y-3 p-4">
        <h2 className="font-bold">{bn ? "ডেডলাইন" : "Deadlines"}</h2>
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await write("deadlines", {
                title: deadline,
                courseId: courseId || null,
                dueAt: new Date(due).toISOString(),
              })
            )
              setDeadline("");
          }}
        >
          <label htmlFor="deadline-title">
            {bn ? "ডেডলাইনের নাম" : "Deadline title"}
          </label>
          <Input
            id="deadline-title"
            required
            maxLength={200}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <label htmlFor="deadline-course">
            {bn ? "কোর্স (ঐচ্ছিক)" : "Course (optional)"}
          </label>
          <Select
            id="deadline-course"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">{bn ? "কোর্স নেই" : "No course"}</option>
            {data?.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
          <label htmlFor="deadline-due">{bn ? "শেষ সময়" : "Due time"}</label>
          <Input
            id="deadline-due"
            type="datetime-local"
            required
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
          <Button type="submit" disabled={busy}>
            {bn ? "ডেডলাইন যোগ" : "Add deadline"}
          </Button>
        </form>
        {data?.deadlines.length === 0 && (
          <p>{bn ? "ডেডলাইন নেই।" : "No deadlines yet."}</p>
        )}
        <ul className="space-y-2">
          {data?.deadlines.map((d) => (
            <li key={d.id} className="space-y-1">
              <p>
                {d.title} —{" "}
                {new Date(d.due_at).toLocaleString(bn ? "bn-BD" : "en-GB")} —{" "}
                {d.status}
              </p>
              <Button
                disabled={busy}
                variant="secondary"
                onClick={() =>
                  void write(
                    "deadlines",
                    {
                      id: d.id,
                      status:
                        d.status === "completed" ? "pending" : "completed",
                    },
                    "PATCH",
                  )
                }
              >
                {bn ? "অবস্থা পরিবর্তন" : "Toggle completion"}
              </Button>
              <Button
                disabled={busy}
                variant="secondary"
                onClick={() => void write("deadlines", { id: d.id }, "DELETE")}
              >
                {bn ? "মুছুন" : "Delete deadline"}
              </Button>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="space-y-3 p-4">
        <h2 className="font-bold">{bn ? "পড়ার কাজ" : "Study tasks"}</h2>
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await write("study-tasks", { title: task })) setTask("");
          }}
        >
          <label htmlFor="study-task">{bn ? "নতুন কাজ" : "New task"}</label>
          <Input
            id="study-task"
            value={task}
            maxLength={200}
            required
            onChange={(e) => setTask(e.target.value)}
          />
          <Button disabled={busy}>{bn ? "কাজ যোগ" : "Add task"}</Button>
        </form>
        <ul className="space-y-2">
          {data?.tasks.map((t) => (
            <li key={t.id}>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={t.completed}
                  disabled={busy}
                  onChange={(e) =>
                    void write(
                      "study-tasks",
                      { id: t.id, completed: e.target.checked },
                      "PATCH",
                    )
                  }
                />
                {t.title}
              </label>
              <Button
                disabled={busy}
                variant="secondary"
                onClick={() =>
                  void write("study-tasks", { id: t.id }, "DELETE")
                }
              >
                {bn ? "মুছুন" : "Delete task"}
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
