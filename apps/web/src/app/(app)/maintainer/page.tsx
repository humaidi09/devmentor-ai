"use client";
import { useState, useEffect } from "react";
import { useAccount } from "@/lib/account";
import { useResources } from "@/lib/resources";
import { useLanguage } from "@/lib/i18n";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VerificationBadge } from "@/components/verification-badge";
import type { VerificationState } from "@/lib/types";
interface Resource {
  id: string;
  campus_id: string;
  category_id: string;
  name: string;
  description: string;
  eligibility_summary: string;
  cost_summary: string | null;
  location_summary: string;
  contact_summary: string | null;
  official_url: string | null;
  is_demo: boolean;
  next_review_at: string | null;
  verification_state: VerificationState;
  resource_sources: {
    id: string;
    source_title: string;
    source_url: string;
    checked_at: string | null;
  }[];
}
interface Workspace {
  roles: { campus_id: string; role: string }[];
  resources: Resource[];
  events: {
    id: string;
    resource_id: string;
    previous_state: string;
    new_state: string;
    note: string;
    created_at: string;
  }[];
}
const empty = {
  campus_id: "",
  category_id: "financial",
  name: "",
  description: "",
  eligibility_summary: "",
  cost_summary: "",
  location_summary: "",
  contact_summary: "",
  official_url: "",
  is_demo: false,
  next_review_at: "",
};
export default function MaintainerPage() {
  const { demo, request } = useAccount();
  const { campuses, categories } = useResources();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState("");
  const [form, setForm] = useState(empty);
  const [source, setSource] = useState({ url: "", title: "", checkedAt: "" });
  const [state, setState] = useState("needs_review");
  const [note, setNote] = useState("");
  useEffect(() => {
    if (!demo)
      void request<Workspace>("/api/maintainer")
        .then(setWorkspace)
        .catch(() =>
          setError(
            bn
              ? "এই workspace-এ অনুমতি নেই বা সার্ভিস বন্ধ।"
              : "Workspace access denied or service unavailable.",
          ),
        );
  }, [demo, request, bn]);
  // request identity changes with provider updates; this workspace is bounded by server role checks and RLS.
  const current = workspace?.resources.find((r) => r.id === selected);
  const campus = current?.campus_id || form.campus_id;
  const editAllowed = workspace?.roles.some(
    (r) =>
      r.campus_id === campus &&
      ["resource_maintainer", "admin"].includes(r.role),
  );
  const reviewAllowed = workspace?.roles.some(
    (r) =>
      r.campus_id === campus && ["resource_reviewer", "admin"].includes(r.role),
  );
  async function write(body: unknown) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request("/api/maintainer", body);
      setWorkspace(await request<Workspace>("/api/maintainer"));
      window.dispatchEvent(new Event("close-ai-resources-updated"));
      setNotice(bn ? "রিসোর্স আপডেট হয়েছে।" : "Resource updated.");
    } catch {
      setError(
        bn
          ? "সংরক্ষণ করা যায়নি। তথ্য ও অনুমতি যাচাই করুন।"
          : "Unable to save. Check the inputs and your permissions.",
      );
    } finally {
      setBusy(false);
    }
  }
  function choose(value: string) {
    setSelected(value);
    const r = workspace?.resources.find((r) => r.id === value);
    setForm(
      r
        ? {
            campus_id: r.campus_id,
            category_id: r.category_id,
            name: r.name,
            description: r.description,
            eligibility_summary: r.eligibility_summary,
            cost_summary: r.cost_summary ?? "",
            location_summary: r.location_summary,
            contact_summary: r.contact_summary ?? "",
            official_url: r.official_url ?? "",
            is_demo: r.is_demo,
            next_review_at: r.next_review_at ?? "",
          }
        : empty,
    );
  }
  if (demo)
    return (
      <Card className="p-5">
        {bn
          ? "Resource workspace-এর জন্য অনুমোদিত অ্যাকাউন্ট দরকার।"
          : "Resource workspace requires an authorized account."}
      </Card>
    );
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">
        {bn ? "রিসোর্স workspace" : "Resource workspace"}
      </h1>
      <p className="text-sm">
        {bn
          ? "অনুমতি ক্যাম্পাসভিত্তিক। ব্যক্তিগত ছাত্র-ছাত্রী ডেটা এখানে নেই।"
          : "Campus-scoped permissions. No private student data is available here."}
      </p>
      {!workspace && !error && (
        <p role="status">{bn ? "লোড হচ্ছে…" : "Loading workspace…"}</p>
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {workspace && (
        <>
          <label htmlFor="resource-select">{bn ? "রিসোর্স" : "Resource"}</label>
          <Select
            id="resource-select"
            value={selected}
            onChange={(e) => choose(e.target.value)}
          >
            <option value="">{bn ? "নতুন খসড়া" : "New draft"}</option>
            {workspace.resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — {r.verification_state}
                {r.is_demo ? " — DEMO" : ""}
              </option>
            ))}
          </Select>
          {current && <VerificationBadge state={current.verification_state} />}
          <Card className="space-y-3 p-4">
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void write({
                  action: selected ? "edit" : "create",
                  id: selected || undefined,
                  ...form,
                  next_review_at: form.next_review_at || null,
                });
              }}
            >
              <label htmlFor="staff-campus">
                {bn ? "ক্যাম্পাস" : "Campus"}
              </label>
              <Select
                id="staff-campus"
                disabled={!!selected}
                value={form.campus_id}
                onChange={(e) =>
                  setForm({ ...form, campus_id: e.target.value })
                }
              >
                <option value="">{bn ? "বেছে নিন" : "Choose"}</option>
                {campuses
                  .filter((c) =>
                    workspace.roles.some((r) => r.campus_id === c.id),
                  )
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </Select>
              <label htmlFor="staff-category">
                {bn ? "বিভাগ" : "Category"}
              </label>
              <Select
                id="staff-category"
                value={form.category_id}
                onChange={(e) =>
                  setForm({ ...form, category_id: e.target.value })
                }
              >
                {categories.map((c) => (
                  <option value={c.id} key={c.id}>
                    {bn ? c.labelBn : c.label}
                  </option>
                ))}
              </Select>
              {(
                [
                  "name",
                  "description",
                  "eligibility_summary",
                  "cost_summary",
                  "location_summary",
                  "contact_summary",
                  "official_url",
                ] as const
              ).map((key) => (
                <div key={key}>
                  <label htmlFor={"staff-" + key}>
                    {
                      {
                        name: bn ? "নাম" : "Name",
                        description: bn ? "বিবরণ" : "Description",
                        eligibility_summary: bn ? "যোগ্যতা" : "Eligibility",
                        cost_summary: bn ? "খরচ" : "Cost",
                        location_summary: bn ? "অবস্থান" : "Location",
                        contact_summary: bn ? "যোগাযোগ" : "Contact",
                        official_url: bn
                          ? "অফিসিয়াল HTTPS URL"
                          : "Official HTTPS URL",
                      }[key]
                    }
                  </label>
                  <Input
                    id={"staff-" + key}
                    value={form[key]}
                    required={key === "name"}
                    maxLength={key === "description" ? 4000 : 2000}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                  />
                </div>
              ))}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  disabled={!!selected}
                  checked={form.is_demo}
                  onChange={(e) =>
                    setForm({ ...form, is_demo: e.target.checked })
                  }
                />
                DEMO — {bn ? "কাল্পনিক সেবা" : "fictional service"}
              </label>
              <p className="text-xs">
                {bn
                  ? "যাচাইকৃত তথ্য সম্পাদনা করলে পুনরায় review দরকার।"
                  : "Editing verified information requires a new review."}
              </p>
              <Button type="submit" disabled={busy || !editAllowed}>
                {bn ? "খসড়া সংরক্ষণ" : "Save draft"}
              </Button>
            </form>
            {selected && editAllowed && (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => void write({ action: "submit", id: selected })}
              >
                {bn ? "Review-তে জমা দিন" : "Submit for review"}
              </Button>
            )}
          </Card>
          {current && (
            <Card className="space-y-3 p-4">
              <h2 className="font-bold">
                {bn ? "উৎসের প্রমাণ" : "Source evidence"}
              </h2>
              <ul>
                {current.resource_sources.map((s) => (
                  <li key={s.id} className="text-sm">
                    <a
                      className="text-primary underline"
                      href={s.source_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {s.source_title}
                    </a>{" "}
                    — {s.checked_at ?? (bn ? "যাচাই হয়নি" : "not checked")}
                  </li>
                ))}
              </ul>
              {editAllowed && (
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void write({
                      action: "source",
                      id: selected,
                      ...source,
                      checkedAt: source.checkedAt
                        ? new Date(source.checkedAt).toISOString()
                        : null,
                    });
                  }}
                >
                  <label htmlFor="source-title">
                    {bn ? "উৎসের নাম" : "Source title"}
                  </label>
                  <Input
                    id="source-title"
                    value={source.title}
                    onChange={(e) =>
                      setSource({ ...source, title: e.target.value })
                    }
                    required
                  />
                  <label htmlFor="source-url">HTTPS URL</label>
                  <Input
                    id="source-url"
                    type="url"
                    value={source.url}
                    onChange={(e) =>
                      setSource({ ...source, url: e.target.value })
                    }
                    required
                  />
                  <label htmlFor="source-checked">
                    {bn ? "যাচাইয়ের সময় (ঐচ্ছিক)" : "Checked time (optional)"}
                  </label>
                  <Input
                    id="source-checked"
                    type="datetime-local"
                    value={source.checkedAt}
                    onChange={(e) =>
                      setSource({ ...source, checkedAt: e.target.value })
                    }
                  />
                  <Button disabled={busy} type="submit">
                    {bn ? "উৎস যোগ" : "Add source"}
                  </Button>
                </form>
              )}
            </Card>
          )}
          {current && reviewAllowed && (
            <Card className="space-y-3 p-4">
              <h2 className="font-bold">
                {bn ? "Review সিদ্ধান্ত" : "Review decision"}
              </h2>
              <label htmlFor="review-state">{bn ? "অবস্থা" : "State"}</label>
              <Select
                id="review-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
              >
                {[
                  "needs_review",
                  "verified",
                  "unverified",
                  "expired",
                  "archived",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Select>
              <label htmlFor="review-note">
                {bn ? "অভ্যন্তরীণ review note" : "Internal review note"}
              </label>
              <Textarea
                id="review-note"
                required
                maxLength={1000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button
                disabled={busy || !note.trim()}
                onClick={() =>
                  void write({ action: "review", id: selected, state, note })
                }
              >
                {bn ? "সিদ্ধান্ত সংরক্ষণ" : "Save review"}
              </Button>
            </Card>
          )}
          <Card className="p-4">
            <h2 className="font-bold">
              {bn ? "অভ্যন্তরীণ যাচাই ইতিহাস" : "Internal verification history"}
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {workspace.events
                .filter((e) => !selected || e.resource_id === selected)
                .map((e) => (
                  <li key={e.id}>
                    {e.previous_state ?? "new"} → {e.new_state}: {e.note}
                  </li>
                ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
