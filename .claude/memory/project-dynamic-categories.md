---
name: project-dynamic-categories
description: Per-household dynamic categories — Firebase path, seeding, components, helpers
metadata:
  type: project
---

Categories are per-household and fully dynamic.

**Firebase path:** `households/{id}/categories/{catId}` → `{ name, nameEn, icon, order }`

**Seeding:** `useCategories(householdId)` auto-seeds the 19 defaults on first load if the path is empty. Default IDs match the old hardcoded union (`rent`, `electricity`, etc.) so existing transactions display correctly.

**CRUD:** `addCategory`, `updateCategory`, `deleteCategory` exported from `src/firebase/db.ts`. Hook: `src/hooks/useCategories.ts`. All exposed via `HouseholdContextType`.

**Type:** `TransactionCategory` is now `string` (was a 19-value union). `Category` interface: `{ id, name, nameEn, icon, order }`.

**Helpers** (`src/utils/categories.ts`):
- `getCatIcon(categories, id)` — returns emoji; falls back to `CATEGORY_ICONS` static map then '❓'
- `getCatName(categories, id, locale)` — returns name in correct language
- `categoriesToOptions(cats, locale)` — builds `{ value, label }[]` for CustomSelect

**UI:**
- `CategoryManager` (`src/components/app/CategoryManager.tsx` + `.css`) — chip list + add/edit form; lives inside SettingsView categories fcard; all members can manage
- `EmojiPicker` (`src/components/ui/EmojiPicker.tsx` + `.css`) — grid of ~70 curated emojis in `EMOJI_GROUPS` (from `src/constants/categories.ts`), grouped by theme; search input; backdrop closes picker

**All consumers** receive `categories: Category[]` as prop: `TransactionView`, `RecurringSection`, `TxEntry`, `TransactionList`, `SummaryView`, `MemberView`, `AddTransactionModal`, `EditTransactionModal`, `SettingsView`.

**Why:** User wanted per-household add/edit/delete of categories with emoji icons. Option A (full Firebase) was chosen over code-based overrides for cleaner data model.

**How to apply:** Never hardcode category options — always use `categoriesToOptions(categories, t.locale)` for dropdowns and `getCatIcon/getCatName` for display.
