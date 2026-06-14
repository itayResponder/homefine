---
name: project-recent-fixes
description: Small fixes and enhancements done June 2026 — formatCurrency decimals, TransactionList members prop, color sync to member records
metadata:
  type: project
---

Three changes made 2026-06-14 (current session):

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
