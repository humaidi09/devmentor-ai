# Design System Direction

## Brand personality
Calm, respectful, trustworthy, modern, private, student-friendly, and clear.

## Avoid
Generic chatbot UI, generic analytics dashboard, childish illustrations, alarming red-heavy surfaces, excessive gradients, guilt-based streaks, and unnecessary motion.

## Proposed visual direction
### Primary brand colour — provisional
Deep teal: `#0F766E`

Reason: calm and distinctive without feeling clinical or alarming. This remains an approval item before Phase 2.

### Neutral foundation
- Background: `#F8FAFC`
- Surface: `#FFFFFF`
- Surface secondary: `#F1F5F9`
- Text primary: `#0F172A`
- Text secondary: `#475569`
- Border: `#CBD5E1`

### Semantic tokens — provisional
- Success: `#15803D`
- Warning: `#A16207`
- Error: `#B91C1C`
- Info: `#0369A1`
- Verified: success token + icon/text
- Needs Review: warning token + icon/text
- Unverified: neutral/info treatment + explicit label

Colour must never be the only status cue.

## Typography
Use a readable sans-serif that supports Bangla and Latin well. Final font family should be chosen only after rendering both scripts. Do not optimize only for English.

Type scale concept:
- Display: 2.25rem / 1.15
- H1: 1.875rem / 1.2
- H2: 1.5rem / 1.25
- H3: 1.25rem / 1.3
- Body: 1rem / 1.6
- Small: 0.875rem / 1.5
- Caption: 0.75rem / 1.4
- Code: 0.875rem monospace

## Spacing scale
`4, 8, 12, 16, 24, 32, 48, 64px`

## Radius
- Small: 8px
- Medium: 12px
- Large: 18px
- Full: 9999px

## Shadows
Use minimal elevation. Borders should do most grouping work.

## Motion
- Fast: 120–160ms
- Normal: 180–240ms
- Slow: 300–450ms

Visual Learning animations can be longer because state changes are instructional, but every animation needs pause/manual controls and reduced-motion fallback.

## Buttons
- Primary: one dominant action per view
- Secondary: bordered/quiet
- Tertiary: text/ghost
- Destructive: reserved for deletion

All states: default, hover (desktop only), focus-visible, disabled, loading.

## Forms
Visible labels, optional field indicator, helper text, inline error association, and no placeholder-only labels.

## Chat
- Clearly distinguish student and AI messages without relying only on colour.
- Sources appear in a separate evidence region.
- “I’m not sure” state has a calm, non-alarming treatment.
- Human support remains visible.

## Low-fidelity layout notes
### Dashboard
Header → support hero card → next steps → saved resources/reminders → optional module cards.

### Support Chat
Desktop: conversation center + contextual resource panel.  
Mobile: single-column chat + expandable resource cards; sticky composer.

### Visual Learning
Desktop: renderer left/center, state panel right, controls below.  
Mobile: renderer → controls → current state → explanation → text steps.
