---
name: feedback-css-consistency
description: "User cares deeply about CSS consistency between pages — no duplicate styles, shared components mandatory"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f5df75e4-75ff-4da5-adb2-cbcbf5ce690a
---

Never duplicate visual styles between Dashboard and App. Before adding CSS, check if a class already exists in AppPage.css or a shared component.

**Why:** User explicitly complained when notification bell looked different in Dashboard vs App, and when notification modal used different style than Dashboard dropdown. This caused wasted usage/cost.

**How to apply:** When implementing UI that appears in multiple places (buttons, panels, dropdowns), ALWAYS create a shared component in `src/components/ui/`. Ask the user about style consistency BEFORE implementing if unsure. The pattern: one component, one CSS file, imported everywhere.

Shared components already exist: `NotificationPanel.tsx`, `CustomSelect.tsx`, `CustomDatePicker.tsx`, `Money.tsx`.
