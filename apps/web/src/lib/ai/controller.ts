import type { ChatMessage, SupportResource } from "../types";
import { classify, retrievalIntent } from "../safety/classifier";
import { currentResource, rankResources } from "../resources/grounding";
import { validateDecision, type AiProvider } from "./provider";
export async function groundedReply(
  message: string,
  lang: "en" | "bn",
  rows: SupportResource[],
  campus: string | null,
  provider: AiProvider,
  clarified = false,
): Promise<ChatMessage> {
  const bn = lang === "bn",
    c = classify(message);
  const reply: ChatMessage = {
    id: `a_${crypto.randomUUID()}`,
    role: "assistant",
    content: "",
    sources: [],
    provider: provider.name,
    state: "success",
    humanSupportAvailable: true,
    suggestedActions: [
      {
        kind: "human",
        label: bn ? "একজন মানুষের সাথে কথা বলুন" : "Talk to a human",
      },
      {
        kind: "continue",
        label: bn ? "সব রিসোর্স দেখুন" : "Browse all resources",
      },
    ],
  };
  if (c.kind === "cp" || c.kind === "developer" || c.kind === "study") {
    reply.content = bn
      ? "সংশ্লিষ্ট শেখার মডিউলে আপনার পছন্দ অনুযায়ী এগোতে পারেন। কোনো সময়সূচি পরিবর্তন করা হয়নি।"
      : "Open the relevant learning module to choose your next step. Your schedule has not changed.";
    reply.modulePath =
      c.kind === "cp" ? "/cp" : c.kind === "developer" ? "/learn" : "/study";
    return reply;
  }
  if (!campus && !c.urgent) {
    reply.state = clarified ? "no_resource" : "clarification";
    reply.uncertain = true;
    reply.content = bn
      ? "কোন ক্যাম্পাসের তথ্য চান? Settings-এ বেছে নিন, অথবা তথ্য না দিয়ে resource directory বা মানুষের সহায়তা নিন।"
      : "Which campus are you asking about? Choose it in Settings, or prefer not to say and browse the directory or talk to a human.";
    return reply;
  }
  if (!c.intent && !c.professional && c.kind !== "human") {
    reply.state = clarified ? "no_resource" : "clarification";
    reply.uncertain = true;
    reply.content = bn
      ? "কোন ধরনের সহায়তা চান—আর্থিক, পড়াশোনা, নাকি আবাসন? বলতে না চাইলে সরাসরি মানুষের সহায়তা নিতে পারেন।"
      : "What kind of support would help—financial, academic or housing? You can prefer not to say or talk to a human now.";
    return reply;
  }
  const candidates = rankResources(
    campus ? rows : [],
    campus,
    retrievalIntent(c),
    message,
  );
  let decision;
  try {
    decision = validateDecision(
      candidates.length
        ? await provider.decide({
            message,
            language: lang,
            resources: candidates,
          })
        : { resourceIds: [], steps: [] },
      candidates,
    );
  } catch {
    reply.state = "error";
    reply.uncertain = true;
    reply.content = bn
      ? "AI এখন উপলব্ধ নয়। যাচাইকৃত রিসোর্স নিজে খুঁজতে বা মানুষের সহায়তা নিতে পারেন।"
      : "Sorry, something went wrong. AI is unavailable. Browse verified resources manually or talk to a human.";
    return reply;
  }
  const sources = candidates.filter(
    (r) => decision.resourceIds.includes(r.id) && currentResource(r, campus),
  );
  reply.sources = sources;
  reply.state = sources.length ? "success" : "no_resource";
  reply.uncertain = !sources.length;
  reply.content = sources.length
    ? bn
      ? "আপনার ক্যাম্পাস ও নির্বাচিত বিভাগের সাথে মেলে এমন যাচাইকৃত রিসোর্স নিচে আছে। তথ্য সরাসরি সংরক্ষিত উৎস থেকে দেখানো হয়েছে।"
      : "Here are some verified resources that may match your campus and support category. Facts below come directly from stored sources."
    : bn
      ? "উপযুক্ত বর্তমান যাচাইকৃত রিসোর্স পাওয়া যায়নি। আমি নিশ্চিত নই; অন্য বিভাগ খুঁজুন বা মানুষের সহায়তা নিন।"
      : "I’m not sure: no suitable current verified resource was found. Broaden your search or talk to a human.";
  if (c.professional) {
    reply.content =
      (c.urgent
        ? bn
          ? "তাৎক্ষণিক বিপদে এই chat-এর জন্য অপেক্ষা করবেন না। কাছের বিশ্বাসযোগ্য মানুষ বা স্থানীয় জরুরি সেবার সহায়তা নিন। "
          : "If you are in immediate danger, do not wait for this chat. Seek help from a trusted person nearby or your local emergency service. "
        : "") +
      (bn
        ? "Close AI চিকিৎসা, আইনি বা বিনিয়োগের সিদ্ধান্ত দিতে পারে না। "
        : "Close AI cannot provide medical, legal or investment decisions. ") +
      reply.content;
    return reply;
  }
  const unknown = sources.flatMap((r) =>
    [
      !r.eligibility && (bn ? "যোগ্যতা" : "eligibility"),
      !r.cost && (bn ? "খরচ" : "cost"),
      !r.officialContact && (bn ? "যোগাযোগ" : "contact"),
    ].filter(Boolean),
  );
  if (unknown.length) {
    reply.uncertain = true;
    reply.content +=
      "\n" +
      (bn ? "অনিশ্চিত তথ্য: " : "Uncertain information: ") +
      Array.from(new Set(unknown)).join(", ") +
      (bn ? "। অফিসিয়াল উৎসে যাচাই করুন।" : ". Check the official source.");
  }
  if (sources.length && decision.steps.length) {
    const labels = bn
      ? {
          eligibility: "অফিসিয়াল উৎসে যোগ্যতা যাচাই করুন",
          documents: "অফিস কোন নথি চায় যাচাই করুন",
          contact: "যোগাযোগ করবেন কি না সিদ্ধান্ত নিন",
          deadline: "বর্তমান সময়সীমা যাচাই করুন",
        }
      : {
          eligibility: "Check eligibility on the official source",
          documents: "Check which documents the office requests",
          contact: "Decide whether to contact the office",
          deadline: "Check the current deadline",
        };
    reply.draft = {
      resourceId: sources[0].id,
      title: bn ? "প্রস্তাবিত পরবর্তী ধাপ" : "Suggested next steps",
      steps: decision.steps.map((k) => labels[k]),
    };
  }
  return reply;
}
