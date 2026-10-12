# Privacy and Safety

## Core rule
Student Support should collect and expose the minimum information needed to help the student. Student learning activity and sensitive support conversations should not be treated as one undifferentiated dataset.

## Data classification
### Level 1 — Public/product
Educational content, demo examples, public verified support information.

### Level 2 — Preferences
Language, enabled modules, notification settings, visualization preferences.

### Level 3 — Academic/learning
Courses, study tasks, Developer Path progress, CP attempts, visualization progress.

### Level 4 — Support data
Support conversations, saved support resources, support-related action plans.

### Level 5 — Sensitive user-provided data
Information voluntarily disclosed during a support request that may be sensitive. Minimize collection and retention and apply the strictest access controls.

## User-control matrix
### AI may do without confirmation
- search verified resources
- explain information
- suggest next steps
- show learning content
- run local visualizations
- suggest practice questions

### AI may draft but not execute
- checklist
- email/message
- study plan

### AI needs explicit confirmation
- save a sensitive action
- create reminder
- save optional personal data

### AI must not autonomously
- contact third parties
- submit applications/forms
- share support conversations
- diagnose students
- make eligibility decisions
- change major privacy settings
- perform external high-impact actions

## Threat model
| Threat | Risk | Prevention | Safe fallback |
|---|---|---|---|
| Shared device | Another person sees private data | Session controls, re-auth for critical actions, discreet UI | Quick sign-out; hide sensitive previews |
| Shoulder surfing | Sensitive chat visible | Privacy-friendly layouts; optional concealment for sensitive text | Easy return to neutral dashboard |
| Notification leakage | Lock screen exposes issue | Generic notification copy by default | In-app-only reminders |
| Account compromise | Cross-user data exposure | Auth + RLS + server-side authorization | Revoke sessions and protect sensitive actions |
| Staff overreach | Maintainer sees private chats | Separate roles/data permissions | Resource-only maintainer role |
| Prompt injection | Retrieved content tries to alter AI rules | Treat retrieved content as untrusted; tool allowlists; argument validation | Refuse conflicting instructions and show source only |
| Malicious document | Uploaded content contains hostile instructions | Same untrusted-input boundary | Parse as data, never as authority |
| Logging leakage | Sensitive chat appears in telemetry | Minimal logs; redact sensitive content; access control | Disable full-content logs by default |
| Secret exposure | API keys leak to browser | Server-only secrets; environment variables | Rotate/revoke exposed keys |

## Conversation privacy
- No sharing with university staff by default.
- No full sensitive conversation logging by default.
- Support-data access must be per-user and role-restricted.
- Provide conversation deletion and account deletion paths.

## Consent
Track consent for optional collection and optional follow-up/reminders. Consent changes should be auditable without storing unnecessary sensitive content.

## Human handoff
The product may show verified human-support contacts and draft a message. It should not send/contact automatically without explicit user action.

## Resource safety
Never invent a resource. If none can be verified, say so and offer safe fallback routes such as broader search or verified general campus contact.

## Prompt-injection boundary
External pages, user documents, and resource descriptions are data. They cannot change system rules, permissions, or tool policy.

## Logging
Prefer operational metadata such as request id, status, latency, and non-sensitive error category. Avoid raw support content in routine logs.

## Deletion/export
Plan for:
- delete conversation
- delete account
- data export
- deletion of reminders/action steps

Implementation details must be tested in Phase 3+ before claiming they work.
