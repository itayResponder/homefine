---
name: project-component-structure
description: Component directory layout after the June 2026 refactor — finance/, recurring/, settings/ subdirs
metadata:
  type: project
---

After the full refactor (June 2026), components/app/ is split into subdirectories:

- `finance/` — HeroCard, SummaryView, TransactionView, MemberView, TxEntry, TransactionList
- `recurring/` — RecurringSection (+ RecurringSection.css)
- `settings/` — OwnerSettingsSection, ParticipantsSection, IncomePrivacySection, MembersSection, CategoryManager, ColorThemeSection, AutomationSection, ExportSection, EditMemberModal, WebhookLogModal (+ WebhookLogModal.css)
- `(root)` — AppHeader, AppNav, AddMemberModal, EditTransactionModal, LogsSection, SettingsView, SyncOnlineBar
  - Note: `AddTransactionModal.tsx` was deleted (orphaned component). `AddTransactionModal.css` stays — used by EditTransactionModal.
- `components/ui/` — LanguageToggle moved here (was in components/)

**Why:** REFACTOR_PLAN.md task 16 — logical grouping by feature domain.

**How to apply:** When adding a new component, place it in the appropriate subdirectory. When importing, paths are one level deeper (use `../../ui/` not `../ui/` from within finance/).
