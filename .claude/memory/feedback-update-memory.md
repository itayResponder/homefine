---
name: feedback-update-memory
description: "After every completed feature or fix, always update memory files and CONTEXT.md — no exceptions"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: a7ff33d2-f0d8-4594-a43b-e4d6262579fb
---

After EVERY completed feature or bug fix, immediately update:
1. `CONTEXT.md` in the project root — add to "What's Built" and update any relevant sections
2. Relevant memory files in `~/.claude/projects/.../memory/` — update `project-architecture.md`, `project-permissions-model.md`, or whichever files are affected
3. `CLAUDE.md` if architecture, routing, or data flow changed

**Why:** User asked multiple times and is frustrated that it keeps not happening. "אני רוצה להפסיק להזכיר לך" — he wants to stop reminding me. The Stop hook reminds about file changes, but the ACTUAL update must be done by Claude.

**How to apply:** After the LAST edit in any feature — immediately write to CONTEXT.md and memory in the SAME response turn. No exceptions, no deferral. The reminder hook is a safety net; the update itself is my responsibility and must be proactive.
