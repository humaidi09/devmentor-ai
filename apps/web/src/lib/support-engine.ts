import { currentResource } from "./resources/grounding";
import { localize } from "./content-bn";
import { DEMO_RESOURCES } from "./demo-data";
import type { Lang } from "./i18n";
import type { ChatMessage, SuggestedAction, SupportResource } from "./types";
import { classify } from "./safety/classifier";

/**
 * Deterministic demo support engine.
 *
 * Safety rules baked in (see docs/PRIVACY_AND_SAFETY.md):
 *  - Only VERIFIED resources are ever surfaced.
 *  - It never invents a resource; if nothing matches it says so and offers a
 *    human / broader-search fallback.
 *  - External help remains available for urgent or professional matters.
 *  - It suggests, never decides eligibility or contacts anyone.
 */
const KEYWORDS: Record<string, string[]> = {
  financial: [
    "money", "fee", "fees", "tuition", "scholarship", "financial", "loan",
    "afford", "cost", "টাকা", "বৃত্তি", "ফি", "আর্থিক",
  ],
  academic: [
    "study", "course", "exam", "grade", "tutor", "class", "academic",
    "assignment", "math", "programming", "পড়া", "পরীক্ষা", "টিউটর",
  ],
  housing: ["hostel", "housing", "room", "accommodation", "rent", "residence", "আবাসন", "হোস্টেল", "রুম"],
  careers: ["job", "career", "internship", "cv", "resume", "interview", "placement", "চাকরি", "ইন্টার্নশিপ", "ক্যারিয়ার"],
  wellbeing: ["stress", "wellbeing", "overwhelmed", "tired", "balance", "চাপ", "সুস্থতা"],
  international: ["visa", "international", "passport", "foreign", "ভিসা", "আন্তর্জাতিক", "পাসপোর্ট"],
};

export function matchResources(
  message: string,
  resources: SupportResource[] = DEMO_RESOURCES,
): SupportResource[] {
  const text = message.toLowerCase();
  const categories = new Set<string>();
  for (const [category, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => text.includes(w.toLowerCase()))) categories.add(category);
  }
  const verified = resources.filter((r) => currentResource(r, r.campusId));
  const matched = verified.filter((r) => categories.has(r.category));
  return matched.slice(0, 3);
}

export function buildDemoReply(message: string, lang: Lang): ChatMessage {
  const sources = matchResources(message);
  const safety = classify(message);
  const uncertain = sources.length === 0;
  const actions: SuggestedAction[] = [];
  let content: string;

  if (uncertain) {
    content =
      lang === "bn"
        ? "আমি নিশ্চিত নই কোন নির্দিষ্ট যাচাইকৃত রিসোর্স এটার সাথে মিলছে, আর আমি কিছু বানিয়ে বলব না। আরেকটু বিস্তারিত লিখুন বা উৎসগুলো নিজে দেখুন।"
        : "I'm not sure which verified resource matches this, and I won't invent one. Add a little more detail or browse the sources yourself.";
    actions.push({ label: lang === "bn" ? "সব রিসোর্স দেখুন" : "Browse all resources", kind: "continue" });
  } else {
    content =
      lang === "bn"
        ? "আপনার কথার সাথে মিলতে পারে এমন কিছু যাচাইকৃত রিসোর্স নিচে দেখানো হলো। প্রতিটির অফিসিয়াল উৎস ও সর্বশেষ যাচাইয়ের তারিখ আছে। চূড়ান্ত সিদ্ধান্ত আপনার।"
        : "Here are some verified resources that may match. Each shows its official source and last-checked date. The final decision is yours.";
    for (const r of sources) {
      actions.push({
        label: (lang === "bn" ? "খুলুন: " : "Open: ") + localize(r.name, lang),
        kind: "open_resource",
        resourceId: r.id,
      });
    }
    actions.push({ label: lang === "bn" ? "চেকলিস্ট তৈরি করুন" : "Create a checklist", kind: "checklist" });
  }
  if (safety.urgent || safety.professional || safety.kind === "human")
    actions.push({ label: lang === "bn" ? "জরুরি বা বিশেষজ্ঞ সহায়তা" : "Urgent or specialist help", kind: "human" });

  return {
    id: `a_${Date.now()}`,
    role: "assistant",
    content,
    sources,
    uncertain,
    suggestedActions: actions,
    humanSupportAvailable: safety.urgent || safety.professional || safety.kind === "human",
  };
}
