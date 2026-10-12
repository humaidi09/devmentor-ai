# Accessibility Plan

## Standard
Target WCAG 2.2 principles and testable success criteria, with emphasis on keyboard operation, focus, labels, contrast, motion, and understandable status communication.

## Acceptance checklist
- Every input has a visible label.
- Every interactive control has an accessible name.
- Core flows work with keyboard only.
- Focus is clearly visible.
- Focus order follows visual/logical order.
- No required action is hover-only.
- Colour is never the only status cue.
- Text and controls meet appropriate contrast requirements.
- Errors identify the affected field and explain the fix.
- Major navigation has semantic landmarks/headings.
- Chat updates are announced without overwhelming screen readers.
- Reduced-motion preferences are respected.
- Touch targets are comfortable on mobile.
- Bangla and English content remain readable and correctly announced where possible.

## Visual Learning accessibility
Animations are supplemental, not exclusive.

Every visualizer provides:
- step number
- current operation text
- current data-state text
- final result
- pause
- Next/Previous
- Reset
- keyboard operation
- Show Steps as Text

### Example text fallback
```text
Step 1: Visit A
Queue: [A]

Step 2: Remove A
Discover B and C
Queue: [B, C]
```

## Graphs
Do not distinguish nodes only by colour. Use labels, outlines, icons/patterns, or text state.

## Reduced motion
Replace animated travel/transforms with instant or minimal transitions while preserving state changes.

## Low bandwidth
- Avoid heavy decorative media.
- Do not require video to learn a topic.
- Keep text explanations available even if visualization assets fail.
- Use loading and offline states that explain what remains available.

## Bilingual UX
- Language toggle must be keyboard accessible.
- Avoid mixing Bangla/English in a way that breaks meaning.
- Test line wrapping and control sizing with Bangla strings, not only English.
