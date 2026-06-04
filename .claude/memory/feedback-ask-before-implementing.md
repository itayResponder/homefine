---
name: feedback-ask-before-implementing
description: User wants to be consulted on design/architecture decisions BEFORE implementation to avoid wasted usage
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f5df75e4-75ff-4da5-adb2-cbcbf5ce690a
---

When a task has meaningful design choices or could cause CSS/UI inconsistency, ask the user first rather than guessing.

**Why:** User explicitly said "תשאל אותי כדי לא לבזבז לי מה-usage" (ask me to not waste my usage). He pays per token. Bad implementations that need to be redone waste money.

**How to apply:** For UI changes spanning multiple pages, styling decisions, or architectural choices — describe the plan in 2-3 sentences and ask for confirmation before writing code. For small, unambiguous changes (bug fixes, single-file edits), proceed directly.
