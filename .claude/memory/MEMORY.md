# Memory Index

- [CSS Consistency Rule](feedback-css-consistency.md) — No duplicate styles; shared components mandatory; ask before multi-page UI
- [Ask Before Implementing](feedback-ask-before-implementing.md) — Consult user on design choices to avoid wasted usage/cost
- [Update Memory After Every Feature](feedback-update-memory.md) — Always update CONTEXT.md + memory files after each completed feature, no exceptions
- [Permissions Model](project-permissions-model.md) — Owner controls, income privacy, join requests, planned features
- [User Profile](user-profile.md) — Itay: Hebrew-first, product-driven, values no duplication, consults before building
- [Logo Colors](project-logo-colors.md) — "Home" = #0F172A, "Fine" = #2563EB — always hardcoded, never var(--ac)
- [Run Build Before Done](feedback-run-build-before-done.md) — Always run `npx tsc --noEmit` and fix all errors before reporting complete
- [Update CLAUDE.md Too](feedback-update-claude-md.md) — Update CLAUDE.md after architectural changes, without being asked
- [Calendar Module](project-calendar-module.md) — Shared calendar at /calendar: component map, data model, CSS prefix (cal-*), i18n under t.calendar.*
- [Automation Webhook](project-automation-webhook.md) — Google Wallet→HomeFine via Cloudflare Worker; deploy steps + future Blaze migration path
- [Form Validation Pattern](project-form-validation.md) — noValidate + errors state + .inp--error/.field-error; all forms must follow this; no browser popups
