import expandedLessons from "../visual/dsa-expanded-lessons.json";
import { learningReply, type ExpandedLesson } from "./learning";

/** Add the full lesson only on the server; offline chat keeps its smaller local answer. */
export function expandedLearningReply(message: string, lang: "en" | "bn", contextTopicId?: string) {
  return learningReply(message, lang, contextTopicId, expandedLessons as Record<string, ExpandedLesson>);
}
