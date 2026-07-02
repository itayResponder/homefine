---
name: project-billing-cycle
description: Billing cycle (10th-to-10th, credit-card style) for expenses + separate income cycle (calendar month +1) for income; replaces plain calendar-month filtering across all finance views; single entry point isInFinanceCycle()
metadata:
  type: project
---

## Why
Itay's credit card charges download on the 10th of each month, covering purchases from the 10th of the previous month through the 9th. Plain calendar-month filtering (`tx.date.startsWith(month)`) didn't match this. Introduced 2026-07.

## Expense cycle (billing cycle)
`src/utils/date.ts`:
- `BILLING_CYCLE_DAY = 10` — hardcoded for all users for now. **Planned (not yet built):** per-user `userPrefs/{uid}/billingCycleDay`, chosen between 1 / 10 / 15 at household creation, household join, and in Settings; default 10.
- `getBillingCycleLabel(dateISO)` — day >= 10 → next month's label; day < 10 → current month's label
- `getBillingCycleRange(monthLabel)` → `{ start, end }` ISO date strings; `end` is exclusive (belongs to the next cycle)
- `isInBillingCycle(dateISO, monthLabel)`
- `currentBillingCycle()` — replaces `currentMonth()` for the finance `month` state (`AppPage.tsx`: `useState(currentBillingCycle)`)
- Example: cycle labeled "יולי 2026" = `2026-06-10` through `2026-07-09` inclusive. `2026-07-10` itself belongs to "אוגוסט 2026".

## Income cycle
Salary/income doesn't follow the card-charge schedule — it typically lands early in the month (often before the 10th), and should be visible as "money available to cover" the cycle that follows it, not the one it happened to fall inside of under the 10-day rule.
- `getIncomeCycleLabel(dateISO)` — income dated **anywhere** in calendar month X (any day, not just before the 10th) always shows under cycle label X+1
- `isInIncomeCycle(dateISO, monthLabel)`
- Examples: income dated `2026-06-03` **or** `2026-06-25` → both show under "יולי 2026". Income dated `2026-07-07` → shows under "אוגוסט 2026".
- No overlap between adjacent income cycles — each date maps to exactly one label, so there's no double-counting risk (unlike a naive "01/06–10/07" style range, which was considered and rejected for exactly this reason).

## Single entry point — always use this
```ts
export function isInFinanceCycle(dateISO: string, type: 'income' | 'expense', monthLabel: string): boolean {
    return type === 'income'
        ? isInIncomeCycle(dateISO, monthLabel)
        : isInBillingCycle(dateISO, monthLabel)
}
```
**Never call `isInBillingCycle` / `isInIncomeCycle` directly from view components** — always go through `isInFinanceCycle`, so expense/income transactions are always routed to the right rule automatically.

## Where it's applied
Replaces `tx.date.startsWith(month)` in exactly 4 places (all filter the same `month: string` YYYY-MM state owned by `AppPage.tsx`):
- `HeroCard.tsx` — `monthlyTxs`
- `TransactionView.tsx` — `monthTxs` (already knows `tx.type === type` from its `type` prop)
- `SummaryView.tsx` — `monthTxs`
- `MemberView.tsx` — `memberTxs`

**The HeroCard month-picker UI is unchanged** — arrows, year nav, month grid (`mp-pop`, `mp-grid`, `pickMonth`, `navYear`) already worked with a `YYYY-MM` label and needed zero changes; only the meaning of "which transactions belong to this label" changed.

## Explicitly out of scope
- `useRecurringAutoApply.ts` — decides which calendar month to auto-create a recurring charge in. Separate concern (data creation, not display filtering); still plain calendar-month math.
- `src/components/calendar/**`, `CalendarPage.tsx` — general household calendar (tasks/events), unrelated to finance.

## Known open question (raised, not yet resolved)
Whether `checkingBalance` (the manually-entered "current real bank balance" in HeroCard, `userPrefs/{uid}/householdBalance/{householdId}`) already implicitly includes income that's *also* being counted in the cycle's net (`myBalance`) — a potential double-count, depending on exactly when/how the user fills that field relative to real deposits. Not addressed yet — revisit if "יתרה עתידית" numbers look off to the user.

## Design history (for context if this needs revisiting)
1. First considered: single billing-cycle rule (10-10) for both income and expense. Rejected for income because salary landing before the 10th (e.g. 3/6) showed under the "wrong" month from the user's perspective.
2. Considered: income cycle = `01/(month-1)` to `10/month` (matching the expense cycle's end boundary). Rejected — creates a 9-day overlap between adjacent months' income cycles, causing the same income transaction to double-count across two cycles.
3. Considered: income cycle = full calendar month, offset by one from the expense-cycle label (e.g. income cycle "יולי" = `01/06`–`30/06`). Close, but still tied unnecessarily to the 10-day boundary.
4. **Final:** income cycle = calendar month of the transaction + 1, with no day-of-month distinction at all. Simplest, fully consistent, zero overlap. Confirmed with the user via a concrete walkthrough (real date 07/07 vs. manually faking the date as 10/07 — faking it would have pushed the transaction to the *wrong* cycle, which is why the real-date-based rule was chosen instead of any date-entry workaround).
