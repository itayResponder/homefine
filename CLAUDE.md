# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start Vite dev server
npm run build      # tsc type-check + Vite production build
npm run lint       # ESLint
firebase deploy --only hosting   # deploy to Firebase Hosting (after build)
```

TypeScript type-check only (no emit):
```bash
npx tsc --noEmit
```

## Architecture

### Stack
React 19 + TypeScript + Vite, Firebase Realtime Database (not Firestore), Firebase Auth (Google OAuth), React Router v7, deployed to Firebase Hosting.

### Data flow
All app data lives in Firebase Realtime Database via real-time subscriptions. Every data hook (`useMembers`, `useTransactions`, `useRecurring`, `useLogs`) opens a Firebase `onValue` listener on mount and exposes a `ready: boolean` that flips `true` after the first snapshot. `AppPage` waits for all hooks + `useUserColor` to be ready before rendering, preventing flash of empty data.

### Routing
`BrowserRouter` (no basename — Firebase Hosting serves from `/`). Two routes: `/` → `LandingPage`, `/app` → `AppPage` (auth-gated).

### Authentication & whitelist
`useAuth` uses `onAuthStateChanged`. A hardcoded email whitelist in `useAuth.ts` blocks unauthorized accounts. `document.documentElement.dir` and `lang` are set reactively by `I18nProvider` based on the selected language (`he`→RTL, `en`→LTR).

### Per-user color theming
`useUserColor(uid)` reads the primary color from `localStorage` first (instant, no flash), then syncs with `userPrefs/{uid}/primaryColor` in Firebase. `buildColorVars(hex)` in `src/utils/color.ts` derives all CSS variables (`--ac`, `--acd`, `--acl`, `--ib`, `--ibg`, `--bg`) from one hex value. These are applied as inline `style` on the `.ap-root` div in `AppPage`.

### Currency formatting
Always use `<Money amount={n} sign="−" />` (from `src/components/ui/Money.tsx`) for JSX, or `formatCurrency(n, dir, sign)` for string contexts. Format is always `−1,000 ₪` (sign left, number, ₪ right) regardless of language. Wrap in `<span dir="ltr">` to prevent bidi reordering.

### Recurring charges
`RecurringCharge` stores `startYearMonth` (YYYY-MM), `monthCount`, and `dayOfMonth`. `applyRecurring` in `src/utils/recurring.ts` is called via a debounced `useEffect` (600ms) in `AppPage` — debounce prevents duplicate transactions from Firebase firing `onValue` twice after a write. A module-level `inProgress` Set provides an additional guard.

### CSS variables & direction-aware CSS
Use `inset-inline-end` / `inset-inline-start` for positioned elements that need to respect RTL/LTR direction — `document.documentElement.dir` is set so logical CSS properties work correctly. For mobile-only overrides, prefer a `min-width` desktop media query over a `max-width` mobile query when the base style should be mobile-first.
