# Pilot owners, resource correction and incident operations

No real campus pilot is authorized by this document alone. Before inviting users, fill and confirm the owner roster below and publish a verified, reachable reporting channel. The application has no independent in-app feedback submission service today; an unassigned form or fictional DEMO contact is not a reporting channel.

| Responsibility | Named owner/contact | Required before pilot |
| --- | --- | --- |
| Campus support escalation and human handoff | Unassigned | Yes |
| Resource maintainer and official source checks | Unassigned | Yes |
| Independent resource reviewer | Unassigned | Yes |
| Privacy/security incident response | Unassigned | Yes |
| User feedback and accessibility issues | Unassigned | Yes |
| Supabase backup/restore and Vercel rollback | Unassigned | Yes |

## Resource correction

The verified reporting channel must accept a resource ID/URL and category such as incorrect contact, eligibility, cost, accessibility or outdated source. Ask for no sensitive student narrative. Log receipt and owner. The maintainer compares the claim with the official source, marks an unsafe/currently uncertain record `needs_review` or `expired` promptly, and sends it to the reviewer. Only the reviewer can verify checked evidence and date; the public page then shows the new state. Preserve internal verification events and acknowledge the report without exposing the reporter's private data. A student-submitted correction is a lead, not proof.

## Incident sequence

For wrong support information, unauthorized access, privacy exposure, compromised credentials, unsafe AI output or external integration failure: **detect → contain → fix → review → communicate where appropriate**. The incident owner records time, affected function, known scope and containment. Disable a risky provider/feature or mark a resource uncertain, rotate compromised credentials through the provider, and preserve minimal operational evidence without copying chat text or tokens into tickets. Verify the fix with the relevant regression test and review whether affected students/campus staff require a notice. Do not promise a response time until an owner and rota exist.

## Recovery and monitoring

The database owner must decide backup frequency, retention, access and encrypted storage for Auth users and all app tables; test a restore into a separate project and record the result before pilot. For accidental deletion, assess writes since the backup, choose a reviewed recovery path and notify affected users as appropriate. Vercel rollback restores application code, not database state. Monitor uptime and aggregate error/provider-failure counts only. Do not capture full support chats, passwords, access tokens or student-level behavior for analytics.
