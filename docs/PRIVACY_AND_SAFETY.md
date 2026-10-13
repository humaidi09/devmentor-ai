# Close AI implemented privacy and authorization

Students own their profile, preferences, saved resources, action plans/steps, reminder intent, consent history and optional learning records. RLS and ownership foreign keys enforce this boundary even for direct PostgREST calls. Server routes also verify the session and reject client-provided ownership fields.

Resource maintainers/reviewers/admins receive campus resource permissions only. They cannot read other students' profiles, saves, plans or conversations. Roles come from trusted SQL grants, not user metadata. Internal review notes are restricted to resource staff; resource verification events cannot be fabricated by ordinary clients.

Support-data storage and reminders are opt-in. Consent changes append records; defaults do not imply consent. Withdrawing support storage stops new records, while existing records can be deleted individually or by confirmed reset. Disabling reminder intent disables existing reminders. No external notification is sent.

Mock support conversations are not persisted or written to application logs. Demo results remain fictional. Account chat retrieves verified database resources; students can choose external AI per message under the Phase 4 boundary below. Personalization is limited to information the student chooses to store. No monitoring, tracking analytics or automatic external contact is added.

Settings expose stored profile/preferences, consent history, JSON export and app-data reset. Reset deletes own app records transactionally and retains a default profile and Auth login. Full Auth-account deletion requires an operator until a reauthentication/admin deletion flow is implemented; the UI explains that limit.

Account responses use private/no-store. The demo worker never caches API/export responses. Account mode unregisters the worker and clears only Close AI's own caches. Privileged credentials are neither required nor imported into client code. Authentication providers may have their own operational/Auth logs; the application does not log sensitive support messages.

A production operator must configure the canonical site URL, Supabase Auth allowed redirects and valid public project credentials before account deployment. Supabase URL/anon key are public identifiers, not authorization bypasses; RLS remains the data boundary.

## Phase 4 model boundary

Account students choose external AI per message. Explain that the message and up to three resource summaries go to Google; users can keep mock/manual mode. Close AI does not persist chat, send whole profiles, mix support with CP/learning history, log prompts, contact third parties or make eligibility/medical/legal/investment decisions. Clear conversation removes the on-page transcript. Provider retention is governed by the configured provider's terms, separately from Close AI's memory-only chat.

Facts and official names remain database-authored; missing cost, eligibility and contacts are explicitly unknown. Model output is restricted to already retrieved IDs and four checklist keys, and extra fields fail closed. Untrusted descriptions cannot grant permissions. High-risk language immediately offers people/local emergency services without fabricated phone numbers. Detection is a limited English/Bangla keyword aid, not diagnosis or a complete crisis service. Checklist approval and storage consent are both required; reminders require a later independent opt-in.

## Phase 5 opt-in and data separation

Notification preferences default to disabled; each schedule has its own explicit approval. Quiet-hour/category/master-reminder gates apply at delivery. Support preview text never includes the underlying title or conversation. Learning-detail previews are a separate explicit choice. No email/push/third-party message delivery is configured. In-app polling occurs only for visible, online signed-in sessions. Due notifications appear when the app is open; there is no off-app guarantee.

Codeforces profile lookup discloses only the typed public handle; public problem search discloses only the chosen topic. Preview does not save identifiers. Confirmation explains and records optional profile consent, saving the public handle and connection time. Disconnect/consent withdrawal clears them. Raw remote data is never trusted or persisted; normalized public data is kept only in bounded TTL caches, and no private Codeforces access is claimed. Submission samples are not lifetime performance and recommendations promise no rating improvement.

Study/Developer/CP/Visual personalization uses only explicit choices, saved learning records and public data the student requested. No support conversation, protected attributes or hidden risk score enter these functions. Visual progress is stored only by button action and can be forgotten. Export/reset include new preferences, reminders, notifications, optional connection identifiers and learning progress. Operational per-user/hour service counters contain no message/handle content and remain outside app-data reset so usage limits cannot be bypassed; Auth-user removal cascades them. Full Auth-user deletion remains operator-assisted.
