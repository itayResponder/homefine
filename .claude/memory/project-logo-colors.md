---
name: project-logo-colors
description: "HomeFine logo color convention — fixed colors, never theme-dependent"
metadata: 
  node_type: memory
  type: project
  originSessionId: dafd58b7-5abe-426b-93dc-4a90ecbfaaa3
---

Logo colors are FIXED everywhere — never use CSS variables or theme colors for the logo.

- "Home" = `#0F172A` (dark/near-black)
- "Fine" (the `<span>`) = `#2563EB` (blue)

**Why:** Previously DashboardPage used `var(--ac)` for "Home" and JoinPage used `var(--brand)`, causing the logo to shift color with the user's primary color theme. Fixed 2026-06-01.

**How to apply:** Any new page/loader that renders the HomeFine logo must hardcode these two colors. Do NOT use `var(--ac)`, `var(--brand)`, or any other CSS variable. Reference: LandingPage (`lp-logo`) and AppHeader (`ap-logo`) as the canonical correct implementation.

Related: [[project-architecture]]
