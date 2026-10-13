"use client";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account";
import { useLanguage } from "@/lib/i18n";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
export function ProfileControls() {
  const { demo, data, request, refresh, mutate, busy } = useAccount();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [name, setName] = useState("");
  const [zone, setZone] = useState("Asia/Dhaka");
  const [notice, setNotice] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (data) {
      setName(data.profile.display_name ?? "");
      setZone(data.profile.timezone);
    }
  }, [data]);
  if (demo) return null;
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      await request(
        "/api/account",
        { display_name: name, timezone: zone },
        "PATCH",
      );
      await refresh();
      setNotice(bn ? "প্রোফাইল সংরক্ষিত।" : "Profile saved.");
    } catch {
      setNotice(
        bn ? "প্রোফাইল সংরক্ষণ করা যায়নি।" : "Profile could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function exportData() {
    try {
      const value = await request("/api/export");
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(value, null, 2)], {
          type: "application/json",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "close-ai-data.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setNotice(bn ? "Export করা যায়নি।" : "Export failed.");
    }
  }
  async function erase() {
    if (confirmation !== "ERASE APP DATA") return;
    setSaving(true);
    try {
      await request("/api/account", { confirmation }, "DELETE");
      setConfirmation("");
      await refresh();
      setNotice(
        bn
          ? "App data reset হয়েছে। সাইন-ইন অ্যাকাউন্ট রয়েছে।"
          : "App data reset. Your sign-in account remains.",
      );
    } catch {
      setNotice(bn ? "ডেটা মুছতে পারিনি।" : "Unable to erase data.");
    } finally {
      setSaving(false);
    }
  }
  const granted = (type: string) =>
    data?.consents.find((c) => c.consent_type === type)?.granted === true;
  return (
    <section className="space-y-4">
      <Card className="p-4">
        <h2 className="mb-3 font-bold">
          {bn ? "নিজের প্রোফাইল" : "Your profile"}
        </h2>
        <form className="space-y-3" onSubmit={save}>
          <label htmlFor="display-name">
            {bn ? "নাম (ঐচ্ছিক)" : "Display name (optional)"}
          </label>
          <Input
            id="display-name"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label htmlFor="timezone">{bn ? "টাইমজোন" : "Timezone"}</label>
          <Input
            id="timezone"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            required
            maxLength={80}
          />
          <Button
            type="submit"
            disabled={
              saving ||
              !data ||
              (Boolean(name.trim()) && !granted("optional_profile_data"))
            }
          >
            {bn ? "প্রোফাইল সংরক্ষণ" : "Save profile"}
          </Button>
        </form>
        <p className="mt-3 text-xs">
          {bn
            ? "নাম সংরক্ষণের আগে ঐচ্ছিক প্রোফাইল তথ্যের সম্মতি চালু করুন। অতিরিক্ত ব্যক্তিগত তথ্য দরকার নেই।"
            : "Enable optional profile-data consent to save a display name. No additional personal information is required."}
        </p>
      </Card>
      <Card className="space-y-3 p-4">
        <h2 className="font-bold">
          {bn ? "ডেটা সংরক্ষণের সম্মতি" : "Data storage consent"}
        </h2>
        {(["support_data_storage", "optional_profile_data"] as const).map(
          (type) => (
            <label key={type} className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                disabled={busy}
                checked={granted(type)}
                onChange={(e) =>
                  void mutate("consent", { type, granted: e.target.checked })
                }
              />
              {type === "support_data_storage"
                ? bn
                  ? "Saved resources ও action plans সংরক্ষণ অনুমোদন করুন"
                  : "Allow saved resources and action-plan storage"
                : bn
                  ? "ঐচ্ছিক প্রোফাইল তথ্য সংরক্ষণ অনুমোদন করুন"
                  : "Allow optional profile-data storage"}
            </label>
          ),
        )}
        <p className="text-xs text-muted-foreground">
          {bn
            ? "সম্মতি বন্ধ করলে পুরোনো রেকর্ড নিজে মুছতে পারবেন। চ্যাট সংরক্ষণ করা হয় না।"
            : "Withdrawing consent stops new support records. You can delete existing records individually. Chat is not saved."}
        </p>
        <details>
          <summary>{bn ? "সম্মতির ইতিহাস" : "Consent history"}</summary>
          <ul className="mt-2 space-y-1 text-xs">
            {data?.consents.map((c) => (
              <li key={c.id}>
                {c.consent_type}:{" "}
                {c.granted
                  ? bn
                    ? "অনুমোদিত"
                    : "granted"
                  : bn
                    ? "প্রত্যাহার"
                    : "withdrawn"}{" "}
                —{" "}
                {new Date(c.created_at).toLocaleDateString(
                  bn ? "bn-BD" : "en-GB",
                )}
              </li>
            ))}
          </ul>
        </details>
      </Card>
      <Card className="space-y-3 p-4">
        <h2 className="font-bold">
          {bn ? "অ্যাকাউন্টের ডেটা নিয়ন্ত্রণ" : "Account data controls"}
        </h2>
        <Button variant="secondary" onClick={() => void exportData()}>
          {bn ? "নিজের ডেটা export" : "Export my data"}
        </Button>
        <p className="text-sm">
          {bn
            ? "App data reset ব্যক্তিগত app records মুছে ডিফল্ট প্রোফাইল রাখে। সাইন-ইন অ্যাকাউন্ট মুছে না।"
            : "Reset deletes your personal app records and restores default preferences. It retains your sign-in account."}
        </p>
        <label htmlFor="erase-confirm">
          {bn
            ? "নিশ্চিত করতে ERASE APP DATA লিখুন"
            : "Type ERASE APP DATA to confirm"}
        </label>
        <Input
          id="erase-confirm"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />
        <Button
          variant="destructive"
          disabled={saving || confirmation !== "ERASE APP DATA"}
          onClick={() => void erase()}
        >
          {bn ? "আমার app data reset" : "Reset my app data"}
        </Button>
        <p className="text-xs text-muted-foreground">
          {bn
            ? "পূর্ণ sign-in account deletion এখন operator-assisted; এই reset তা করে না।"
            : "Full sign-in account deletion is currently operator-assisted; this reset does not remove the Auth account."}
        </p>
      </Card>
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
