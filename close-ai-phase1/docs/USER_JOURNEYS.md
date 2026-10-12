# User Journeys

All journeys use the pattern:

**Entry → User Action → System Response → Verification → Next Step → User Control**

## 1. Student asks for support
**Entry:** Dashboard or landing page → **Get Support**  
**User Action:** Describes a barrier or chooses a starter option.  
**System Response:** Classifies only the broad intent and asks one short clarification question when necessary.  
**Verification:** Searches campus-specific verified resources and shows source/verification state.  
**Next Step:** Offers 1–3 realistic actions.  
**User Control:** Student can continue, skip a question, save a resource, create a checklist, or request a human.

## 2. Student finds a verified resource
**Entry:** Resource Directory.  
**User Action:** Searches or filters by category/campus.  
**System Response:** Returns resource cards with name, service, likely eligibility description, location, cost if known, official source, verification state, and last-checked date.  
**Verification:** Verified records are visually distinct; unverified/expired records cannot masquerade as current.  
**Next Step:** Open resource detail.  
**User Control:** Save, view official source, create checklist, dismiss, or ask a human.

## 3. Student creates an action checklist
**Entry:** Resource detail or chat recommendation.  
**User Action:** Chooses **Create Checklist**.  
**System Response:** Drafts a small set of steps.  
**Verification:** Clearly marks which steps came from verified resource data and which are AI suggestions.  
**Next Step:** Student reviews and edits.  
**User Control:** Accept, edit, reorder, delete, dismiss, or add an optional reminder.

## 4. Student requests human help
**Entry:** Any Student Support screen.  
**User Action:** Chooses **Talk to a Human**.  
**System Response:** Displays appropriate verified office/service/contact options without unnecessary questioning.  
**Verification:** Shows official source and last verification date.  
**Next Step:** Student may view contact details or ask AI to draft a message.  
**User Control:** Student decides whether and how to contact the service; Close AI does not send automatically.

## 5. Academic Study
**Entry:** Optional Academic Study module.  
**User Action:** Adds/selects a course or deadline.  
**System Response:** Shows editable tasks or an AI-proposed plan.  
**Verification:** AI-generated suggestions are labeled as suggestions, not proof of learning.  
**Next Step:** Student adjusts plan.  
**User Control:** Can edit, skip, delete, or disable reminders.

## 6. Developer Path
**Entry:** Developer Path.  
**User Action:** Selects frontend/backend/full-stack/mobile/data/DevOps.  
**System Response:** Shows skills, milestones, project ideas, snippets, and related Visual Learning topics.  
**Verification:** No unsupported salary/job outcome claims.  
**Next Step:** Select a milestone or topic.  
**User Control:** Student chooses what to track and can reset progress.

## 7. Visual Learning Lab
**Entry:** Developer Path → Visual Learning Lab.  
**User Action:** Selects DSA/Algorithms/DBMS and a topic such as BFS.  
**System Response:** Loads an interactive example with Play/Pause/Next/Previous/Reset/Speed.  
**Verification:** Step explanation and state must match the deterministic algorithm step generator.  
**Next Step:** Student completes the walkthrough or opens a related practice question.  
**User Control:** May change input, pause, move backward, switch to text steps, or leave at any time.

### Example BFS journey
Open BFS → sample graph → Play → current node highlighted → queue changes → visited nodes update → traversal order updates → short explanation → Pause/Previous/Next → Reset or new input → related practice.

## 8. CP Coach
**Entry:** CP Coach.  
**User Action:** Chooses a problem or enters optional Codeforces handle.  
**System Response:** Shows problem link, source metadata, hint-first support, and tracking controls.  
**Verification:** External source data must be distinguished from local/demo data.  
**Next Step:** Attempt problem; optionally review a Visual Learning concept.  
**User Control:** Mark Attempted/Solved/Skipped/Need Hint and choose whether to upsolve later.

## 9. Resource maintainer
**Entry:** Restricted maintainer workspace.  
**User Action:** Adds/edits a resource and attaches official source evidence.  
**System Response:** Saves as Draft or Needs Review.  
**Verification:** Reviewer checks source, scope, contact, eligibility wording, dates, and campus.  
**Next Step:** Publish as Verified or return for changes.  
**User Control:** Authorized maintainer can update/archive the resource, but this role does not automatically gain access to student support conversations.
