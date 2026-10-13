export const SUPPORT_INTENTS = [
  "financial",
  "academic",
  "housing",
  "careers",
  "wellbeing",
  "international",
  "food",
  "transport",
  "technology",
  "accessibility",
  "counselling",
  "general",
] as const;
export type SupportIntent = (typeof SUPPORT_INTENTS)[number];
const terms: Record<SupportIntent, string[]> = {
  financial: [
    "money",
    "fee",
    "tuition",
    "scholarship",
    "financial",
    "loan",
    "afford",
    "cost",
    "টাকা",
    "বৃত্তি",
    "ফি",
    "আর্থিক",
  ],
  academic: [
    "course",
    "exam",
    "grade",
    "tutor",
    "class",
    "academic",
    "assignment",
    "পড়া",
    "পরীক্ষা",
    "কোর্স",
  ],
  housing: ["hostel", "housing", "room", "rent", "আবাসন", "হোস্টেল"],
  careers: [
    "job",
    "career",
    "internship",
    "cv",
    "resume",
    "চাকরি",
    "ইন্টার্নশিপ",
  ],
  wellbeing: ["stress", "wellbeing", "overwhelmed", "চাপ", "সুস্থতা"],
  international: ["visa", "international", "passport", "ভিসা", "পাসপোর্ট"],
  food: ["food", "meal", "খাবার"],
  transport: ["transport", "bus", "commute", "বাস", "যাতায়াত"],
  technology: ["laptop", "internet", "technology", "ল্যাপটপ", "ইন্টারনেট"],
  accessibility: ["accessibility", "disability", "wheelchair", "প্রবেশগম্যতা"],
  counselling: ["counselling", "counseling", "কাউন্সেলিং"],
  general: ["student service", "general support", "সাধারণ সহায়তা"],
};
export function classify(message: string) {
  const text = message.toLowerCase();
  const intent =
    SUPPORT_INTENTS.find((k) => terms[k].some((w) => text.includes(w))) ?? null;
  const urgent =
    /immediate danger|kill myself|suicid|hurt myself|self.harm|আত্মহত্যা|তাৎক্ষণিক বিপদ/i.test(
      text,
    );
  const professional =
    urgent ||
    /diagnos|medication|medical advice|legal advice|invest money|investment advice|রোগ নির্ণয়|ওষুধ|আইনি পরামর্শ/i.test(
      text,
    );
  const kind = /talk to a human|speak to a person|মানুষের সাথে/i.test(text)
    ? "human"
    : /codeforces|competitive programming|সিপি কোচ/i.test(text)
      ? "cp"
      : /developer path|learn react|ওয়েব ডেভেলপ/i.test(text)
        ? "developer"
        : /study plan|revision plan|পড়ার পরিকল্পনা/i.test(text)
          ? "study"
          : /checklist|action plan|চেকলিস্ট/i.test(text)
            ? "planning"
            : intent
              ? "support"
              : "other";
  return { intent, kind, urgent, professional };
}

export function retrievalIntent(c: ReturnType<typeof classify>) {
  return c.urgent
    ? "wellbeing"
    : c.professional
      ? (c.intent ?? "general")
      : c.intent;
}
