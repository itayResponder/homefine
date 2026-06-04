---
name: feedback-update-claude-md
description: Always update CLAUDE.md automatically after architectural changes — no need to ask
metadata: 
  node_type: memory
  type: feedback
  originSessionId: afb30044-fcb8-4abd-ad34-22d9562de627
---

Always update `CLAUDE.md` after any architectural change (routing, data flow patterns, new conventions) — without waiting to be asked.

**Why:** User expects all four docs to stay in sync: CLAUDE.md, CONTEXT.md, memory files, MEMORY.md index.

**How to apply:** After completing a feature, update CLAUDE.md alongside CONTEXT.md and memory files. Focus on: Routing section (new routes/patterns), Data Flow section (hook ownership changes), Firebase path structure (new paths or changed schemas).
