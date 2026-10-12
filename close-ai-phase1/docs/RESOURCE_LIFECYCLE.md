# Resource Lifecycle

## Goal
A support resource should never remain trusted simply because it was once added. Verification state must be explicit and traceable.

## States
- Draft
- Needs Review
- Verified
- Unverified
- Expired
- Archived

## Lifecycle
**Add → Review → Verify → Publish → Re-check → Update or Expire → Archive**

## Add
Authorized maintainers may create a resource with:
- campus
- category
- resource name
- description
- eligibility wording
- cost if known
- location/service area
- official contact
- official URL/source
- time-sensitive dates

New records default to Draft/Needs Review, not Verified.

## Review
Reviewer checks:
- official source legitimacy
- campus scope
- current contact details
- eligibility wording
- cost wording
- deadline/time-sensitive information
- whether the resource is appropriate for student display

## Verify
Verification event records:
- resource id
- reviewer identity/role
- source checked
- checked date/time
- resulting state
- notes/reason where needed

## Publish
Only records meeting the verification policy can display as Verified. Unverified data may be shown only when product policy allows and must be clearly labeled.

## Re-check
Do not hard-code one universal period in Phase 1. Store `next_review_at` so policies can differ by resource type. Time-sensitive resources should be reviewed more frequently than stable general information.

## Expiration triggers
- official source disappears
- application deadline passes
- phone/email becomes invalid
- service closes
- eligibility changes materially
- campus scope changes

Expired resources should not appear as current verified options.

## Archive
Archive records that are no longer useful for active student discovery but should remain in audit/history.

## Permission boundary
Resource maintainers manage resource records and verification events. This role does not automatically grant access to student support conversations, private action plans, or sensitive profile data.

## Student-facing presentation
Every resource detail should expose:
- verification state
- official source
- last checked date
- known uncertainty

Never guarantee eligibility or approval.
