# Limited campus pilot pre-launch checklist

`[x]` means verified locally in Phase 6; `[ ]` is still required for a real pilot. See [test evidence](TEST_REPORT.md), [security review](SECURITY_REVIEW.md) and [deployment procedure](DEPLOYMENT.md). A local pass is never a hosted pass.

- [x] Web typecheck, lint, 36 logic tests, default/account builds and client secret scan pass.
- [x] Local two-user Auth/RLS, staff role separation, ownership and consent tests pass.
- [x] Local AI grounding, missing-fact, prompt-injection and provider-failure tests pass.
- [x] Local notifications, reminders, Codeforces failure and disconnect tests pass.
- [x] Six visual engines have logic checks; bilingual browser, axe, keyboard, mobile and offline checks pass on tested routes.
- [x] App-data export/reset and operator-assisted Auth deletion limitation are visible and locally tested where applicable.
- [x] Local response security headers and account private-cache boundary are checked.
- [ ] Hosted Supabase access is repaired; migrations `0001`–`0010` and RLS are applied and verified on the intended project.
- [ ] Vercel project access is granted; public account variables, canonical origin and Auth callback redirects are configured and redeployed.
- [ ] Hosted signup/confirmation, signin/signout, session expiry and two-user isolation pass with staging users.
- [ ] A pilot campus, maintainer, reviewer, support escalation owner and feedback owner are named.
- [ ] Every real pilot resource has a checked official source, current contact/eligibility/cost/location, correct campus and dated reviewer approval. Fictional DEMO data is visibly separate.
- [ ] A usable correction/feedback channel reaches the named owner, with a review and response process.
- [ ] Full Auth-account deletion is exercised by the operator and its residual operational records/retention are documented to users. The UI must not imply self-service deletion.
- [ ] A staging backup and separate-project restore drill are recorded; pilot backup cadence/retention and incident owner are agreed.
- [ ] Production security headers, private cache policy, error responses and secret absence are checked after deployment.
- [ ] Human screen-reader review, touch-target/contrast review and device testing supplement automated axe/viewport checks.
- [ ] Small bilingual pilot tasks and feedback process in [PILOT_EVALUATION.md](PILOT_EVALUATION.md) are approved; no sensitive conversation collection is introduced.
- [ ] A versioned pilot release, rollback decision owner and privacy-conscious uptime/error monitoring are in place.

**Decision:** ready for further internal testing; limited campus pilot remains blocked until every unchecked release gate is completed and evidenced.
