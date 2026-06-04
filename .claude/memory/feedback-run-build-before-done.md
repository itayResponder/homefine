---
name: feedback-run-build-before-done
description: Always run tsc --noEmit (or npm run build) before reporting a task as complete — never submit code with basic compile errors
metadata: 
  node_type: memory
  type: feedback
  originSessionId: dafd58b7-5abe-426b-93dc-4a90ecbfaaa3
---

Run `npm run build` (not just `npx tsc --noEmit`) after EVERY set of file edits, before reporting the task as done. `tsc --noEmit` misses Vite-level issues; `npm run build` catches everything. A Stop hook is configured in `.claude/settings.json` to automatically run tsc when Claude stops and inject errors back as context — but don't rely on it, run it proactively.

**Why:** User was repeatedly frustrated by cascading build errors across multiple rounds. Also frustrated that this rule was already in memory but not consistently followed. A Stop hook has now been added to catch failures automatically.

**How to apply:** After any code changes — run `npx tsc --noEmit` and fix ALL errors before the final message. When removing a prop from a component, always grep for all usages (interface, destructuring, parent call sites) and fix them in the same edit round. No exceptions. The Stop hook is a safety net, not a replacement for proactive checks.
