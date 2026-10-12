# Page Map

## 1. Landing
**Purpose:** Explain Close AI in one sentence and establish trust.  
**Primary:** Get Support.  
**Secondary:** Explore Modules; How Privacy Works.  
**States:** Default, low-bandwidth, service notice.  
**Mobile:** Single-column hero; large tap targets.  
**Accessibility:** Semantic heading order; no auto-motion requirement.

## 2. Onboarding
**Purpose:** Configure only essential preferences.  
**Main content:** Language, campus, module toggles, notifications, quiet hours, consent.  
**Primary:** Continue.  
**Secondary:** Skip optional fields.  
**States:** Not-listed campus, validation error, partially complete.  
**Accessibility:** Visible labels, error association, keyboard order.

## 3. Dashboard
**Purpose:** Fast entry into support and next actions.  
**Main content:** “What would you like help with today?”, support CTA, next steps, saved resources, reminders, optional modules.  
**Primary:** Get Support.  
**States:** New user, no next steps, reminders disabled, offline.

## 4. Student Support Chat
**Purpose:** Understand stated barrier and navigate to verified support.  
**Main content:** Conversation, starter prompts, source cards, uncertainty notices, human option.  
**Primary:** Send message.  
**Secondary:** Prefer not to say; Talk to a human; Save; Create step.  
**States:** Initial, loading, no verified result, offline, error, human handoff.  
**Accessibility:** Message announcements, keyboard input, visible focus, avoid sensitive preview leakage.

## 5. Resource Directory
**Purpose:** Browse verified campus resources.  
**Main content:** Search, category/campus/status filters, resource cards.  
**Primary:** Open resource.  
**States:** Empty, no match, offline cache, needs-review data.  
**Accessibility:** Search label, filter groups, status icons + text.

## 6. Resource Detail
**Purpose:** Explain what a resource offers and what remains uncertain.  
**Main content:** Offer, eligibility wording, cost, location, official source, source date, verification state.  
**Primary:** View official source.  
**Secondary:** Save, Create Checklist, Ask a Human.  
**States:** Verified, needs review, expired, archived, unverified.

## 7. Saved Resources
**Purpose:** Student-controlled collection.  
**Primary:** Open resource.  
**Secondary:** Remove saved item.  
**States:** Empty, resource became expired/archived.

## 8. My Next Steps
**Purpose:** Manage user-approved actions.  
**Statuses:** Not Started, In Progress, Waiting, Completed, Not Relevant.  
**Primary:** Update step.  
**Secondary:** Edit, delete, reorder, reminder.  
**States:** Empty, reminders off, waiting state.

## 9. Academic Study
**Purpose:** Optional course/deadline organization.  
**Primary:** Add/open task.  
**States:** No courses, no deadlines, AI suggestion pending review.

## 10. Developer Path
**Purpose:** Skills, projects, learning milestones.  
**Primary:** Choose pathway/milestone.  
**Secondary:** Open Visual Learning Lab or snippets.

## 11. Visual Learning Lab
**Purpose:** Interactive step-by-step technical learning.  
**Main content:** Subject library, topic detail, renderer, state panel, step explanation.  
**Primary:** Play/Next.  
**Secondary:** Pause, Previous, Reset, Speed, Show Steps as Text, Practice.  
**States:** Ready, playing, paused, finished, invalid input, unsupported topic, reduced motion.

## 12. CP Coach
**Purpose:** Competitive-programming practice and tracking.  
**Primary:** Open/attempt problem.  
**Secondary:** Need Hint, Solved, Skipped, Review Concept.  
**States:** No handle, API unavailable, demo/local tracking.

## 13. Settings & Privacy
**Purpose:** Control modules, language, notifications, consent, stored data, deletion/export.  
**Primary:** Save explicit changes.  
**Critical actions:** Delete conversation/account require clear confirmation.

## 14. Maintainer Workspace (restricted)
**Purpose:** Create, review, verify, expire, and archive support resources.  
**Main content:** Resource queue, source evidence, verification history.  
**Boundary:** No automatic access to student conversations.
