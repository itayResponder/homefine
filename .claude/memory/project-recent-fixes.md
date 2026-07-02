---
name: project-recent-fixes
description: Small fixes and enhancements — formatCurrency decimals, TransactionList members prop, color sync to member records (June 2026); HeroCard color revert (July 2026)
metadata:
  type: project
---

## 2026-07 — HeroCard colors reverted to uniform white
`src/components/app/finance/HeroCard.tsx` — removed the `balanceColor` helper and every inline `style={{ color: ... }}` that switched between green (`#86efac`) and red (`#fca5a5`) based on positive/negative. All 5 spots (מאזן חודשי, עו"ש עכשיו, עו"ש עתידי, and the הוצ׳/הכנ׳/מאזן lines in each member's box) now render in plain white, inherited from `.hero { color: #fff }`.
- Minus sign (`−`) and ₪ sign are unaffected — those come from `<Money sign="...">`, not from color.
- The checking-balance "no value yet" placeholder state (`rgba(255,255,255,0.4)`) is preserved.
- The minus-toggle button (`hbal-sign-btn--active`, red highlight when active) is unaffected — that's a UI active-state indicator, not a positive/negative color, and was explicitly out of scope.
- **Scope was Hero only** — SummaryView, TransactionView, MemberView, and TxEntry still use green/red for positive/negative amounts; user asked only about the Hero card.

## 2026-07 — Billing cycle + income cycle for finance month filtering
See dedicated file: [project-billing-cycle.md](project-billing-cycle.md) for full details. Short version: the finance `month` state stopped meaning a plain calendar month. Expenses now use a 10th-to-10th credit-card-style cycle; income uses a separate calendar-month+1 cycle, applied via a single `isInFinanceCycle()` entry point in `src/utils/date.ts` across HeroCard/TransactionView/SummaryView/MemberView.

---

## Three changes made 2026-06-14

**`formatCurrency` decimal support** (`src/utils/format.ts`)
- Integer amounts render without decimals: `1,000 ₪`
- Non-integer amounts render with 2 decimal places: `1,000.50 ₪`
- Previously `Math.round()` was used — all amounts were truncated to integers.

**`TransactionList` requires `members: Member[]`** (`src/components/app/finance/TransactionList.tsx`)
- Both `ListProps` and `ItemProps` now include `members: Member[]`
- `TransactionItem` renders a per-member color chip in `ap-tx-sub` (same `wtag` style as `TxEntry`)
- Chip style: `background: member.color + '20', color: member.color`; shared → gray `#F5F5F4 / #78716C`
- CSS class `.ap-tx-member-tag` in `TransactionList.css`
- **Note:** `TransactionList` is exported but currently has no callers — must pass `members` when wiring it up.

**`updateColor` syncs `member.color`** (`src/hooks/useUserColor.ts`)
- After writing to `userPrefs/{uid}/primaryColor`, loops over all households the user belongs to
- Finds the member entry where `member.userId === uid` and calls `updateMember(householdId, memberId, { color })`
- Fire-and-forget (no await at call site); uses `getUserHouseholdIds`, `get`, `ref`, `db`, `updateMember`

**Why:** Member chip colors in TransactionList/TxEntry were static at card-creation time; changing theme color had no effect on existing member records.

**How to apply:** When calling `TransactionList`, always pass `members`. When showing member chip colors anywhere, rely on `member.color` (kept in sync by `updateColor`).
