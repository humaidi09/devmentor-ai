"use client";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account";
import { useLanguage } from "@/lib/i18n";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import type { PublicProfile } from "@/lib/integrations/codeforces/adapter";
export function CodeforcesConnection({
  onProfile,
}: {
  onProfile?: (p: PublicProfile | null) => void;
}) {
  const { demo, data, request, refresh } = useAccount(),
    { lang } = useLanguage(),
    bn = lang === "bn";
  const [handle, setHandle] = useState(""),
    [preview, setPreview] = useState<PublicProfile | null>(null),
    [consent, setConsent] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!demo) setHandle(data?.cpHandle || "");
  }, [demo, data?.cpHandle]);
  async function validate() {
    setBusy(true);
    setError("");
    setPreview(null);
    setConsent(false);
    try {
      if (demo) {
        setError(
          bn
            ? "DEMO-তে কোনো বাহ্যিক সংযোগ নেই। Manual practice ব্যবহার করুন।"
            : "Demo uses no external connection. Manual practice is available.",
        );
        return;
      }
      const result = await request<{ profile: PublicProfile }>(
        "/api/codeforces",
        { action: "preview", handle },
      );
      setPreview(result.profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Codeforces unavailable.");
    } finally {
      setBusy(false);
    }
  }
  async function connect() {
    if (!preview || !consent) return;
    setBusy(true);
    setError("");
    try {
      const result = await request<{ profile: PublicProfile }>(
        "/api/codeforces",
        { action: "confirm", handle: preview.handle, confirmed: true },
      );
      await refresh();
      onProfile?.(result.profile);
      setPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to connect.");
    } finally {
      setBusy(false);
    }
  }
  async function disconnect() {
    setBusy(true);
    setError("");
    try {
      await request("/api/codeforces", undefined, "DELETE");
      await refresh();
      setPreview(null);
      setHandle("");
      onProfile?.(null);
      window.dispatchEvent(new Event("close-ai-codeforces-disconnected"));
    } catch {
      setError(
        bn
          ? "Disconnect হয়নি, আবার চেষ্টা করুন।"
          : "Unable to disconnect. Retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="space-y-3 p-4">
      <h2 className="font-bold">
        Codeforces ·{" "}
        {data?.cpConnected
          ? bn
            ? "সংযুক্ত"
            : "Connected"
          : bn
            ? "সংযুক্ত নয়"
            : "Not connected"}
      </h2>
      <p className="text-xs text-muted-foreground">
        {bn
          ? "Codeforces-এ শুধু public handle ও topic পাঠানো হয়। Close AI আপনার অনুমতিতে শুধু handle ও connection time রাখে। কোনো private submission বা support chat পাঠানো হয় না। যেকোনো সময় disconnect করতে পারেন।"
          : "Only a public handle and selected topic go to Codeforces. With your approval, Close AI stores the handle and connection time. No private submissions or support chat are sent. Disconnect any time."}
      </p>
      <label className="block text-sm">
        {bn ? "Codeforces হ্যান্ডেল (ঐচ্ছিক)" : "Codeforces handle (optional)"}
        <Input
          maxLength={24}
          value={handle}
          onChange={(e) => {
            setHandle(e.target.value);
            setPreview(null);
            setConsent(false);
          }}
          placeholder="tourist"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={busy || !handle.trim()}
          variant="secondary"
          onClick={validate}
        >
          {bn ? "Public profile যাচাই" : "Preview public profile"}
        </Button>
        {data?.cpHandle && (
          <Button disabled={busy} variant="ghost" onClick={disconnect}>
            {bn ? "Codeforces disconnect" : "Disconnect Codeforces"}
          </Button>
        )}
      </div>
      {preview && (
        <div className="space-y-2 rounded-md border p-3">
          <p>
            {preview.handle} · {bn ? "রেটিং" : "Rating"}:{" "}
            {preview.rating ?? (bn ? "Unrated" : "Unrated")} ·{" "}
            {preview.rank || "Unranked"}
          </p>
          <a
            href={preview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline"
          >
            {bn ? "অফিসিয়াল profile" : "Official profile"}
          </a>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            {bn
              ? "এই ঐচ্ছিক public handle সংরক্ষণ করে Codeforces সংযোগে সম্মত।"
              : "I agree to store this optional public handle and connect Codeforces."}
          </label>
          <Button disabled={busy || !consent} onClick={connect}>
            {bn ? "সংযোগ নিশ্চিত করুন" : "Confirm connection"}
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => setPreview(null)}
          >
            {bn ? "বাতিল" : "Cancel"}
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
    </Card>
  );
}
