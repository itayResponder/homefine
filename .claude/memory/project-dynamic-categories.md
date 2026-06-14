---
name: project-dynamic-categories
description: Per-household dynamic categories — Firebase path, seeding, components, helpers
metadata:
  type: project
---

Categories are per-household and fully dynamic.

**Firebase path:** `households/{id}/categories/{catId}` → `{ name, nameEn, icon, order }`

**Seeding:** `useCategories(householdId)` auto-seeds the 20 defaults on first load if the path is empty. Also patches existing households: adds `automation` if missing, changes `electricity` icon from ⚡ to 💡 if stale. Uses `seedSingleCategory` + `updateCategory` from `db.ts`.

**Special category — `automation`:** id=`automation`, icon=⚡, name=אוטומציה/Automation, order=19. Used automatically for all Google Wallet webhook transactions. `electricity` now uses 💡 (was ⚡).

**CRUD:** `addCategory`, `updateCategory`, `deleteCategory` exported from `src/firebase/db.ts`. Hook: `src/hooks/useCategories.ts`. All exposed via `HouseholdContextType`.

**Type:** `TransactionCategory` is now `string` (was a 19-value union). `Category` interface: `{ id, name, nameEn, icon, order }`.

**Helpers** (`src/utils/categories.ts`):
- `getCatIcon(categories, id)` — returns emoji; falls back to `CATEGORY_ICONS` static map then '❓'
- `getCatName(categories, id, locale)` — returns name in correct language
- `categoriesToOptions(cats, locale)` — builds `{ value, label }[]` for CustomSelect

**UI:**
- `CategoryManager` (`src/components/app/settings/CategoryManager.tsx` + `.css`) — **rewritten 2026-06-14** to use `CategorySelect` for full UI consistency; shows inline grid (reuses `csel-*` CSS classes); "+ הוסף" and ✏️ buttons open `CategorySelect` modal in add/edit mode via `defaultOpen`/`defaultMode`/`defaultEditId`/`onClose` props
- `EmojiPicker` (`src/components/ui/EmojiPicker.tsx` + `.css`) — grid of ~70 curated emojis in `EMOJI_GROUPS` (from `src/constants/categories.ts`), grouped by theme; each group has `label` (Hebrew) + `labelEn` (English); search filters by both; backdrop closes picker. Supports `inline?: boolean` — renders without portal/backdrop/fixed positioning; emoji click calls `onChange` only (no close); used by CategorySelect wizard step 1.
- `CategorySelect` (`src/components/ui/CategorySelect.tsx` + `.css`) — **the standard category picker for all transaction forms**; bottom sheet on mobile, centered modal on desktop; has search, category grid; add/edit uses **2-step wizard** (no floating EmojiPicker popup): step 1 = inline EmojiPicker fills modal + "הבא" / ביטול; step 2 = icon preview button (click → back to step 1) + Hebrew/English name fields + Save/Cancel/Delete. Add mode starts at step 1; edit mode starts at step 2. Trigger styled identically to `CustomSelect`; X button to close; `error?: boolean` prop; `onUpdateCategory?` / `onDeleteCategory?` for in-modal edit/delete; `defaultOpen`/`defaultMode`/`defaultEditId`/`onClose` for management mode.

**All consumers** receive `categories: Category[]` as prop: `TransactionView`, `RecurringSection`, `TxEntry`, `TransactionList`, `SummaryView`, `MemberView`, `EditTransactionModal`, `SettingsView`.

**`onAddCategory` / `onUpdateCategory` / `onDeleteCategory` props:** `TransactionView`, `EditTransactionModal`, and `RecurringSection` all receive all three from `AppPage` (which pulls `addCategory`, `updateCategory`, `deleteCategory` from `useHouseholdContext()`).

**Why:** User wanted per-household add/edit/delete of categories with emoji icons. Option A (full Firebase) was chosen over code-based overrides for cleaner data model.

**How to apply:** Use `CategorySelect` (not `CustomSelect` + `categoriesToOptions`) for all category fields in transaction forms. Use `getCatIcon/getCatName` for display-only contexts (e.g. `RecurringItem`, `TxEntry`).
