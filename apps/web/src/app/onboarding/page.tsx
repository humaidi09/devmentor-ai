"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/language-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";
import { usePreferences } from "@/lib/preferences";

export default function OnboardingPage() {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const { preferences, save, storageUnavailable } = usePreferences();
  const router = useRouter();
  return <main id="main-content" className="mx-auto max-w-xl px-4 py-10">
    <div className="mb-6 flex items-start justify-between gap-4"><h1 className="text-2xl font-bold">{bn ? "আপনার পছন্দ ঠিক করুন" : "Make yourself at home"}</h1><LanguageToggle /></div>
    <p className="mb-6 text-sm text-muted-foreground">{bn ? "সবকিছু ঐচ্ছিক। এই ডেমোতে কোনো অ্যাকাউন্ট বা ব্যক্তিগত তথ্য দরকার নেই। পছন্দ শুধু এই ব্রাউজারে থাকে।" : "Everything is optional. This demo needs no account or personal information. Preferences stay in this browser."}</p>
    <form onSubmit={e => { e.preventDefault(); save({ ...preferences, onboarded: true }); router.push("/dashboard"); }}>
      <Card className="space-y-5 p-5">
        <div><label htmlFor="campus" className="mb-2 block font-medium">{bn ? "ক্যাম্পাস (ঐচ্ছিক)" : "Campus (optional)"}</label>
          <Select id="campus" value={preferences.campus} onChange={e => save({ ...preferences, campus: e.target.value })}>
            <option value="demo-u">{bn ? "ডেমো বিশ্ববিদ্যালয় — কাল্পনিক" : "Demo University — fictional"}</option>
            <option value="not-listed">{bn ? "আমার ক্যাম্পাস তালিকায় নেই" : "My campus is not listed"}</option>
          </Select>
          <p className="mt-2 text-sm text-muted-foreground">{preferences.campus === "not-listed" ? (bn ? "শুধু কাল্পনিক ডেমো তথ্য দেখানো হবে। এটি আপনার ক্যাম্পাসের সেবা বা নিয়ম নয়।" : "Only fictional demo information will be shown. It does not describe your campus services or rules.") : (bn ? "এখানকার সব সহায়তা সেবা নমুনা, বাস্তব যোগাযোগ নয়।" : "All support services here are samples, not real contacts.")}</p>
        </div>
        <fieldset><legend className="mb-2 font-medium">{bn ? "শেখার মডিউল (ঐচ্ছিক)" : "Learning modules (optional)"}</legend>
          {([['academic', 'Academic Study', 'একাডেমিক স্টাডি'], ['developer', 'Developer Path', 'ডেভেলপার পাথ'], ['cp', 'CP Coach', 'CP কোচ']] as const).map(([key, en, bnText]) => <label key={key} className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={preferences.modules[key]} onChange={e => save({ ...preferences, modules: { ...preferences.modules, [key]: e.target.checked } })} />{bn ? bnText : en}</label>)}
        </fieldset>
        <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={preferences.reminders} onChange={e => save({ ...preferences, reminders: e.target.checked })} />{bn ? "ইন-অ্যাপ রিমাইন্ডার চালু করুন (ঐচ্ছিক)" : "Enable in-app reminders (optional)"}</label>
        <p className="text-xs text-muted-foreground">{bn ? "রিমাইন্ডার শুধু খোলা অ্যাপে দেখাবে; কোনো push বা বাইরের বার্তা পাঠানো হবে না।" : "Reminders appear only inside the open app; no push or external messages are sent."}</p>
        {preferences.reminders && <fieldset className="grid grid-cols-2 gap-3"><legend className="mb-2 font-medium">{bn ? "নীরব সময়" : "Quiet hours"}</legend>{(['quietStart', 'quietEnd'] as const).map((key, i) => <div key={key}><label htmlFor={key}>{bn ? (i ? "শেষ" : "শুরু") : (i ? "End" : "Start")}</label><Input id={key} type="time" required value={preferences[key]} onChange={e => save({ ...preferences, [key]: e.target.value })} /></div>)}</fieldset>}
        {storageUnavailable && <p role="status">{bn ? "ব্রাউজার সংরক্ষণ বন্ধ। পছন্দ এই সেশন পর্যন্ত থাকবে।" : "Browser storage is unavailable. Preferences last for this session."}</p>}
        <div className="flex items-center gap-5"><Button type="submit">{bn ? "চালিয়ে যান" : "Continue"}</Button><Link href="/dashboard" className="text-sm text-primary underline">{bn ? "এখন বাদ দিন" : "Skip for now"}</Link></div>
      </Card>
    </form>
  </main>;
}
