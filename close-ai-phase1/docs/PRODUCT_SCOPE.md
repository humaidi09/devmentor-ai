# Product Scope

## 1. Vision
Close AI is a student-centered support workspace. It helps university students explain a barrier, discover relevant verified support, understand realistic next steps, and reach human support when needed.

## 2. Core principle
Help the student reach real support without labeling, shaming, surveilling, diagnosing, or making high-impact decisions for them.

## 3. Primary problem
University support can be fragmented across offices, webpages, forms, deadlines, eligibility rules, and informal knowledge. A student may know they need help but not know which service is relevant, whether information is current, or what to do next.

Close AI should reduce this navigation burden without pretending to be the final authority.

## 4. Target user contexts
- Mobile-first student
- Low-bandwidth student
- Bangla-preferred student
- English-preferred student
- Bilingual student
- First-time support seeker
- Privacy-sensitive student
- Student who wants immediate human help

These are usage contexts, not invented personas.

## 5. Product modules
### Student Support — primary
- Support chat
- Verified resources
- Resource detail
- Saved resources
- My Next Steps
- Human handoff
- Consent/privacy controls

### Academic Study — optional
- Courses
- Deadlines
- Study tasks
- Editable study-plan suggestions

### Developer Path — optional
- Learning pathways
- Skills
- Projects
- Snippets
- Visual Learning Lab

### CP Coach — optional
- Practice recommendations
- Hints
- Attempts/solves/skips
- Upsolving
- Optional Codeforces integration later

## 6. MVP priority
### Must have
1. Student Support entry point
2. Support chat with respectful clarification
3. Verified resource directory
4. Resource verification state and source
5. Resource detail
6. Human-support handoff
7. My Next Steps
8. Student-controlled checklist
9. Privacy and consent controls
10. Demo mode
11. Mobile responsiveness
12. Accessibility basics
13. Bangla and English support

### Should have
1. Saved resources
2. Optional reminders
3. Academic Study basic shell
4. Developer Path basic roadmap
5. CP Coach basic tracking
6. Visual Learning Lab prototype

### Later
1. External university integrations
2. Full Codeforces personalization
3. Push notifications
4. Advanced analytics
5. Advanced learning personalization
6. Large animation library
7. Additional CSE subjects
8. Complex agents
9. Vector database unless a measured retrieval need appears

## 7. Non-goals
Close AI is not:
- a medical, legal, financial, crisis, or emergency service
- a replacement for professional advisors
- a student-monitoring or dropout-prediction system
- a system that decides eligibility
- a system that automatically contacts third parties

## 8. Pilot scope
Start with one campus or a limited campus pilot. Each campus needs its own verified resource set. Do not transfer rules or eligibility assumptions from one campus to another.

## 9. Functional success conditions
- Student Support is reachable immediately from the dashboard.
- A student can request human help without being forced through a long chat.
- Every real resource exposes source and verification state.
- Unverified/expired information cannot look verified/current.
- Optional questions can be skipped.
- High-impact actions require explicit approval.
- Core flows work on mobile and keyboard.
- Demo mode works without AI keys.

## 10. Product boundaries
The AI may explain, search, rank against user-stated criteria, draft, and suggest. It must not independently submit, contact, diagnose, decide eligibility, share sensitive data, or alter major privacy settings.
