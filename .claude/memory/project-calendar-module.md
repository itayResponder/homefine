---
name: project-calendar-module
description: Architecture and component map for the shared calendar feature (יומן משותף)
metadata: 
  node_type: memory
  type: project
  originSessionId: eb7236b0-8ba8-4d79-bac5-4235275538de
---

Shared household calendar added as third tab in HouseholdLayout at `/app/:householdId/calendar`.

**Why:** User wanted a real-time shared calendar for household events alongside finance and home-management tabs.

**How to apply:** When extending the calendar, follow the same pattern as AppPage / HouseholdPage — `CalendarPage` is a route child of `HouseholdLayout`, reads shared state via `useHouseholdContext()`, owns its own `useCalendarEvents` hook.

## Firebase path
`households/{householdId}/events/{eventId}` — member read/write (same rules as tasks/transactions).

## Component map
```
CalendarPage.tsx          ← route handler, owns modal state + month navigation state
├── CalendarHeader.tsx    ← toolbar: today / prev-next / add button
├── CalendarGrid.tsx      ← 7-col grid, builds day list, fans out events per day
│   └── CalendarDay.tsx   ← single day cell with event pills + "+N more"
└── EventModal.tsx        ← create / edit / delete modal
useCalendarEvents.ts      ← Firebase onValue hook → CalendarEvent[]
firebase/calendarDb.ts    ← subscribe / add / update / delete helpers
```

## Data model (CalendarEvent in src/types/index.ts)
- `startDate` / `endDate` — "YYYY-MM-DD"; equal = single-day, different = multi-day span
- `startTime` / `endTime` — "HH:MM"; omit both for all-day
- `participants: string[]` — uid list; empty = everyone in household
- `color` — hex; default = creator's primaryColor
- `recurring?: { frequency, until? }` — weekly / monthly / yearly

## CSS
All calendar styles in `src/components/calendar/CalendarPage.css` (cal-* prefix). Do NOT mix with AppPage.css.

## i18n
Calendar strings live under `t.calendar.*` in all three i18n files (types.ts, he.ts, en.ts).
